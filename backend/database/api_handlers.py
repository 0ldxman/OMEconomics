from typing import List, Dict, Any, Optional
from backend.database.core import TableRegistry
from backend.database.ledger import Ledger
import json
from datetime import datetime

class DatabaseAPIHandlers:
    def __init__(self, db):
        self.db = db

    async def get_schema(self) -> List[Dict[str, Any]]:
        """Возвращает схему всех таблиц с количеством записей."""
        tables = TableRegistry.get_all_tables()
        schema = []
        
        async with self.db.ledger() as ledger:
            for table in tables:
                columns = []
                for col_name, col in table.columns.items():
                    columns.append({
                        "name": col_name,
                        "type": str(col.type.__name__) if hasattr(col.type, "__name__") else str(col.type),
                        "sql_type": col.get_sql_type(),
                        "primary_key": col.primary_key,
                        "fk": col.fk,
                        "default": col.default,
                        "nullable": col.nullable
                    })
                
                # Получаем количество записей
                count = await ledger.repository(table.cls).find().count()
                
                schema.append({
                    "name": table.name,
                    "version": table.version,
                    "columns": columns,
                    "rowCount": count
                })
        return schema

    async def get_table_data(self, table_name: str, limit: int = 100, offset: int = 0, sort_by: Optional[str] = None, order: str = "asc") -> Dict[str, Any]:
        """Возвращает данные из таблицы с пагинацией и сортировкой."""
        metadata = TableRegistry.get_table(table_name)
        if not metadata:
            raise ValueError(f"Table {table_name} not found")

        async with self.db.ledger() as ledger:
            repo = ledger.repository(metadata.cls)
            query = repo.find()
            
            if sort_by:
                # Если order="desc", добавляем минус перед именем поля для ORM
                sort_expr = f"-{sort_by}" if order.lower() == "desc" else sort_by
                query = query.order_by(sort_expr)
            
            total = await query.count()
            records = await query.limit(limit).offset(offset).all()
            
            rows = []
            for record in records:
                row = {}
                for col_name in metadata.columns:
                    val = getattr(record, col_name)
                    # Превращаем большие ID в строки для JS
                    if col_name.endswith("_id") or col_name == "id":
                        if isinstance(val, int) and val > 2**53:
                            row[col_name] = str(val)
                        else:
                            row[col_name] = val
                    elif isinstance(val, (dict, list)):
                        row[col_name] = val
                    elif isinstance(val, datetime):
                        row[col_name] = val.timestamp()
                    elif hasattr(val, 'isoformat'):
                        row[col_name] = val.isoformat()
                    else:
                        row[col_name] = val
                rows.append(row)
                
            return {
                "total": total,
                "limit": limit,
                "offset": offset,
                "data": rows
            }

    async def update_record(self, table_name: str, pk_value: Any, data: Dict[str, Any]):
        """Обновляет запись в таблице."""
        metadata = TableRegistry.get_table(table_name)
        if not metadata:
            raise ValueError(f"Table {table_name} not found")

        async with self.db.ledger() as ledger:
            repo = ledger.repository(metadata.cls)
            record = await repo.get(pk_value)
            if not record:
                raise ValueError(f"Record with PK {pk_value} not found in {table_name}")

            for key, value in data.items():
                if key in metadata.columns:
                    setattr(record, key, value)
            
            # Ledger автоматически зафлашит изменения при выходе из контекста
            return True

    async def create_record(self, table_name: str, data: Dict[str, Any]):
        """Создает новую запись в таблице."""
        metadata = TableRegistry.get_table(table_name)
        if not metadata:
            raise ValueError(f"Table {table_name} not found")

        async with self.db.ledger() as ledger:
            # Очищаем данные от None для полей с дефолтами
            clean_data = {k: v for k, v in data.items() if v is not None}
            new_obj = metadata.cls(**clean_data)
            await ledger.repository(metadata.cls).add(new_obj)
            return True

    async def delete_record(self, table_name: str, pk_value: Any):
        """Удаляет запись из таблицы."""
        metadata = TableRegistry.get_table(table_name)
        if not metadata:
            raise ValueError(f"Table {table_name} not found")

        async with self.db.ledger() as ledger:
            repo = ledger.repository(metadata.cls)
            record = await repo.get(pk_value)
            if record:
                await repo.delete(record)
            return True

    async def reset_database(self):
        """Полностью очищает базу данных и пересоздает схемы."""
        import os
        from database.schema import SchemaManager
        
        try:
            db_path = self.db.db_path
            await self.db.close()
            
            if os.path.exists(db_path):
                try:
                    os.remove(db_path)
                except Exception as e:
                    # На Windows файл может быть занят другим потоком/процессом
                    # В реальной системе здесь стоит добавить retry-логику или 
                    # убедиться, что все Ledger закрыты.
                    raise RuntimeError(f"Не удалось удалить файл БД: {e}")
                
            await self.db.connect()
            async with self.db.ledger() as ledger:
                schema = SchemaManager(ledger)
                await schema.sync_all()
            return True
        except Exception as e:
            raise e

    async def bulk_delete(self, table_name: str, pk_values: List[Any]):
        """Массовое удаление записей."""
        metadata = TableRegistry.get_table(table_name)
        if not metadata:
            raise ValueError(f"Table {table_name} not found")

        async with self.db.ledger() as ledger:
            repo = ledger.repository(metadata.cls)
            for pk in pk_values:
                record = await repo.get(pk)
                if record:
                    await repo.delete(record)
            return True
