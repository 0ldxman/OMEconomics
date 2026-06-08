import os
import pprint
from datetime import datetime, timedelta
from database.ledger import Database
from economy.commands.emission import EmissionCommand
from economy.commands.get_or_create import GetOrCreateServer
from database.tables import Server_Channels

# Мы не импортируем discord на верхнем уровне, чтобы не вешать систему при сбоях библиотеки
discord = None
commands = None

def _import_discord():
    global discord, commands
    if discord is None:
        import discord as d
        from discord.ext import commands as c
        discord = d
        commands = c

class OMCBot:
    """Заглушка-контейнер для бота, которая инициализирует реальный класс только при запуске."""
    def __new__(cls, db: Database):
        _import_discord()
        
        class RealOMCBot(commands.Bot):
            def __init__(self, db: Database):
                intents = discord.Intents.default()
                intents.message_content = True
                intents.members = True
                super().__init__(command_prefix="!", intents=intents)
                self.db = db
                if self.db.system_bus:
                    from bot.request_handlers import DiscordRequestHandlers
                    self.db.system_bus.register_handlers(DiscordRequestHandlers(self))

            async def setup_hook(self):
                for filename in os.listdir("./bot/cogs"):
                    if filename.endswith(".py") and not filename.startswith("_"):
                        await self.load_extension(f"bot.cogs.{filename[:-3]}")
                await self.tree.sync()

            async def on_ready(self):
                print(f"✅ Бот запущен как {self.user}")
                if self.db and self.db.system_bus:
                    # Уведомляем оркестратор, что бот готов
                    await self.db.system_bus.ask("bot_ready", guild_ids=[g.id for g in self.guilds])
                
                # Логируем успех для оркестратора
                from system_bus.base import Request
                await self.db.system_bus.ask("log_system", message=f"✅ Бот запущен как {self.user}", level="SUCCESS")

            async def on_guild_join(self, guild):
                print(f"➡️ Бот присоединился к серверу: {guild.name}")
                if self.db and self.db.system_bus:
                    await self.db.system_bus.ask("bot_guild_join", guild_id=guild.id)

        return RealOMCBot(db)

async def run_bot(token: str, db: Database):
    try:
        # Пробуем импортировать с таймаутом (на уровне функции)
        _import_discord()
        bot = OMCBot(db)
        async with bot:
            await bot.start(token)
    except Exception as e:
        print(f"⚠️ Не удалось запустить Discord-бота: {e}")
        # Даем системе работать без бота
        while True:
            await asyncio.sleep(3600)
