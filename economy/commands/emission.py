from datetime import datetime
from typing import Dict, Any, List, TypeVar
from economy.commands.base import EconomyCommand
from database.tables import Server, Server_Channels, Wallet, User, Transaction
from database.ledger import Ledger
from economy.commands.create_commands import CreateUser
from economy.commands.transactions import MintCommand, TransferCommand
import uuid
import math

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
    ):
        super().__init__(ledger)
        self.server_id = server_id
        self.from_time = from_time
        self.to_time = to_time

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

    async def execute(self) -> Dict[str, Any]:
        """
        Основной цикл расчета эмиссии.
        """
        server = await self.ledger.repository(Server).get(self.server_id)
        if not server:
            raise ValueError(f"Server {self.server_id} not found during execution")
            
        settings = server.settings
        db_channels = await self._get_server_channels()
        
        # 1. Подготовка каналов
        channel_weights = {c.channel_id: c.weight for c in db_channels}
        channel_ids = list(channel_weights.keys())
        
        if not channel_ids:
            print(f" [Emission] Предупреждение: Для сервера {self.server_id} не настроены каналы для эмиссии.")
            return {"distributable": 0.0, "rewards": {}, "total_emission": 0.0}
            
        print(f" [Emission] Запуск расчета для каналов: {channel_ids}")
        
        # 2. Получение активности
        server_activity = await self.bus.ask(
            "get_server_activity", 
            guild_id=self.server_id, 
            from_time=self.from_time, 
            to_time=self.to_time, 
            channels=channel_ids
        )
        
        if not server_activity or "error" in server_activity:
            return {"distributable": 0.0, "rewards": {}, "total_emission": 0.0}

        # 3. Расчет пула эмиссии
        pool_data = self._calculate_emission_pool(server_activity, settings)
        if pool_data["total_emission"] <= 0:
            return {"distributable": 0.0, "rewards": {}, "total_emission": 0.0}

        transaction_group_id = int(uuid.uuid4().int >> 96)

        # 4. Печать денег сервером
        await MintCommand(
            self.ledger, 
            wallet_id=server.wallet_id, 
            amount=pool_data["total_emission"], 
            description=f"Эмиссия активности за {self.from_time.date()}",
            transaction_group_id=transaction_group_id
        ).execute()

        # 5. Скоринг пользователей
        user_scores = self._score_users(server_activity, channel_weights, settings)
        
        # 6. Распределение наград
        rewards_report = await self._distribute_rewards(
            user_scores, 
            pool_data["distributable"], 
            server.wallet_id, 
            transaction_group_id,
            server_activity
        )

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
        """Расчет баллов активности для каждого пользователя."""
        user_scores: Dict[int, float] = {}
        filters = settings.get("filters", {})
        
        length_weight = filters.get("message_length_weight", 0.5)
        reaction_bonus = filters.get("reaction_bonus", 0.5)
        media_bonus = filters.get("score_bonus_per_media", 0.5)

        for ch_id_str, ch_stats in server_activity.get("channels_pie", {}).items():
            ch_id = int(ch_id_str)
            weight = channel_weights.get(ch_id, 1.0)
            
            # Средняя длина в канале
            all_lens = []
            for s in ch_stats.values():
                all_lens.extend(s.get("messages_lengths", []))
            ch_avg_len = sum(all_lens) / len(all_lens) if all_lens else 0
            
            for author_id, stats in ch_stats.items():
                if author_id not in user_scores:
                    user_scores[author_id] = 0.0
                
                lens = stats.get("messages_lengths", [])
                if not lens: continue

                # Текстовый балл
                avg_len = sum(lens) / len(lens)
                len_bonus = self._calculate_channel_length_bonus(length_weight, avg_len, ch_avg_len)
                text_score = stats.get("messages_count", 0) * (1 + len_bonus)
                
                # Бонусы
                r_score = stats.get("reactions_count", 0) * reaction_bonus
                m_score = stats.get("attachments_count", 0) * media_bonus
                
                user_scores[author_id] += (text_score + r_score + m_score) * weight
                
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
            reward = share * pool
            
            if reward <= 0: continue

            user_wallet = await self._get_or_create_user_wallet(author_id)
            
            await TransferCommand(
                self.ledger,
                sender_wallet_id=server_wallet_id,
                receiver_wallet_id=user_wallet.id,
                amount=reward,
                description=f"Награда за активность {self.from_time.date()}",
                transaction_group_id=group_id
            ).execute()
            
            # Статистика для отчета
            activity = server_activity.get("users_pie", {}).get(author_id, {})
            report[author_id] = {
                "amount": reward,
                "stats": {
                    "messages": activity.get("messages_count", 0),
                    "avg_len": activity.get("content_length", {}).get("avg", 0),
                    "reactions": activity.get("reactions_count", 0),
                    "attachments": activity.get("attachments_count", 0)
                }
            }
            
        return report
