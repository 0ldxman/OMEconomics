from typing import List, Dict, Any
from datetime import datetime
from backend.database.core import TableRegistry, TableMetadata, Column

class SchemaManager:
    def __init__(self, ledger):
        self.ledger = ledger
        self.conn = ledger.connection

    async def sync_all(self):
        """Синхронизирует все зарегистрированные таблицы с БД"""
        print("\n=== Начало автоматической синхронизации схем ===")
        for metadata in TableRegistry.get_all_tables():
            await self.sync_table(metadata)
        print("=== Синхронизация схем завершена ===\n")

    async def sync_table(self, target: TableMetadata):
        """Синхронизирует конкретную таблицу"""
        print(f"Проверка таблицы '{target.name}'...")
        
        # 1. Получаем текущие колонки из БД
        current_columns = await self._get_current_columns(target.name)
        
        if not current_columns:
            # Таблицы нет — создаем с нуля
            await self._create_table(target)
            return

        # 2. Сравниваем колонки
        target_columns = target.columns
        
        to_add = []
        for col_name, col in target_columns.items():
            if col_name not in current_columns:
                to_add.append(col)
        
        to_remove = []
        for col_name in current_columns:
            if col_name not in target_columns:
                to_remove.append(col_name)

        # 3. Выполняем миграцию
        if to_add or to_remove:
            print(f"  Обнаружены изменения в '{target.name}': +{len(to_add)} кол., -{len(to_remove)} кол.")
            await self._migrate_via_temp_table(target, to_add, to_remove, current_columns)
        else:
            print(f"  Таблица '{target.name}' актуальна.")

    async def _get_current_columns(self, table_name: str) -> List[str]:
        """Получает список колонок из БД через PRAGMA"""
        try:
            # Оборачиваем имя таблицы в кавычки для PRAGMA, так как transaction - зарезервированное слово
            async with self.conn.execute(f"PRAGMA table_info(\"{table_name}\")") as cursor:
                rows = await cursor.fetchall()
                return [row[1] for row in rows]
        except Exception:
            return []

    async def _create_table(self, metadata: TableMetadata):
        cols_sql = []
        for col in metadata.columns.values():
            # Оборачиваем имена колонок в кавычки для избежания конфликтов с зарезервированными словами
            sql_type = col.get_sql_type()
            sql = f"\"{col.name}\" {sql_type}"
            
            if col.primary_key:
                sql += " PRIMARY KEY"
                # AUTOINCREMENT в SQLite работает только с INTEGER PRIMARY KEY
                if sql_type == "INTEGER":
                    sql += " AUTOINCREMENT"
            
            if col.fk: 
                target_table, target_col = col.fk.split(".")
                sql += f" REFERENCES \"{target_table}\"(\"{target_col}\")"
                if col.on_delete: sql += f" ON DELETE {col.on_delete}"
                if col.on_update: sql += f" ON UPDATE {col.on_update}"
            if not col.nullable: sql += " NOT NULL"
            if col.default is not None:
                # Для строк и JSON добавляем одинарные кавычки для SQL
                if isinstance(col.default, (list, dict, tuple)):
                    import json
                    val = json.dumps(col.default, ensure_ascii=False)
                    sql += f" DEFAULT '{val}'"
                elif isinstance(col.default, str):
                    sql += f" DEFAULT '{col.default}'"
                elif isinstance(col.default, bool):
                    sql += f" DEFAULT {1 if col.default else 0}"
                elif isinstance(col.default, datetime):
                    # Преобразуем в Unix Timestamp для REAL колонки
                    sql += f" DEFAULT {col.default.timestamp()}"
                else:
                    sql += f" DEFAULT {col.default}"
            cols_sql.append(sql)
        
        # Оборачиваем имя таблицы в кавычки
        query = f"CREATE TABLE \"{metadata.name}\" (\n  {',\n  '.join(cols_sql)}\n)"
        try:
            await self.conn.execute(query)
        except Exception as e:
            print(f"Ошибка при выполнении запроса:\n{query}")
            raise e
        print(f"  [SQL] Таблица '{metadata.name}' создана.")

    async def _migrate_via_temp_table(self, target: TableMetadata, to_add, to_remove, current_columns):
        """Ультимативная миграция через временную таблицу"""
        original_name = target.name
        temp_name = f"{original_name}_temp"
        
        # 1. Создаем временную таблицу с новой структурой
        target.name = temp_name
        await self._create_table(target)
        target.name = original_name
        
        # 2. Переносим данные
        common_cols = [f"\"{c}\"" for c in current_columns if c in target.columns]
        cols_str = ", ".join(common_cols)
        if common_cols:
            await self.conn.execute(f"INSERT INTO \"{temp_name}\" ({cols_str}) SELECT {cols_str} FROM \"{original_name}\"")
        
        # 3. Удаляем старую и переименовываем новую
        await self.conn.execute(f"DROP TABLE \"{original_name}\"")
        await self.conn.execute(f"ALTER TABLE \"{temp_name}\" RENAME TO \"{original_name}\"")
        
        print(f"  [Успех] Таблица '{target.name}' синхронизирована.")
