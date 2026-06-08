import asyncio
import logging
from typing import List, Dict, Any, Optional, Callable
from datetime import datetime

class SystemOrchestrator:
    """
    Класс-оркестратор для управления жизненным циклом всей системы.
    Реализует алгоритм запуска: Шина -> БД -> Бот -> API.
    """
    def __init__(self):
        self.status = "INITIALIZING"
        self.logs: List[Dict[str, Any]] = []
        self.bus = None
        self.db = None
        self.bot = None
        self._on_log_callbacks: List[Callable] = []

    def log(self, message: str, level: str = "INFO", details: Any = None):
        entry = {
            "timestamp": datetime.now().isoformat(),
            "level": level,
            "message": message,
            "details": details
        }
        self.logs.append(entry)
        print(f"[{level}] {message}", flush=True)
        for cb in self._on_log_callbacks:
            asyncio.create_task(cb(entry))

    def on_log(self, callback: Callable):
        self._on_log_callbacks.append(callback)

    async def boot(self):
        self.status = "STARTING"
        self.log("🚀 Запуск процесса инициализации системы...")

        try:
            # 1. Инициализация Системной шины
            await self._init_bus()
            await asyncio.sleep(0.5)

            # 2. Подключение к БД (только коннект, без синхронизации)
            await self._init_db_connection()
            await asyncio.sleep(0.5)

            # 3. Запуск API Сервера (чтобы WebSocket был доступен сразу)
            await self._init_api()
            
            # 4. Ожидание подключения фронтенда
            await self._wait_for_frontend()

            # 5. Синхронизация схем (теперь пользователь это увидит)
            await self._sync_db()
            await asyncio.sleep(0.8)

            # 6. Запуск Бота
            await self._init_bot()
            await asyncio.sleep(0.5)

            self.status = "READY"
            self.log("✅ Система полностью готова к работе", level="SUCCESS")

        except Exception as e:
            self.status = "FAILED"
            self.log(f"❌ Критическая ошибка при запуске: {e}", level="ERROR")
            import traceback
            self.log(traceback.format_exc(), level="DEBUG")
            raise e

    async def _init_bus(self):
        self.log("📡 Инициализация системной шины...")
        from system_bus.bus import SystemBus
        from system_bus.base import on_request
        self.bus = SystemBus()
        
        # Регистрация хэндлеров оркестратора в шине
        class OrchestratorHandlers:
            def __init__(self, orch):
                self.orch = orch

            @on_request("bot_ready")
            async def handle_bot_ready(self, request):
                guild_ids = request.get("guild_ids", [])
                asyncio.create_task(self.orch.sync_all_guilds(guild_ids))
                return {"status": "sync_started"}

            @on_request("bot_guild_join")
            async def handle_bot_join(self, request):
                guild_id = request.get("guild_id")
                asyncio.create_task(self.orch.sync_guild(guild_id))
                return {"status": "sync_started"}

            @on_request("log_system")
            async def handle_log(self, request):
                message = request.get("message")
                level = request.get("level", "INFO")
                details = request.get("details")
                self.orch.log(message, level=level, details=details)
                return {"status": "logged"}

        self.bus.register_handlers(OrchestratorHandlers(self))
        self.log("✅ Системная шина подключена", level="SUCCESS")

    async def sync_all_guilds(self, guild_ids: List[int]):
        self.log(f"🔄 Начало синхронизации {len(guild_ids)} серверов...")
        for guild_id in guild_ids:
            await self.sync_guild(guild_id)
        self.log("✅ Глобальная синхронизация завершена", level="SUCCESS")

    async def sync_guild(self, guild_id: int):
        self.log(f"🔎 Синхронизация сервера {guild_id}...")
        
        from economy.commands.get_or_create import GetOrCreateServer, GetOrCreateUser
        from database.tables import User
        
        async with self.db.ledger() as ledger:
            # 1. Регистрация сервера
            await GetOrCreateServer(ledger, guild_id).execute()
            
            # 2. Получение участников через бота (увеличиваем таймаут для больших серверов)
            res = await self.bus.ask("sync_guild_data", guild_id=guild_id, timeout=120.0)
            if "error" in res:
                self.log(f"❌ Ошибка получения данных участников для {guild_id}: {res['error']}", level="ERROR")
                return

            member_ids = res.get("member_ids", [])
            self.log(f"👥 Найдено {len(member_ids)} участников на сервере {guild_id}")

            # 3. Batch-проверка существующих пользователей
            user_repo = ledger.repository(User)
            existing_users = await user_repo.find().where(User.id.in_(member_ids)).all()
            existing_ids = {u.id for u in existing_users}
            
            new_ids = [mid for mid in member_ids if mid not in existing_ids]
            
            if new_ids:
                self.log(f"🆕 Регистрация {len(new_ids)} новых участников...")
                # Постепенная регистрация новичков (чтобы не перегрузить ledger за раз)
                # В будущем можно добавить полноценный bulk_insert в repository
                for mid in new_ids:
                    await GetOrCreateUser(ledger, mid).execute()
                self.log(f"✅ Зарегистрировано {len(new_ids)} новых пользователей для {guild_id}")
            else:
                self.log(f"✅ Все участники сервера {guild_id} уже в базе")

    async def _init_db_connection(self):
        self.log("🗄️ Подключение к базе данных...")
        from database.ledger import Database
        import database.tables 
        
        db_file = "economy.db"
        self.db = Database(db_file, system_bus=self.bus)
        await self.db.connect()
        self.log(f"📂 Файл БД '{db_file}' подключен")

    async def _wait_for_frontend(self):
        self.log("⏳ Ожидание подключения дашборда...")
        from frontend.api_server import active_ws_connections
        
        timeout = 30 
        start_time = asyncio.get_event_loop().time()
        
        while not active_ws_connections and (asyncio.get_event_loop().time() - start_time) < timeout:
            await asyncio.sleep(0.2)
        
        if active_ws_connections:
            self.log("🟢 Дашборд подключен, начинаем развертывание компонентов")
            await asyncio.sleep(1)
        else:
            self.log("⚠️ Тайм-аут ожидания фронтенда, продолжаем в автономном режиме", level="WARNING")

    async def _sync_db(self):
        self.log("🔄 Валидация версий и синхронизация схем...")
        from database.schema import SchemaManager
        async with self.db.ledger() as ledger:
            schema = SchemaManager(ledger)
            await schema.sync_all()
        self.log("✅ База данных готова к работе", level="SUCCESS")

    async def _init_bot(self):
        self.log("🤖 Запуск Discord-бота...")
        from bot.core import OMCBot
        import os
        from dotenv import load_dotenv
        load_dotenv()
        
        token = os.getenv("DISCORD_TOKEN")
        if not token:
            self.log("⚠️ Токен Discord не найден, бот будет запущен в режиме ожидания", level="WARNING")
            return

        # Инициализируем бота
        self.bot = OMCBot(self.db)
        
        # Мы не блокируем основной поток запуском бота
        asyncio.create_task(self.bot.start(token))
        self.log("📡 Бот отправлен на подключение к Discord")

    async def _init_api(self):
        self.log("🌐 Запуск API сервера...")
        from frontend.api_server import run_api_server
        # Передаем себя (оркестратор) в API сервер для WebSocket логов
        asyncio.create_task(run_api_server(self.db, orch=self))
        self.log("🚀 API доступно на http://localhost:8000")

    async def shutdown(self):
        self.status = "STOPPING"
        self.log("🛑 Завершение работы системы...")
        
        if self.bot:
            await self.bot.close()
            self.log("🤖 Бот остановлен")
            
        if self.db:
            await self.db.close()
            self.log("🗄️ Соединение с БД закрыто")
            
        self.status = "OFFLINE"
        self.log("💤 Система остановлена")
