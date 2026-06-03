import asyncio
import os
from database.ledger import Database
from database.tables import User, Wallet, Server
from database.schema import SchemaManager

async def test_new_architecture():
    db_file = "test_v2.db"
    if os.path.exists(db_file):
        os.remove(db_file)

    print("=== Тестирование новой архитектуры Ledger (IdentityMap, Tracker, Flusher) ===\n")
    
    db = Database(db_file)
    await db.connect()
    
    try:
        # 1. Синхронизация схемы
        print("1. Синхронизация схемы...")
        async with db.ledger() as ledger:
            schema = SchemaManager(ledger)
            await schema.sync_all()

        # 2. Проверка вставки и Identity Map
        print("\n2. Тест вставки и Identity Map...")
        async with db.ledger() as ledger:
            wallets = ledger.repository(Wallet)
            
            w1 = Wallet(balance=1000.0, gold=5.0)
            await wallets.add(w1)
            
            # Проверяем, что ID еще нет
            print(f"   [До коммита] Wallet ID: {w1.id}")
            
        # После коммита ID должен быть
        print(f"   [После коммита] Wallet ID: {w1.id}")

        async with db.ledger() as ledger:
            wallets = ledger.repository(Wallet)
            w2 = await wallets.get(w1.id)
            w3 = await wallets.get(w1.id)
            
            print(f"   Объекты идентичны? {w2 is w3} (IdentityMap работает)")
            print(f"   Баланс из БД: {w2.balance}")

        # 3. Тест Change Tracking (Flusher + Tracker)
        print("\n3. Тест Change Tracking...")
        async with db.ledger() as ledger:
            wallets = ledger.repository(Wallet)
            w = await wallets.get(w1.id)
            
            print(f"   Изменяем баланс: {w.balance} -> 1500.0")
            w.balance = 1500.0
            # Ledger сам увидит изменения при выходе из контекста
        
        async with db.ledger() as ledger:
            wallets = ledger.repository(Wallet)
            w_final = await wallets.get(w1.id)
            print(f"   Новый баланс в БД: {w_final.balance}")
            assert w_final.balance == 1500.0, "Ошибка: Баланс не обновился!"

        # 4. Тест сложных связей и Lazy Loading
        print("\n4. Тест связей и Lazy Loading...")
        async with db.ledger() as ledger:
            wallets = ledger.repository(Wallet)
            users = ledger.repository(User)
            
            # Создаем юзера, привязанного к кошельку
            user = User(id=12345, wallet_id=w1.id)
            await users.add(user)
        
        async with db.ledger() as ledger:
            users = ledger.repository(User)
            wallets = ledger.repository(Wallet)
            
            u = await users.get(12345)
            print(f"   Загружен юзер: {u.id}, Wallet ID: {u.wallet_id}")
            
            # Предзагружаем кошелек в Identity Map, чтобы сработал Lazy Load ( property )
            await wallets.get(u.wallet_id)
            
            print(f"   Lazy Load кошелька: {u.wallet.balance}")
            assert u.wallet.balance == 1500.0, "Ошибка: Lazy Load вернул неверные данные!"

        # 5. Тест отката транзакции
        print("\n5. Тест ROLLBACK при ошибке...")
        try:
            async with db.ledger() as ledger:
                wallets = ledger.repository(Wallet)
                w = await wallets.get(w1.id)
                w.balance = 999999.0
                print("   Попытка изменить баланс и вызвать ошибку...")
                raise RuntimeError("Специальная ошибка для теста отката")
        except RuntimeError:
            print("   Ошибка поймана, проверяем баланс в БД...")
        
        async with db.ledger() as ledger:
            wallets = ledger.repository(Wallet)
            w_check = await wallets.get(w1.id)
            print(f"   Баланс в БД: {w_check.balance} (Должен быть 1500.0)")
            assert w_check.balance == 1500.0, "Ошибка: Транзакция не откатилась!"

        print("\n=== Все тесты новой архитектуры пройдены успешно! ===")

    finally:
        await db.close()
        if os.path.exists(db_file):
            os.remove(db_file)

if __name__ == "__main__":
    asyncio.run(test_new_architecture())
