from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import uvicorn
from database.ledger import Database
from database.tables import User, Wallet, Server, Transaction
from datetime import datetime
import asyncio

app = FastAPI()
templates = Jinja2Templates(directory="dashboard/templates")
app.mount("/static", StaticFiles(directory="dashboard/static"), name="static")

# Глобальная ссылка на БД
db_instance: Database = None

@app.get("/")
async def index(request: Request):
    async with db_instance.ledger() as ledger:
        # Получаем репозитории явно
        wallets_repo = ledger.repository(Wallet)
        users_repo = ledger.repository(User)
        
        # Собираем реальную статистику из БД
        all_wallets = await wallets_repo.find().all()
        total_money = sum(w.balance for w in all_wallets)
        total_gold = sum(getattr(w, 'gold', 0) for w in all_wallets)
        
        all_users = await users_repo.find().all()
        total_users = len(all_users)
        
        # Моковые данные для демонстрации нового интерфейса (пока нет всей логики в БД)
        context = {
            "request": request,
            "active_page": "index",
            "servers_count": 12,
            "total_users": total_users or 1458,
            "active_users": int(total_users * 0.6) if total_users else 842,
            "inactive_users": int(total_users * 0.4) if total_users else 616,
            "total_money": total_money or 2450000,
            "total_gold": 450.5,
            "top_servers": [
                {"name": "RP Universe", "activity": "14.5k"},
                {"name": "Dark City", "activity": "12.2k"},
                {"name": "Cyber Punk", "activity": "9.8k"},
                {"name": "Magic World", "activity": "7.1k"},
                {"name": "Survival X", "activity": "5.4k"}
            ],
            "top_donators": [
                {"name": "Nero", "amount": "50,000", "color": "#ff4d00"},
                {"name": "Shadow", "amount": "32,500", "color": "#8b949e"},
                {"name": "Alex_Gold", "amount": "15,000", "color": "#8b949e"}
            ],
            "now": datetime.now()
        }
        return templates.TemplateResponse(
            request=request, 
            name="index.html", 
            context=context
        )

@app.get("/users")
async def users_page(request: Request):
    return templates.TemplateResponse(request=request, name="users.html", context={"active_page": "users"})

@app.get("/transactions")
async def transactions_page(request: Request):
    return templates.TemplateResponse(request=request, name="transactions.html", context={"active_page": "transactions"})

@app.get("/database")
async def database_page(request: Request):
    return templates.TemplateResponse(request=request, name="database.html", context={"active_page": "database"})

@app.get("/settings")
async def settings_page(request: Request):
    return templates.TemplateResponse(request=request, name="settings.html", context={"active_page": "settings"})

async def run_dashboard(db: Database):
    global db_instance
    db_instance = db
    config = uvicorn.Config(app, host="0.0.0.0", port=8000, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()
