import aiosqlite
import json
import os
from typing import List
from backend.events.base import Event

class EventStore:
    """Хранилище событий в отдельной базе данных (history.db)."""
    def __init__(self, db_path: str = "history.db"):
        self.db_path = db_path
        self._conn: aiosqlite.Connection = None

    async def connect(self):
        if not self._conn:
            self._conn = await aiosqlite.connect(self.db_path)
            await self._init_db()

    async def _init_db(self):
        """Создает таблицу событий, если её нет."""
        await self._conn.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT NOT NULL,
                aggregate_id TEXT NOT NULL,
                data TEXT NOT NULL,
                timestamp REAL NOT NULL
            )
        """)
        # Индексы для быстрой аналитики и группировки
        await self._conn.execute("CREATE INDEX IF NOT EXISTS idx_events_type ON events(type)")
        await self._conn.execute("CREATE INDEX IF NOT EXISTS idx_events_aggregate ON events(aggregate_id)")
        await self._conn.execute("CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp)")
        await self._conn.commit()

    async def save_events(self, events: List[Event]):
        """Сохраняет пачку событий в базу истории."""
        if not events:
            return

        if not self._conn:
            await self.connect()

        async with self._conn.execute("BEGIN"):
            for event in events:
                await self._conn.execute(
                    "INSERT INTO events (type, aggregate_id, data, timestamp) VALUES (?, ?, ?, ?)",
                    (event.type, event.aggregate_id, json.dumps(event.data, ensure_ascii=False), event.timestamp)
                )
        await self._conn.commit()

    async def close(self):
        if self._conn:
            await self._conn.close()
            self._conn = None
