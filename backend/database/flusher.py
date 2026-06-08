from typing import Any, List, TYPE_CHECKING
import aiosqlite
from datetime import datetime
from backend.database.core import TableRegistry

if TYPE_CHECKING:
    from backend.database.change_tracker import ChangeTracker

class Flusher:
    """Компиляция изменений в SQL и их выполнение."""
    def __init__(self, connection: aiosqlite.Connection):
        self.connection = connection

    async def flush(
        self, 
        new_objects: List[Any], 
        tracked_objects: List[Any], 
        to_delete: List[Any],
        tracker: 'ChangeTracker'
    ):
        now = datetime.now()
        
        # 1. Удаление
        for obj in to_delete:
            await self._delete_object(obj)

        # 2. Вставка новых
        for obj in new_objects:
            await self._insert_object(obj, now, tracker)

        # 3. Обновление существующих
        for obj in tracked_objects:
            if obj in new_objects or obj in to_delete:
                continue
            await self._update_object(obj, now, tracker)

    async def _delete_object(self, obj: Any):
        metadata = TableRegistry.get_table(obj.__class__.__name__.lower())
        if not metadata: return

        pk_col = next(col for col in metadata.columns.values() if col.primary_key)
        pk_val = getattr(obj, pk_col.name)
        
        sql = f"DELETE FROM \"{metadata.name}\" WHERE \"{pk_col.name}\" = ?"
        await self.connection.execute(sql, [pk_val])

    async def _insert_object(self, obj: Any, now: datetime, tracker: 'ChangeTracker'):
        metadata = TableRegistry.get_table(obj.__class__.__name__.lower())
        if not metadata: return

        # Авто-заполнение времени
        for col in metadata.columns.values():
            if col.auto_now_add or col.auto_now:
                setattr(obj, col.name, now)

        cols, vals, placeholders = [], [], []
        for col_name, col in metadata.columns.items():
            val = getattr(obj, col_name)
            if val is not None or not col.primary_key:
                cols.append(f"\"{col_name}\"")
                vals.append(col.to_db(val))
                placeholders.append("?")

        sql = f"INSERT INTO \"{metadata.name}\" ({', '.join(cols)}) VALUES ({', '.join(placeholders)})"
        cursor = await self.connection.execute(sql, vals)
        
        if cursor.lastrowid:
            for col in metadata.columns.values():
                if col.primary_key:
                    setattr(obj, col.name, cursor.lastrowid)
                    break
        
        tracker.take_snapshot(obj, metadata)

    async def _update_object(self, obj: Any, now: datetime, tracker: 'ChangeTracker'):
        metadata = TableRegistry.get_table(obj.__class__.__name__.lower())
        if not metadata: return

        changes = tracker.get_changes(obj, metadata)
        if not changes:
            return

        # Обновляем auto_now
        for col in metadata.columns.values():
            if col.auto_now:
                setattr(obj, col.name, now)
                changes[col.name] = col.to_db(now)

        pk_col = next(col for col in metadata.columns.values() if col.primary_key)
        pk_val = getattr(obj, pk_col.name)
        
        cols_sql = ", ".join([f"\"{c}\" = ?" for c in changes.keys()])
        sql = f"UPDATE \"{metadata.name}\" SET {cols_sql} WHERE \"{pk_col.name}\" = ?"
        
        await self.connection.execute(sql, list(changes.values()) + [pk_val])
        tracker.take_snapshot(obj, metadata)
