from datetime import datetime
from typing import Dict, Any, List, TypeVar, Optional, Callable, Awaitable
from economy.commands.base import EconomyCommand
from database.tables import Server, Server_Channels, Wallet, User, Transaction
from database.ledger import Ledger
from economy.commands.create_commands import CreateUser
from economy.commands.transactions import MintCommand, TransferCommand
import uuid
import math
import asyncio

T = TypeVar("T")

class EmissionCommand(EconomyCommand[Dict[str, Any]]):
    """
    Команда эмиссии на основе активности пользователей.
    Рассчитывает вознаграждения на основе длины сообщений, реакций и вложений
    с учетом весов каналов.
    """
    def __init__(
        self, 
        ledger: Ledger, 
        server_id: int, 
        from_time: datetime, 
        to_time: datetime,
        on_progress: Optional[Callable[[str, str, Any], Awaitable[None]]] = None,
        orchestrator: Optional[Any] = None
    ):
        self.ledger = ledger
        self.server_id = server_id
        self.from_time = from_time
        self.to_time = to_time
        self.on_progress = on_progress
        self.orchestrator = orchestrator

    async def log_progress(self, msg: str, level: str = "INFO", details: Any = None):
        if self.on_progress:
            await self.on_progress(msg, level, details)

    async def validate(self) -> None:
        """
        Проверяем существование сервера в базе данных.
        """
        server = await self.ledger.repository(Server).get(self.server_id)
        if not server:
            raise ValueError(f"Server with ID {self.server_id} not found in database.")

    async def _get_server_channels(self) -> List[Server_Channels]:
        """
        Получаем список настроенных каналов для данного сервера.
        """
        return await self.ledger.repository(Server_Channels).find().where(Server_Channels.server_id == self.server_id).all()
    
    async def _get_server_settings(self) -> Dict[str, Any]:
        """
        Получаем настройки экономики сервера.
        """
        server = await self.ledger.repository(Server).get(self.server_id)
        return server.settings if server else {}

    async def _get_or_create_user_wallet(self, user_id: int) -> Wallet:
        """
        Получает кошелек пользователя или создает нового через команду CreateUser.
        """
        user_repo = self.ledger.repository(User)
        wallet_repo = self.ledger.repository(Wallet)
        
        user = await user_repo.get(user_id)
        if not user:
            # Используем нашу новую команду для создания пользователя и кошелька
            user = await CreateUser(self.ledger, user_id=user_id).execute()
        
        return await wallet_repo.get(user.wallet_id)

    def _calculate_channel_length_bonus(self, koef: float = 1.0, user_avg_len: float = 0.0, channel_avg_len: float = 0.0):
        if channel_avg_len <= 0:
            return 0.0
        k_len = koef * math.log(user_avg_len/channel_avg_len + 1)
        return k_len

    async def _fetch_user_infos(self, user_ids: List[int]) -> Dict[int, Dict[str, str]]:
        """Запрашивает информацию о пользователях у бота."""
        infos = {}
        if self.orchestrator and self.orchestrator.bus:
            try:
                # Запрашиваем пачкой через шину
                res = await self.orchestrator.bus.ask("get_users_info", guild_id=self.server_id, user_ids=user_ids, timeout=5.0)
                if isinstance(res, dict) and "error" not in res:
                    for uid, info in res.items():
                        infos[int(uid)] = info
            except Exception as e:
                print(f"Error fetching users info: {e}")
        return infos

    async def execute(self) -> Dict[str, Any]:
        """
        Основной цикл расчета эмиссии.
        """
        await self.log_progress(f"🚀 Запуск процесса эмиссии для сервера {self.server_id}", level="INFO")
        
        server = await self.ledger.repository(Server).get(self.server_id)
        if not server:
            raise ValueError(f"Server {self.server_id} not found during execution")
            
        settings = server.settings
        db_channels = await self._get_server_channels()
        
        # 1. Подготовка каналов - фильтруем только те, у которых вес > 0
        channel_weights = {c.channel_id: c.weight for c in db_channels if c.weight > 0}
        channel_ids = list(channel_weights.keys())
        
        if not channel_ids:
            await self.log_progress(f"⚠️ Для сервера {self.server_id} не настроены каналы с положительным весом для эмиссии", level="WARNING")
            return {"distributable": 0.0, "rewards": {}, "total_emission": 0.0}
            
        await self.log_progress(f"📡 Запрос активности из Discord для {len(channel_ids)} активных каналов...", details={"channels": channel_ids})
        
        # 2. Получение активности (увеличиваем таймаут для больших серверов)
        if not self.orchestrator or not self.orchestrator.bus:
            await self.log_progress("❌ Ошибка: Оркестратор или шина недоступны", level="ERROR")
            return {"distributable": 0.0, "rewards": {}, "total_emission": 0.0}

        server_activity = await self.orchestrator.bus.ask(
            "get_server_activity", 
            guild_id=self.server_id, 
            from_time=self.from_time, 
            to_time=self.to_time, 
            channels=channel_ids,
            timeout=120.0 # Увеличиваем до 2 минут для тяжелых запросов
        )
        
        if not server_activity or "error" in server_activity:
            await self.log_progress("❌ Ошибка при получении данных об активности", level="ERROR", details=server_activity)
            return {"distributable": 0.0, "rewards": {}, "total_emission": 0.0}

        users_count = len(server_activity.get("users_pie", {}))
        await self.log_progress(f"📊 Получены данные об активности. Найдено активных пользователей: {users_count}")

        # 3. Расчет пула эмиссии
        pool_data = self._calculate_emission_pool(server_activity, settings)
        if pool_data["total_emission"] <= 0:
            await self.log_progress("ℹ️ Активность отсутствует, эмиссия не требуется", level="SUCCESS")
            return {"distributable": 0.0, "rewards": {}, "total_emission": 0.0}

        await self.log_progress(f"💰 Рассчитан объем эмиссии: {pool_data['total_emission']} OMC", details=pool_data)

        transaction_group_id = int(uuid.uuid4().int >> 96)

        # 4. Печать денег сервером
        await self.log_progress("🏦 Печать валюты сервером (Mint)...")
        await asyncio.sleep(1.5) # Задержка для визуализации
        
        # Округляем общую эмиссию до сотых
        total_to_mint = round(pool_data["total_emission"], 2)
        
        await MintCommand(
            self.ledger, 
            wallet_id=server.wallet_id, 
            amount=total_to_mint, 
            description=f"Эмиссия активности за {self.from_time.date()}",
            transaction_group_id=transaction_group_id,
            tag="emission_gain"
        ).execute()

        # 5. Скоринг пользователей
        await self.log_progress("🧠 Расчет индивидуальных баллов активности (Scoring)...")
        await asyncio.sleep(2.0) # Задержка для визуализации
        user_scores = self._score_users(server_activity, channel_weights, settings)
        
        # Запрашиваем информацию о пользователях для лога
        uids = [int(uid) for uid in list(user_scores.keys())[:20]]
        user_infos = await self._fetch_user_infos(uids)

        # Детальный лог скоринга для фронтенда
        scoring_details = []
        for author_id, score in list(user_scores.items())[:15]:
            info = user_infos.get(author_id, {})
            # Собираем статистику по каналам для этого юзера
            user_stats_summary = []
            for ch_id, ch_data in server_activity.get("channels_pie", {}).items():
                if str(author_id) in ch_data:
                    s = ch_data[str(author_id)]
                    user_stats_summary.append({
                        "channel_id": str(ch_id),
                        "messages": s["messages_count"],
                        "reactions": s["reactions_count"],
                        "attachments": s["attachments_count"]
                    })

            scoring_details.append({
                "author_id": str(author_id),
                "author_name": info.get("name", f"User {str(author_id)[-4:]}"),
                "author_avatar": info.get("avatar"),
                "score": round(score, 2),
                "stats": user_stats_summary
            })
        await self.log_progress("📊 Скоринг завершен", level="INFO", details={"scoring": scoring_details})
        
        # 6. Распределение наград
        await self.log_progress(f"💸 Распределение {pool_data['distributable']} OMC между пользователями...")
        # Передаем данные пула для визуализации минтинга
        await self.log_progress("🏦 Монетарный пул сформирован", level="INFO", details={
            "minted": pool_data["total_emission"],
            "reserve": pool_data["total_emission"] - pool_data["distributable"],
            "distributable": pool_data["distributable"]
        })

        rewards_report = await self._distribute_rewards(
            user_scores, 
            pool_data["distributable"], 
            server.wallet_id, 
            transaction_group_id,
            server_activity
        )

        # 7. Финализация
        server.last_emission = datetime.now()
        
        # Подготавливаем финальный отчет с аватарками
        final_payouts = []
        for author_id, stats in list(rewards_report.items())[:20]:
            info = user_infos.get(author_id, {})
            final_payouts.append({
                "author_id": str(author_id),
                "author_name": info.get("name", f"User {str(author_id)[-4:]}"),
                "author_avatar": info.get("avatar"),
                "score": round(stats.get("score", 0), 2),
                "weight": 1.0, # В будущем можно добавить реальный вес
                "reward": round(stats.get("reward", 0), 2)
            })

        await self.log_progress("✅ Эмиссия успешно завершена", level="SUCCESS", details={
            "total_distributed": pool_data["distributable"],
            "user_count": len(user_scores),
            "payouts": final_payouts
        })

        return {
            "distributable": pool_data["distributable"],
            "rewards": rewards_report,
            "total_emission": pool_data["total_emission"],
            "group_id": transaction_group_id
        }

    def _calculate_emission_pool(self, server_activity: Dict[str, Any], settings: Dict[str, Any]) -> Dict[str, float]:
        """Расчет общего объема эмиссии и суммы к распределению."""
        users_count = len(server_activity.get("users_pie", {}))
        if users_count == 0:
            return {"total_emission": 0.0, "distributable": 0.0}

        monetary = settings.get("monetary", {})
        budget_per_user = monetary.get("base_emission_per_user", 1000)
        reserve_percent = monetary.get("reserve_percent", 0.1)
        
        total_emission = users_count * budget_per_user
        reserved = total_emission * reserve_percent
        distributable = total_emission - reserved
        
        return {
            "total_emission": total_emission,
            "distributable": distributable
        }

    def _score_users(self, server_activity: Dict[str, Any], channel_weights: Dict[int, float], settings: Dict[str, Any]) -> Dict[int, float]:
        """Расчет баллов активности для каждого пользователя с учетом каскадных весов."""
        user_scores: Dict[int, float] = {}
        filters = settings.get("filters", {})
        parents_map = server_activity.get("parents_map", {})
        
        length_weight = filters.get("message_length_weight", 0.5)
        reaction_bonus = filters.get("reaction_bonus", 0.5)
        media_bonus = filters.get("score_bonus_per_media", 0.5)

        for ch_id_str, ch_stats in server_activity.get("channels_pie", {}).items():
            ch_id = int(ch_id_str)
            
            # --- РАСЧЕТ МУЛЬТИПЛИКАТИВНОГО ВЕСА ---
            # Итоговый вес = Вес(Треда) * Вес(Канала) * Вес(Категории)
            weight = 1.0
            curr_id = ch_id
            visited = set()
            
            while curr_id:
                if curr_id in visited: break
                visited.add(curr_id)
                
                # Умножаем на вес текущего уровня (если нет в БД, считаем за 1.0)
                level_weight = channel_weights.get(curr_id, 1.0)
                weight *= level_weight
                
                # Поднимаемся выше по иерархии
                curr_id = parents_map.get(curr_id)
            
            if weight <= 0: continue # Если на любом уровне вес 0, канал исключается

            # Средняя длина в канале
            all_lens = []
            for s in ch_stats.values():
                all_lens.extend(s.get("messages_lengths", []))
            ch_avg_len = sum(all_lens) / len(all_lens) if all_lens else 0
            
            for author_id_str, stats in ch_stats.items():
                author_id = int(author_id_str)
                
                # Базовые баллы за количество сообщений
                msg_score = stats["messages_count"]
                
                # Бонус за длину
                user_avg_len = sum(stats["messages_lengths"]) / len(stats["messages_lengths"]) if stats["messages_lengths"] else 0
                len_bonus = self._calculate_channel_length_bonus(length_weight, user_avg_len, ch_avg_len)
                
                # Бонусы за реакции и медиа
                react_score = stats["reactions_count"] * reaction_bonus
                media_score = stats["attachments_count"] * media_bonus
                
                # Итоговый скор за канал с учетом веса канала
                channel_user_score = (msg_score + len_bonus + react_score + media_score) * weight
                
                user_scores[author_id] = user_scores.get(author_id, 0.0) + channel_user_score
                
        return user_scores

    async def _distribute_rewards(
        self, 
        user_scores: Dict[int, float], 
        pool: float, 
        server_wallet_id: int, 
        group_id: int,
        server_activity: Dict[str, Any]
    ) -> Dict[int, Dict[str, Any]]:
        """Проведение транзакций и формирование отчета."""
        total_score = sum(user_scores.values())
        if total_score <= 0:
            return {}

        report = {}
        for author_id, score in user_scores.items():
            share = score / total_score
            # Округляем награду до сотых
            reward = round(share * pool, 2)
            
            if reward <= 0: continue

            user_wallet = await self._get_or_create_user_wallet(author_id)
            
            await TransferCommand(
                self.ledger,
                sender_wallet_id=server_wallet_id,
                receiver_wallet_id=user_wallet.id,
                amount=reward,
                description=f"Награда за активность {self.from_time.date()}",
                transaction_group_id=group_id,
                sender_tag="activity_pay",
                receiver_tag="activity_gain"
            ).execute()
            
            # Статистика для отчета
            activity = server_activity.get("users_pie", {}).get(author_id, {})
            report[author_id] = {
                "reward": reward,
                "score": score,
                "stats": {
                    "messages": activity.get("messages_count", 0),
                    "avg_len": activity.get("content_length", {}).get("avg", 0),
                    "reactions": activity.get("reactions_count", 0),
                    "attachments": activity.get("attachments_count", 0)
                }
            }
            
        return report
