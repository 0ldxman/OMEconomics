from datetime import datetime
import discord
import asyncio
import re
from typing import Dict, Any, Optional, List
from system_bus.base import on_request, Request

class DiscordRequestHandlers:
    """
    Класс для обработки системных запросов через Discord.
    """
    def __init__(self, bot: discord.Client):
        self.bot = bot
        # Ограничиваем количество параллельных запросов к истории каналов, чтобы не ловить 429
        self._semaphore = asyncio.Semaphore(5) 
        # Паттерн для поиска кастомных эмодзи <:name:id> и <a:name:id>
        self._emoji_pattern = re.compile(r'<a?:\w+:\d+>')

    def _get_clean_content_length(self, content: str) -> int:
        """
        Рассчитывает длину сообщения, считая каждый эмодзи за 1 символ.
        """
        if not content:
            return 0
        # Заменяем кастомные эмодзи на один символ
        clean_content = self._emoji_pattern.sub('☺', content)
        return len(clean_content)

    @on_request("get_server_activity")
    async def handle_get_server_activity(self, request: Request) -> Dict[str, Any]:
        """
        Сбор детальной активности по всему серверу.
        Агрегирует данные изо всех каналов, не теряя информацию для эмиссии.
        """
        guild_id = request.get("guild_id")
        working_channels = request.get("channels", [])
        from_time = request.get("from_time")
        to_time = request.get("to_time", datetime.now())
        
        if not guild_id:
            return {"error": "Missing guild_id"}

        guild = self.bot.get_guild(guild_id) or await self.bot.fetch_guild(guild_id)
        if not guild:
            return {"error": "Guild not found"}

        # Определяем список каналов для обработки
        channels_to_process = []
        if working_channels:
            # Если переданы конкретные ID, ищем их
            for cid in working_channels:
                c = guild.get_channel(cid) or self.bot.get_channel(cid)
                if c: channels_to_process.append(c)
        else:
            # Иначе берем все текстовые каналы сервера
            channels_to_process = guild.text_channels

        # Собираем результаты конкурентно
        tasks = []
        for channel in channels_to_process:
            sub_request = Request.create(
                "get_channel_activity", 
                channel_id=channel.id, 
                from_time=from_time,
                to_time=to_time,
            )
            tasks.append(self.get_channel_activity(sub_request))
        
        # Вызываем через gather. Семафор внутри get_channel_activity (5 параллельных)
        # обеспечит защиту от 429, но позволит обрабатывать каналы быстрее.
        results = await asyncio.gather(*tasks)
        
        # --- Агрегация данных ---
        server_pie = {} # Итоговый распределительный пирог (агрегированный)
        channels_pie = {} # Детальная разбивка по каналам (для учета весов)
        total_messages = 0

        # Мы используем zip, чтобы сопоставить результаты с конкретными каналами
        for channel, channel_pie in zip(channels_to_process, results):
            if not channel_pie: continue
            
            # Сохраняем сырой результат канала
            channels_pie[channel.id] = channel_pie
            
            for author_id, stats in channel_pie.items():
                if author_id not in server_pie:
                    server_pie[author_id] = {
                        "messages_count": 0,
                        "messages_lengths": [],
                        "attachments_count": 0,
                        "reactions_count": 0,
                    }
                
                s = server_pie[author_id]
                s["messages_count"] += stats["messages_count"]
                s["attachments_count"] += stats["attachments_count"]
                s["reactions_count"] += stats["reactions_count"]
                s["messages_lengths"].extend(stats["messages_lengths"])
                total_messages += stats["messages_count"]

        # Пост-расчет средних значений для всего сервера
        for author_id, stats in server_pie.items():
            lengths = stats["messages_lengths"]
            stats["content_length"] = {
                "max": max(lengths),
                "min": min(lengths),
                "total": sum(lengths),
                "avg": sum(lengths) / len(lengths)
            }

        return {
            "total_stats": {
                "total_messages": total_messages,
                "unique_users": len(server_pie),
            },
            "users_pie": server_pie, # Агрегированный отчет
            "channels_pie": channels_pie # Детальный отчет по каналам
        }

    @on_request("get_channel_activity")
    async def get_channel_activity(self, request: Request) -> Optional[Dict[str, Any]]:
        async with self._semaphore: # Используем семафор
            channel_id = request.get("channel_id")
            channel = self.bot.get_channel(channel_id)
            
            if not channel:
                try:
                    channel = await self.bot.fetch_channel(channel_id)
                except:
                    return {}

            print(f"   [Bus] Сбор истории: {channel.name if hasattr(channel, 'name') else channel_id}...")

            from_time = request.get("from_time")
            to_time = request.get("to_time", datetime.now())
            min_len = request.get("min_message_length", 10)
            spam_cooldown = request.get("spam_cooldown_seconds", 10)
            
            # Настройки для умного распознавания сплит-постов
            split_trigger_len = request.get("split_trigger_length", 1800)
            substantive_msg_len = request.get("substantive_message_length", 150)

            users_pie = {}

            # --- ЭТАП 1: Собираем все источники сообщений (Канал + Ветки + Форумы) ---
            sources = []
            
            if hasattr(channel, "history") and not isinstance(channel, discord.ForumChannel):
                sources.append(channel)

            if isinstance(channel, (discord.TextChannel, discord.ForumChannel)):
                sources.extend(channel.threads)
                
                try:
                    async for thread in channel.archived_threads(limit=50):
                        if thread.archive_timestamp and thread.archive_timestamp.replace(tzinfo=None) < from_time:
                            continue
                        sources.append(thread)
                except discord.Forbidden:
                    pass

            # --- ЭТАП 2: Обход источников и сбор сырых данных ---
            for source in sources:
                last_user_message_time = {} 
                last_user_message_len = {}

                try:
                    async for message in source.history(after=from_time, before=to_time, oldest_first=True, limit=500):
                        if message.author.bot: 
                            continue

                        author_id = message.author.id
                        msg_time = message.created_at.replace(tzinfo=None)
                        
                        # Считаем длину с учетом фильтрации эмодзи
                        content_length = self._get_clean_content_length(message.content)
                        has_attachments = len(message.attachments) > 0

                        # --- Умная анти-абуз фильтрация ---
                        if author_id in last_user_message_time:
                            time_passed = (msg_time - last_user_message_time[author_id]).total_seconds()
                            
                            if time_passed < spam_cooldown:
                                prev_msg_len = last_user_message_len.get(author_id, 0)
                                is_continuation = (prev_msg_len >= split_trigger_len) or (content_length >= substantive_msg_len)
                                
                                if not is_continuation:
                                    continue # Скипаем мелкий флуд

                        # Проверка на минимальный порог длины
                        if content_length < min_len and not has_attachments:
                            continue

                        # Запоминаем состояние для следующего шага
                        last_user_message_time[author_id] = msg_time
                        last_user_message_len[author_id] = content_length

                        # --- Скоринг и наполнение сырого пирога ---
                        attachments_count = len(message.attachments)
                        
                        # ОПТИМИЗАЦИЯ: Не лезем внутрь каждой реакции через API!
                        # Просто берем сумму counts всех реакций. 
                        # Если автор сам поставил реакцию - это погрешность, которую мы прощаем
                        # ради стабильности системы и защиты от 429.
                        reactions_count = sum(r.count for r in message.reactions)

                        if author_id not in users_pie:
                            users_pie[author_id] = {
                                "messages_count": 0,
                                "messages_lengths": [],  
                                "attachments_count": 0,
                                "reactions_count": 0,
                            }
                        
                        user_stats = users_pie[author_id]
                        user_stats["messages_count"] += 1
                        user_stats["attachments_count"] += attachments_count
                        user_stats["reactions_count"] += reactions_count
                        user_stats["messages_lengths"].append(content_length)
                except discord.Forbidden:
                    continue
                except Exception as e:
                    print(f"Ошибка при чтении истории {source}: {e}")
                    continue

            # --- ЭТАП 3: Пост-расчет агрегированных статистик ---
            for author_id, stats in users_pie.items():
                lengths = stats["messages_lengths"]
                if lengths:
                    stats["content_length"] = {
                        "max": max(lengths),
                        "min": min(lengths),
                        "total": sum(lengths),
                        "avg": sum(lengths) / len(lengths)
                    }
                else:
                    stats["content_length"] = {"max": 0, "min": 0, "total": 0, "avg": 0.0}
            
            return users_pie
    
    @on_request("get_server_users")
    async def get_server_users(self, request: Request) -> Dict[str, Any]:
        guild_id = request.get("guild_id")
        guild = self.bot.get_guild(guild_id)
        if not guild:
            return {}

        # Временные рамки для проверки актива и новичков
        from_time = request.get("from_time")
        to_time = request.get("to_time", datetime.now())

        # Множества для сбора ID (автоматически исключают дубликаты)
        active_users = set()
        all_users = set()
        new_users = set()

        # --- БЛОК 1: Сбор общих пользователей и новичков ---
        for member in guild.members:
            if member.bot:
                continue

            user_id = member.id
            all_users.add(user_id)

            # Проверяем, зашел ли пользователь на сервер в наш промежуток времени
            if member.joined_at:
                joined_at_naive = member.joined_at.replace(tzinfo=None)
                if from_time <= joined_at_naive <= to_time:
                    new_users.add(user_id)

        # --- БЛОК 2: Удален (Дублирование истории каналов) ---
        # Мы больше не сканируем историю здесь. Активные пользователи — это те, 
        # кто попал в отчет get_server_activity. Если нужны онлайн-пользователи,
        # можно добавить проверку member.status.

        # --- БЛОК 3: Формирование чистого ответа ---
        return {
            "active": {
                "total_count": len(active_users),
                "user_ids": list(active_users)
            },
            "total": {
                "total_count": len(all_users),
                "user_ids": list(all_users)
            },
            "new": {
                "total_count": len(new_users),
                "user_ids": list(new_users)
            }
        }

