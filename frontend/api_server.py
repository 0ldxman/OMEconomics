from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import asyncio
import json
from datetime import datetime
from database.api_handlers import DatabaseAPIHandlers

app = FastAPI(title="OMCEconomics API")

# Настройка CORS для работы с Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # В продакшене ограничить
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Глобальное хранилище для обработчиков
handlers: Optional[DatabaseAPIHandlers] = None
orchestrator: Optional[Any] = None
active_ws_connections: List[WebSocket] = []

def setup_handlers(db, orch=None):
    global handlers, orchestrator
    handlers = DatabaseAPIHandlers(db)
    orchestrator = orch
    
    if orchestrator:
        # Подписываемся на логи оркестратора для трансляции в WebSocket
        orchestrator.on_log(broadcast_log)

async def broadcast_log(log_entry: Dict[str, Any]):
    """Рассылает лог всем подключенным WebSocket клиентам."""
    if not active_ws_connections:
        return
    
    disconnected = []
    for ws in active_ws_connections:
        try:
            await ws.send_json(log_entry)
        except Exception:
            disconnected.append(ws)
    
    for ws in disconnected:
        if ws in active_ws_connections:
            active_ws_connections.remove(ws)

@app.websocket("/ws/boot")
async def websocket_boot_status(websocket: WebSocket):
    print(f"   [WS] Попытка подключения к /ws/boot...", flush=True)
    await websocket.accept()
    print(f"   [WS] Соединение установлено", flush=True)
    active_ws_connections.append(websocket)
    
    # При подключении отправляем текущий статус и все накопленные логи
    if orchestrator:
        await websocket.send_json({
            "type": "init",
            "status": orchestrator.status,
            "logs": orchestrator.logs
        })
    
    try:
        while True:
            # Просто держим соединение открытым
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in active_ws_connections:
            active_ws_connections.remove(websocket)

@app.websocket("/ws/emission/{server_id}")
async def websocket_emission_status(websocket: WebSocket, server_id: int):
    await websocket.accept()
    
    # Хранилище логов конкретно этой эмиссии (в памяти на время сессии)
    emission_logs = []
    
    async def emission_callback(msg, level, details):
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "level": level,
            "message": msg,
            "details": details
        }
        emission_logs.append(log_entry)
        try:
            await websocket.send_json(log_entry)
        except:
            pass

    async def scan_listener(event_name, **data):
        if int(data.get("guild_id")) == int(server_id):
            try:
                await websocket.send_json({
                    "type": "scan_step",
                    "timestamp": datetime.now().isoformat(),
                    **data
                })
            except:
                pass

    if orchestrator and orchestrator.bus:
        orchestrator.bus.on("emission_scan_step", scan_listener)

    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "start_emission":
                if not handlers:
                    continue

                from economy.commands.emission import EmissionCommand
                from datetime import timedelta
                
                # Получаем даты из запроса или используем значения по умолчанию (последние 24ч)
                custom_from = data.get("from_time")
                custom_to = data.get("to_time")
                
                to_time = datetime.fromisoformat(custom_to) if custom_to else datetime.now()
                from_time = datetime.fromisoformat(custom_from) if custom_from else to_time - timedelta(days=1)
                
                async with handlers.db.ledger() as ledger:
                    cmd = EmissionCommand(
                        ledger, 
                        server_id=server_id, 
                        from_time=from_time, 
                        to_time=to_time,
                        on_progress=emission_callback,
                        orchestrator=orchestrator
                    )
                    await cmd.execute()
    except WebSocketDisconnect:
        if orchestrator and orchestrator.bus:
            orchestrator.bus.off("emission_scan_step", scan_listener)

@app.get("/api/db/schema")
async def get_schema():
    if not handlers:
        raise HTTPException(status_code=500, detail="Handlers not initialized")
    return await handlers.get_schema()

@app.get("/api/db/table/{table_name}")
async def get_table_data(
    table_name: str, 
    limit: int = 100, 
    offset: int = 0, 
    sort_by: Optional[str] = None, 
    order: str = "asc"
):
    try:
        return await handlers.get_table_data(table_name, limit, offset, sort_by, order)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/api/db/table/{table_name}")
async def create_record(table_name: str, data: Dict[str, Any]):
    try:
        await handlers.create_record(table_name, data)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/db/table/{table_name}/{pk_value}")
async def update_record(table_name: str, pk_value: str, data: Dict[str, Any]):
    try:
        # Пытаемся преобразовать PK в число, если это возможно
        actual_pk = int(pk_value) if pk_value.isdigit() else pk_value
        await handlers.update_record(table_name, actual_pk, data)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/db/table/{table_name}/{pk_value}")
async def delete_record(table_name: str, pk_value: str):
    try:
        actual_pk = int(pk_value) if pk_value.isdigit() else pk_value
        await handlers.delete_record(table_name, actual_pk)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/db/bulk-delete/{table_name}")
async def bulk_delete(table_name: str, pk_values: List[Any]):
    try:
        await handlers.bulk_delete(table_name, pk_values)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/db/reset")
async def reset_database():
    try:
        await handlers.reset_database()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats/global")
async def get_global_stats():
    if not handlers:
        raise HTTPException(status_code=500, detail="Handlers not initialized")
    try:
        from database.tables import User, Wallet, Server, Transaction
        async with handlers.db.ledger() as ledger:
            total_users = await ledger.repository(User).find().count()
            total_servers = await ledger.repository(Server).find().count()
            
            # Суммируем балансы (в будущем лучше через SQL SUM, но наш ORM может не уметь)
            wallets = await ledger.repository(Wallet).find().all()
            total_omc = sum(w.balance for w in wallets)
            total_gold = sum(w.gold for w in wallets)
            
            # Транзакции за последние 24 часа
            from datetime import timedelta
            yesterday = datetime.now() - timedelta(days=1)
            recent_txs = await ledger.repository(Transaction).find().where(Transaction.timestamp >= yesterday).all()
            tx_volume = sum(t.amount for t in recent_txs)
            
            return {
                "total_users": total_users,
                "total_servers": total_servers,
                "total_omc": total_omc,
                "total_gold": total_gold,
                "tx_volume_24h": tx_volume,
                "au_to_omc_rate": 450.5 # Хардкод курса пока что
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/users")
async def get_all_users(limit: int = 100, offset: int = 0):
    if not handlers:
        raise HTTPException(status_code=500, detail="Handlers not initialized")
    try:
        from database.tables import User, Wallet
        async with handlers.db.ledger() as ledger:
            # Получаем пользователей с их кошельками
            # В нашем мини-ORM нет join, поэтому делаем последовательно или через find
            users = await ledger.repository(User).find().limit(limit).offset(offset).all()
            
            result = []
            for u in users:
                wallet = await ledger.repository(Wallet).get(u.wallet_id)
                result.append({
                    "id": str(u.id),
                    "wallet_id": str(u.wallet_id),
                    "balance": wallet.balance if wallet else 0,
                    "gold": wallet.gold if wallet else 0,
                    "last_use": wallet.last_use.isoformat() if wallet and wallet.last_use else None
                })
            return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/servers")
async def get_all_servers():
    if not handlers:
        raise HTTPException(status_code=500, detail="Handlers not initialized")
    try:
        from database.tables import Server
        async with handlers.db.ledger() as ledger:
            servers = await ledger.repository(Server).find().all()
            
            result = []
            for s in servers:
                # Запрашиваем инфу у бота через шину
                guild_info = {}
                if orchestrator and orchestrator.bus:
                    try:
                        # Используем небольшой таймаут, чтобы API не висло если бот не отвечает
                        res = await orchestrator.bus.ask("get_guild_info", guild_id=s.id, timeout=2.0)
                        if "error" not in res:
                            guild_info = res
                    except Exception as e:
                        print(f"Error fetching guild info for {s.id}: {e}")

                result.append({
                    "id": str(s.id),
                    "name": guild_info.get("name", f"Server {str(s.id)[-4:]}"), 
                    "icon_url": guild_info.get("icon_url"),
                    "member_count": guild_info.get("member_count", 0),
                    "last_emission": s.last_emission.isoformat() if s.last_emission else None,
                    "wallet_id": str(s.wallet_id),
                    "settings": s.settings
                })
            return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/server/{server_id}")
async def get_server_info(server_id: int):
    if not handlers:
        raise HTTPException(status_code=500, detail="Handlers not initialized")
    try:
        from database.tables import Server
        async with handlers.db.ledger() as ledger:
            server = await ledger.repository(Server).get(server_id)
            if not server:
                raise HTTPException(status_code=404, detail="Server not found")
            
            # Запрашиваем инфу у бота через шину
            guild_info = {}
            if orchestrator and orchestrator.bus:
                try:
                    res = await orchestrator.bus.ask("get_guild_info", guild_id=server.id, timeout=2.0)
                    if "error" not in res:
                        guild_info = res
                except Exception as e:
                    print(f"Error fetching guild info for {server.id}: {e}")

            return {
                "id": str(server.id),
                "name": guild_info.get("name", f"Server {str(server.id)[-4:]}"),
                "icon_url": guild_info.get("icon_url"),
                "member_count": guild_info.get("member_count", 0),
                "settings": server.settings
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/server/{server_id}/channels")
async def get_server_channels(server_id: int):
    if not handlers:
        raise HTTPException(status_code=500, detail="Handlers not initialized")
    try:
        from database.tables import Server_Channels
        
        # 1. Получаем структуру от бота
        bot_data = {"categories": [], "orphans": []}
        if orchestrator and orchestrator.bus:
            try:
                res = await orchestrator.bus.ask("get_guild_channels", guild_id=server_id, timeout=5.0)
                if "error" not in res:
                    bot_data = res
            except Exception as e:
                print(f"Error fetching guild channels for {server_id}: {e}")

        # 2. Получаем веса из БД
        async with handlers.db.ledger() as ledger:
            db_channels = await ledger.repository(Server_Channels).find().where(Server_Channels.server_id == server_id).all()
            weights = {str(c.channel_id): c.weight for c in db_channels}
            types = {str(c.channel_id): c.type for c in db_channels}

        # 3. Мержим данные (рекурсивно для веток)
        def enrich_channel(ch):
            cid = str(ch["id"])
            enriched = {
                **ch,
                "weight": weights.get(cid, 0.0),
                "enabled": cid in weights and weights[cid] > 0
            }
            if "children" in ch and ch["children"]:
                enriched["children"] = [enrich_channel(child) for child in ch["children"]]
            return enriched

        for cat in bot_data["categories"]:
            cat_id = str(cat["id"])
            cat["weight"] = weights.get(cat_id, 0.0)
            cat["enabled"] = cat_id in weights and weights[cat_id] > 0
            cat["children"] = [enrich_channel(ch) for ch in cat["children"]]
        
        bot_data["orphans"] = [enrich_channel(ch) for ch in bot_data["orphans"]]
        
        return bot_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class ChannelsUpdate(BaseModel):
    channels: List[Dict[str, Any]]

@app.post("/api/server/{server_id}/channels")
async def update_server_channels(server_id: int, data: ChannelsUpdate):
    if not handlers:
        raise HTTPException(status_code=500, detail="Handlers not initialized")
    try:
        from database.tables import Server_Channels
        
        async with handlers.db.ledger() as ledger:
            repo = ledger.repository(Server_Channels)
            
            # Получаем текущие настройки из БД для этого сервера
            existing = await repo.find().where(Server_Channels.server_id == server_id).all()
            existing_map = {c.channel_id: c for c in existing}
            
            updated_ids = []
            for ch_data in data.channels:
                cid = int(ch_data["id"])
                weight = float(ch_data.get("weight", 0.0))
                ch_type = ch_data.get("type", "text")
                enabled = ch_data.get("enabled", True)
                
                # Если выключен, ставим вес 0
                final_weight = weight if enabled else 0.0
                
                if cid in existing_map:
                    obj = existing_map[cid]
                    obj.weight = final_weight
                    obj.type = ch_type
                else:
                    new_ch = Server_Channels(
                        server_id=server_id,
                        channel_id=cid,
                        type=ch_type,
                        weight=final_weight
                    )
                    await repo.add(new_ch)
                updated_ids.append(cid)
                
        return {"status": "success", "updated_count": len(updated_ids)}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

async def run_api_server(db, orch=None, host="0.0.0.0", port=8000):
    setup_handlers(db, orch)
    config = uvicorn.Config(app, host=host, port=port, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()
