import asyncio
import os
import json
import aiosqlite
from database.ledger import Database
from database.tables import Wallet
from database.schema import SchemaManager
from events.base import Event
from events.bus import EventBus
from database.event_store import EventStore

async def test_event_system():
    db_file = "test_events.db"
    history_file = "test_history.db"
    
    for f in [db_file, history_file]:
        if os.path.exists(f): os.remove(f)

    print("=== Тестирование системы событий (Event Sourcing Light) ===\n")
    
    # 1. Инициализация инфраструктуры событий
    bus = EventBus()
    store = EventStore(history_file)
    await store.connect()
    
    # Подписываем хранилище на шину событий
    bus.subscribe(store.save_events)
    
    # 2. Инициализация БД с шиной событий
    db = Database(db_file, event_bus=bus)
    await db.connect()
    
    try:
        # Синхронизация схемы
        async with db.ledger() as ledger:
            await SchemaManager(ledger).sync_all()

        # 3. Тест генерации события
        print("1. Генерация события при транзакции...")
        async with db.ledger() as ledger:
            wallets = ledger.repository(Wallet)
            w = Wallet(balance=500.0)
            await wallets.add(w)
            
            # Эмитируем событие вручную (имитация работы EconomyService)
            ledger.emit(Event(
                type="wallet_created",
                aggregate_id="new_wallet",
                data={"initial_balance": 500.0}
            ))
            print("   [Ledger] Событие добавлено в очередь")

        # 4. Проверка сохранения в history.db
        print("\n2. Проверка сохранения в history.db...")
        # Даем немного времени на асинхронную обработку, хотя dispatch в Ledger аwait-ится
        async with aiosqlite.connect(history_file) as h_db:
            async with h_db.execute("SELECT type, aggregate_id, data FROM events") as cursor:
                row = await cursor.fetchone()
                if row:
                    ev_type, agg_id, data_json = row
                    data = json.loads(data_json)
                    print(f"   [History] Найдено событие: {ev_type}")
                    print(f"   [History] Aggregate ID: {agg_id}")
                    print(f"   [History] Payload: {data}")
                    
                    assert ev_type == "wallet_created"
                    assert data["initial_balance"] == 500.0
                else:
                    raise AssertionError("Событие не найдено в базе истории!")

        # 5. Тест отсутствия событий при ROLLBACK
        print("\n3. Тест отсутствия событий при ROLLBACK...")
        try:
            async with db.ledger() as ledger:
                ledger.emit(Event(type="failed_event", aggregate_id="none"))
                print("   [Ledger] Добавили событие и вызываем ошибку...")
                raise ValueError("Boom!")
        except ValueError:
            print("   Ошибка поймана.")

        async with aiosqlite.connect(history_file) as h_db:
            async with h_db.execute("SELECT COUNT(*) FROM events WHERE type = 'failed_event'") as cursor:
                count = (await cursor.fetchone())[0]
                print(f"   [History] Событий failed_event: {count}")
                assert count == 0, "Событие сохранилось несмотря на ROLLBACK!"

        print("\n=== Все тесты системы событий пройдены успешно! ===")

    finally:
        await db.close()
        await store.close()
        for f in [db_file, history_file]:
            if os.path.exists(f): os.remove(f)

if __name__ == "__main__":
    asyncio.run(test_event_system())
