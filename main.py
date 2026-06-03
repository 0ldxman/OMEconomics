import asyncio
import os
from database.ledger import Database
from database.schema import SchemaManager
from system_bus.bus import SystemBus
from bot.core import run_bot
from dashboard.core import run_dashboard

async def main():
    # 1. Инициализация системной шины
    system_bus = SystemBus()

    # 2. Инициализация БД
    db_file = "economy.db"
    db = Database(db_file, system_bus=system_bus)
    await db.connect()

    # 2. Синхронизация схемы (автоматическая миграция)
    async with db.ledger() as ledger:
        schema = SchemaManager(ledger)
        await schema.sync_all()

    # 3. Запуск компонентов
    # В реальной жизни TOKEN берется из .env
    TOKEN = os.getenv("DISCORD_TOKEN")
    
    print("Запуск системы...")
    
    tasks = [
        run_dashboard(db)
    ]
    
    # Запускаем бота, если токен не является плейсхолдером
    if TOKEN and TOKEN != "YOUR_TOKEN_HERE":
        tasks.append(run_bot(TOKEN, db))
    else:
        print("Предупреждение: DISCORD_TOKEN не установлен. Бот не будет запущен.")

    await asyncio.gather(*tasks)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nСистема остановлена.")
