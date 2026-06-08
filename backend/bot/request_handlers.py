from datetime import datetime
import discord
import asyncio
import re
from typing import Dict, Any, Optional, List
from backend.system_bus.base import on_request, Request

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

    @on_request("get_guild_info")
    async def get_guild_info(self, request: Request) -> Dict[str, Any]:
        """Возвращает базовую информацию о сервере (имя, иконка)."""
        guild_id = request.get("guild_id")
        if not guild_id:
            return {"error": "Missing guild_id"}
        
        try:
            guild = self.bot.get_guild(int(guild_id))
            if not guild:
                guild = await self.bot.fetch_guild(int(guild_id))
            
            if not guild:
                return {"error": "Guild not found"}
            
            return {
                "id": str(guild.id),
                "name": guild.name,
                "icon_url": str(guild.icon.url) if guild.icon else None,
                "member_count": guild.member_count
            }
        except Exception as e:
            return {"error": str(e)}

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
        channels_pie = {} # Детальная разбивка по источникам (каналам/тредам)
        parents_map = {} # Карта родителей для каскадного расчета весов
        total_messages = 0

        for channel, result in zip(channels_to_process, results):
            if not result or "activity" not in result: continue
            
            # Сохраняем иерархию
            parents_map.update(result.get("parents", {}))
            
            # Обрабатываем активность по каждому источнику (канал/тред)
            for source_id, source_data in result["activity"].items():
                channels_pie[source_id] = source_data
                
                for author_id, stats in source_data.items():
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
            if lengths:
                stats["content_length"] = {
                    "max": max(lengths),
                    "min": min(lengths),
                    "total": sum(lengths),
                    "avg": sum(lengths) / len(lengths)
                }
            else:
                stats["content_length"] = {"max": 0, "min": 0, "total": 0, "avg": 0.0}

        return {
            "total_stats": {
                "total_messages": total_messages,
                "unique_users": len(server_pie),
            },
            "users_pie": server_pie,
            "channels_pie": channels_pie,
            "parents_map": parents_map
        }

    @on_request("get_channel_activity")
    async def get_channel_activity(self, request: Request) -> Optional[Dict[str, Any]]:
        async with self._semaphore:
            channel_id = request.get("channel_id")
            channel = self.bot.get_channel(channel_id)
            
            if not channel:
                try:
                    channel = await self.bot.fetch_channel(channel_id)
                except:
                    return {}

            from_time = request.get("from_time")
            to_time = request.get("to_time", datetime.now())
            min_len = request.get("min_message_length", 10)
            spam_cooldown = request.get("spam_cooldown_seconds", 10)
            
            split_trigger_len = request.get("split_trigger_length", 1800)
            substantive_msg_len = request.get("substantive_message_length", 150)

            # --- ЭТАП 1: Собираем все источники сообщений (Канал + Ветки + Форумы) ---
            sources = []
            parents = {} # source_id -> parent_id

            if hasattr(channel, "history") and not isinstance(channel, discord.ForumChannel):
                sources.append(channel)
                # У канала родителем может быть категория
                if hasattr(channel, "category_id") and channel.category_id:
                    parents[channel.id] = channel.category_id

            if isinstance(channel, (discord.TextChannel, discord.ForumChannel)):
                # Добавляем активные ветки
                for thread in channel.threads:
                    sources.append(thread)
                    parents[thread.id] = channel.id
                
                # Добавляем архивные ветки, которые были активны в этот период
                try:
                    async for thread in channel.archived_threads(limit=50):
                        if thread.archive_timestamp and thread.archive_timestamp.replace(tzinfo=None) < from_time:
                            continue
                        sources.append(thread)
                        parents[thread.id] = channel.id
                except discord.Forbidden:
                    pass

            # --- ЭТАП 2: Обход источников и сбор данных ---
            activity_by_source = {}

            for source in sources:
                last_user_message_time = {} 
                last_user_message_len = {}
                source_activity = {}
                samples = [] # Примеры сообщений для визуализации сканирования

                try:
                    async for message in source.history(after=from_time, before=to_time, oldest_first=True, limit=500):
                        if message.author.bot: continue

                        author_id = message.author.id
                        msg_time = message.created_at.replace(tzinfo=None)
                        content_length = self._get_clean_content_length(message.content)
                        has_attachments = len(message.attachments) > 0

                        if author_id in last_user_message_time:
                            time_passed = (msg_time - last_user_message_time[author_id]).total_seconds()
                            if time_passed < spam_cooldown:
                                prev_msg_len = last_user_message_len.get(author_id, 0)
                                is_continuation = (prev_msg_len >= split_trigger_len) or (content_length >= substantive_msg_len)
                                if not is_continuation: continue

                        if content_length < min_len and not has_attachments:
                            continue

                        last_user_message_time[author_id] = msg_time
                        last_user_message_len[author_id] = content_length

                        attachments_count = len(message.attachments)
                        reactions_count = sum(r.count for r in message.reactions)

                        if author_id not in source_activity:
                            source_activity[author_id] = {
                                "messages_count": 0,
                                "messages_lengths": [],  
                                "attachments_count": 0,
                                "reactions_count": 0,
                            }
                        
                        user_stats = source_activity[author_id]
                        user_stats["messages_count"] += 1
                        user_stats["attachments_count"] += attachments_count
                        user_stats["reactions_count"] += reactions_count
                        user_stats["messages_lengths"].append(content_length)

                        # Сохраняем сэмпл сообщения для визуализации
                        sample = {
                            "author_name": message.author.display_name,
                            "author_avatar": str(message.author.display_avatar.url),
                            "content": message.clean_content,
                            "timestamp": message.created_at.isoformat(),
                            "channel_name": source.name,
                            "category_name": getattr(source, "category", None).name if hasattr(source, "category") and source.category else "Без категории"
                        }
                        
                        if len(samples) < 3:
                            samples.append(sample)

                        # Эмитим событие сканирования для фронтенда через системную шину
                        if hasattr(self.bot, "db") and self.bot.db.system_bus:
                            asyncio.create_task(self.bot.db.system_bus.emit(
                                "emission_scan_step", 
                                guild_id=source.guild.id,
                                channel_id=source.id,
                                sample=sample
                            ))
                    
                    if source_activity:
                        activity_by_source[source.id] = source_activity

                except Exception as e:
                    print(f"Ошибка при чтении истории {source}: {e}")
                    continue

            return {
                "activity": activity_by_source,
                "parents": parents
            }

    @on_request("sync_guild_data")
    async def handle_sync_guild_data(self, request: Request) -> Dict[str, Any]:
        """
        Массовая синхронизация участников сервера.
        Использует fetch_members для надежного получения данных.
        """
        guild_id = request.get("guild_id")
        if not guild_id:
            return {"error": "Missing guild_id"}

        guild = self.bot.get_guild(guild_id) or await self.bot.fetch_guild(guild_id)
        if not guild:
            return {"error": "Guild not found"}

        try:
            # Используем fetch_members вместо chunk() для надежности
            members = []
            async for member in guild.fetch_members(limit=None):
                if not member.bot:
                    members.append(member.id)
            
            return {
                "guild_id": guild.id,
                "member_ids": members
            }
        except Exception as e:
            return {"error": f"Failed to fetch members: {e}"}
    
    @on_request("get_guild_channels")
    async def get_guild_channels(self, request: Request) -> Dict[str, Any]:
        """Возвращает список всех каналов сервера с их иерархией."""
        guild_id = request.get("guild_id")
        if not guild_id:
            return {"error": "Missing guild_id"}
        
        try:
            guild = self.bot.get_guild(int(guild_id))
            if not guild:
                guild = await self.bot.fetch_guild(int(guild_id))
            
            if not guild:
                return {"error": "Guild not found"}

            # Если каналов в кеше нет, пробуем их получить принудительно
            all_channels = guild.channels
            if not all_channels:
                all_channels = await guild.fetch_channels()
            
            # Собираем дерево категорий и каналов
            categories = []
            orphan_channels = [] # Каналы без категории
            
            # 0. Собираем активные ветки (threads)
            threads_by_parent = {}
            # В fetch_guild ветки могут отсутствовать, пробуем получить активные
            guild_threads = guild.threads
            if not guild_threads:
                try:
                    # fetch_active_threads возвращает объект с атрибутом threads
                    active_threads_res = await guild.fetch_active_threads()
                    guild_threads = active_threads_res.threads
                except:
                    guild_threads = []

            for thread in guild_threads:
                pid = str(thread.parent_id)
                if pid not in threads_by_parent:
                    threads_by_parent[pid] = []
                threads_by_parent[pid].append({
                    "id": str(thread.id),
                    "name": thread.name,
                    "type": "thread",
                    "position": getattr(thread, 'position', 0)
                })

            def format_channel(channel):
                cid = str(channel.id)
                ctype = "text"
                if channel.type == discord.ChannelType.forum:
                    ctype = "forum"
                elif channel.type in (discord.ChannelType.news_thread, discord.ChannelType.public_thread, discord.ChannelType.private_thread):
                    ctype = "thread"
                elif channel.type == discord.ChannelType.news:
                    ctype = "news"
                
                data = {
                    "id": cid,
                    "name": channel.name,
                    "type": ctype,
                    "position": getattr(channel, 'position', 0),
                    "children": threads_by_parent.get(cid, [])
                }
                return data

            TEXT_TYPES = (
                discord.ChannelType.text,
                discord.ChannelType.news,
                discord.ChannelType.forum
            )

            # 1. Сначала категории
            # Сортируем категории по позиции
            guild_categories = sorted([c for c in all_channels if c.type == discord.ChannelType.category], key=lambda c: c.position)
            
            # Создаем карту каналов по категориям
            channels_by_category = {}
            for ch in all_channels:
                if ch.type in TEXT_TYPES and ch.category_id:
                    cat_id = str(ch.category_id)
                    if cat_id not in channels_by_category:
                        channels_by_category[cat_id] = []
                    channels_by_category[cat_id].append(ch)

            for category in guild_categories:
                cat_id = str(category.id)
                cat_channels = channels_by_category.get(cat_id, [])
                
                if cat_channels:
                    cat_data = {
                        "id": cat_id,
                        "name": category.name,
                        "type": "category",
                        "position": category.position,
                        "children": [format_channel(ch) for ch in sorted(cat_channels, key=lambda x: x.position)]
                    }
                    categories.append(cat_data)
                
            # 2. Каналы без категории
            for channel in all_channels:
                if channel.type in TEXT_TYPES and channel.category_id is None:
                    orphan_channels.append(format_channel(channel))
            
            # Сортируем сирот по позиции
            orphan_channels.sort(key=lambda x: x["position"])
            
            return {
                "categories": categories,
                "orphans": orphan_channels
            }
        except Exception as e:
            import traceback
            print(f"Error in get_guild_channels: {e}")
            traceback.print_exc()
            return {"error": str(e)}
            
            return {
                "categories": categories,
                "orphans": orphan_channels
            }
        except Exception as e:
            return {"error": str(e)}

    @on_request("get_users_info")
    async def get_users_info(self, request: Request) -> Dict[str, Any]:
        """Возвращает информацию о пользователях (имя, аватар)."""
        guild_id = request.get("guild_id")
        user_ids = request.get("user_ids", [])
        if not guild_id: return {"error": "Missing guild_id"}
        
        try:
            guild = self.bot.get_guild(int(guild_id))
            if not guild: guild = await self.bot.fetch_guild(int(guild_id))
            
            results = {}
            for uid in user_ids:
                try:
                    member = guild.get_member(int(uid))
                    if not member: member = await guild.fetch_member(int(uid))
                    
                    results[str(uid)] = {
                        "name": member.display_name,
                        "avatar": str(member.display_avatar.url)
                    }
                except:
                    results[str(uid)] = {"name": f"User {str(uid)[-4:]}", "avatar": None}
            return results
        except Exception as e:
            return {"error": str(e)}

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

