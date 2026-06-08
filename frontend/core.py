import asyncio
import subprocess
import os

async def run_dashboard(db):
    """
    Запускает Next.js фронтенд (omeweb) максимально легким способом.
    """
    frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "omeweb")
    
    if not os.path.exists(frontend_dir):
        print(f"[Core] ОШИБКА: Директория фронтенда не найдена: {frontend_dir}", flush=True)
        return

    # Подготовка переменных окружения
    env = os.environ.copy()
    env["NODE_OPTIONS"] = "--max-old-space-size=4096"
    env["NEXT_TELEMETRY_DISABLED"] = "1"
    
    print(f"[Core] Запуск фронтенда в отдельном процессе...", flush=True)
    
    try:
        # Используем классический Popen вместо асинхронного create_subprocess_shell.
        # Это полностью освобождает Python от управления потоками вывода фронтенда.
        # shell=True нужен для Windows, чтобы найти npm/npx
        process = subprocess.Popen(
            "npx next dev", 
            cwd=frontend_dir,
            env=env,
            shell=True,
            # Мы НЕ используем PIPE, чтобы данные шли напрямую в консоль, не нагружая Python
            stdout=None,
            stderr=None
        )
        
        print(f"[Core] Фронтенд запущен независимо (PID: {process.pid})", flush=True)
        
        # Просто держим корутину живой, пока процесс существует
        while process.poll() is None:
            await asyncio.sleep(5)
            
        print(f"[Core] Процесс фронтенда завершился.", flush=True)
            
    except Exception as e:
        print(f"[Core] КРИТИЧЕСКАЯ ОШИБКА при запуске фронтенда: {e}", flush=True)

if __name__ == "__main__":
    # Тестовый запуск
    asyncio.run(run_dashboard(None))
