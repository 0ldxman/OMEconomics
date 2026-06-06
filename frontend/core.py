import asyncio
import subprocess
import os

async def run_dashboard(db):
    """
    Запускает Next.js фронтенд (omeweb) в подпроцессе.
    """
    print("Запуск фронтенда (omeweb)...")
    
    # Путь к директории omeweb относительно корня проекта
    frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "omeweb")
    
    # Команда для запуска (предполагаем npm run dev)
    # В продакшене это может быть запуск собранного приложения
    try:
        process = await asyncio.create_subprocess_shell(
            "npm run dev",
            cwd=frontend_dir,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        print(f"Фронтенд запущен в директории: {frontend_dir}")
        
        # Можно добавить логирование вывода, если нужно
        # Но для начала просто даем ему работать
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            print(f"Ошибка при запуске дашборда: {stderr.decode()}")
            
    except Exception as e:
        print(f"Не удалось запустить дашборд: {e}")

if __name__ == "__main__":
    # Тестовый запуск
    asyncio.run(run_dashboard(None))
