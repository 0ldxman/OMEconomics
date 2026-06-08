import asyncio
import os
import sys
from dotenv import load_dotenv
from backend.core.orchestrator import SystemOrchestrator

async def main():
    print(">>> ВХОД В main()", flush=True)
    load_dotenv()
    
    orchestrator = SystemOrchestrator()
    
    # Можно добавить коллбэк для вывода логов оркестратора в консоль (уже есть внутри)
    # В будущем здесь будет подключение к WebSocket для фронтенда
    
    try:
        await orchestrator.boot()
        
        # Держим main живым, пока система работает
        while orchestrator.status != "OFFLINE":
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        print("\nЗавершение работы по требованию пользователя...", flush=True)
        await orchestrator.shutdown()
    except Exception as e:
        print(f"\nНепредвиденная ошибка в оркестраторе: {e}", flush=True)
        await orchestrator.shutdown()
    finally:
        print("Система остановлена.", flush=True)

if __name__ == "__main__":
    print(">>> СТАРТ __main__", flush=True)
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
