import discord
from discord.ext import commands
import os
import pprint
from datetime import datetime, timedelta
from database.ledger import Database
from bot.request_handlers import DiscordRequestHandlers
from economy.commands.emission import EmissionCommand
from economy.commands.get_or_create import GetOrCreateServer
from database.tables import Server_Channels

class OMCBot(commands.Bot):
    def __init__(self, db: Database):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.members = True
        super().__init__(command_prefix="!", intents=intents)
        self.db = db
        # Регистрируем обработчики системных запросов
        if self.db.system_bus:
            # Обработчики Discord (нужен бот)
            self.db.system_bus.register_handlers(DiscordRequestHandlers(self))

    async def setup_hook(self):
        # Загрузка когов
        for filename in os.listdir("./bot/cogs"):
            if filename.endswith(".py") and not filename.startswith("_"):
                await self.load_extension(f"bot.cogs.{filename[:-3]}")
                print(f"Загружен ког: {filename}")
        
        # Синхронизация слэш-команд
        print("Синхронизация слэш-команд...")
        await self.tree.sync()
        print("Слэш-команды синхронизированы.")

    async def on_ready(self):
        print(f"Бот запущен как {self.user} (ID: {self.user.id})")
        print(f"Список серверов ({len(self.guilds)}):")
        for guild in self.guilds:
            print(f" - {guild.name} (ID: {guild.id})")
        print("------")

        # Тестовый проход по серверам через команду эмиссии
        if self.db:
            print("Запуск ТЕСТОВОЙ ЭМИССИИ за неделю...")
            week_ago = datetime.now() - timedelta(days=7)
            now = datetime.now()
            
            for guild in self.guilds:
                try:
                    # 1. Подготовка: Регистрация сервера и тестовых каналов
                    async with self.db.ledger() as ledger:
                        print(f"Проверка регистрации сервера {guild.name}...")
                        await GetOrCreateServer(ledger, guild.id).execute()
                        
                        print(f"Регистрация тестовых каналов для {guild.name}...")
                        test_channels = [641000833751842856, 638716426815012890, 1153950724938543175]
                        channels_repo = ledger.repository(Server_Channels)
                        
                        for ch_id in test_channels:
                            existing = await channels_repo.get(ch_id)
                            if not existing:
                                await channels_repo.add(Server_Channels(
                                    server_id=guild.id,
                                    channel_id=ch_id,
                                    weight=1.0,
                                    type="text-channel"
                                ))
                    # Здесь транзакция завершается и данные физически записываются в БД
                        
                    # 2. Запуск эмиссии (в новом контексте, когда каналы уже в базе)
                    async with self.db.ledger() as ledger:
                        print(f"Запуск эмиссии для сервера: {guild.name}...")
                        command = EmissionCommand(
                            ledger=ledger,
                            server_id=guild.id,
                            from_time=week_ago,
                            to_time=now
                        )
                        
                        result = await command.execute()
                        distributable = result.get("distributable", 0.0)
                        rewards = result.get("rewards", {})
                        group_id = result.get("group_id")
                        
                        print(f" ✅ Эмиссия завершена! Распределено: {distributable:.2f} монет.")
                        
                        if rewards:
                            print("\n--- СПИСОК ВЫПЛАТ ---")
                            for user_id, data in rewards.items():
                                try:
                                    member = guild.get_member(user_id) or await guild.fetch_member(user_id)
                                    name = member.display_name
                                except Exception:
                                    name = f"ID:{user_id}"
                                
                                amount = data["amount"]
                                s = data["stats"]
                                print(f" 👤 {name}: {amount:.2f} монет")
                                print(f"    └ 📝 Сообщ: {s['messages']} | 📏 Ср.длина: {s['avg_len']:.1f} | ❤️ Реакт: {s['reactions']} | 📎 Влож: {s['attachments']}")
                            print("---------------------\n")
                    
                    # 3. Вывод статистики по транзакциям (отдельно, чтобы данные уже были в БД)
                    if group_id:
                        async with self.db.ledger() as ledger:
                            from database.tables import Transaction
                            txs = await ledger.repository(Transaction).find().where(Transaction.transaction_group_id == group_id).all()
                            
                            stats = {}
                            for tx in txs:
                                stats[tx.type] = stats.get(tx.type, 0.0) + abs(tx.amount)
                            
                            print("--- СТАТИСТИКА ТРАНЗАКЦИЙ ---")
                            for tx_type, total in stats.items():
                                print(f" 📊 {tx_type}: {total:.2f}")
                            print("-----------------------------\n")
                        
                except Exception as e:
                    import traceback
                    print(f" ❌ Ошибка при эмиссии для {guild.name}: {e}")
                    traceback.print_exc()
            
            print("------")
            print("Тестовая эмиссия завершена.")

async def run_bot(token: str, db: Database):
    bot = OMCBot(db)
    async with bot:
        await bot.start(token)
