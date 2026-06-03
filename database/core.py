from dataclasses import dataclass, field
from typing import Any, Dict, Optional, Type, List, Union
import inspect
import json
from datetime import datetime
from database.query import ColumnExpression

@dataclass
class Column:
    primary_key: bool = False
    fk: Optional[str] = None
    on_delete: Optional[str] = None
    on_update: Optional[str] = None
    default: Any = None
    nullable: bool = True
    unique: bool = False
    index: bool = False
    check: Optional[str] = None
    
    # Авто-заполнение времени
    auto_now: bool = False  # Обновлять при каждом сохранении
    auto_now_add: bool = False  # Только при создании
    
    # Внутреннее имя колонки, установится в декораторе
    name: Optional[str] = None
    # Тип данных из аннотации
    type: Optional[Type] = None

    def get_sql_type(self) -> str:
        type_map = {
            int: "INTEGER",
            float: "REAL",
            str: "TEXT",
            bool: "BOOLEAN",
            bytes: "BLOB",
            list: "JSON",
            dict: "JSON",
            tuple: "JSON",
            datetime: "REAL"  # Unix Timestamp (число)
        }
        return type_map.get(self.type, "TEXT")

    def to_db(self, value: Any) -> Any:
        """Подготавливает значение для сохранения в БД"""
        sql_type = self.get_sql_type()
        if sql_type == "JSON" and value is not None:
            return json.dumps(value, ensure_ascii=False)
        if self.type == datetime and isinstance(value, datetime):
            return value.timestamp() # Unix формат (число)
        return value

    def from_db(self, value: Any) -> Any:
        """Преобразует значение из БД в Python тип"""
        sql_type = self.get_sql_type()
        if sql_type == "JSON" and value is not None:
            if isinstance(value, str):
                return json.loads(value)
        if self.type == datetime and value is not None:
            if isinstance(value, (int, float)):
                return datetime.fromtimestamp(value)
        return value

@dataclass
class TableMetadata:
    name: str
    version: int
    columns: Dict[str, Column]
    cls: Type

class TableRegistry:
    _tables: Dict[str, TableMetadata] = {}

    @classmethod
    def register(cls, metadata: TableMetadata):
        cls._tables[metadata.name] = metadata

    @classmethod
    def get_table(cls, name: str) -> Optional[TableMetadata]:
        return cls._tables.get(name)

    @classmethod
    def get_all_tables(cls) -> List[TableMetadata]:
        return list(cls._tables.values())

def db_table(version: int, name: Optional[str] = None):
    def decorator(cls):
        table_name = name or cls.__name__.lower()
        
        # Собираем колонки из аннотаций и значений по умолчанию
        columns = {}
        annotations = getattr(cls, "__annotations__", {})
        
        for field_name, field_type in annotations.items():
            column_obj = getattr(cls, field_name, None)
            
            if isinstance(column_obj, Column):
                column_obj.name = field_name
                column_obj.type = field_type
                columns[field_name] = column_obj
                
                # Заменяем Column на field для корректной работы dataclass
                if column_obj.default is not None:
                    # Для изменяемых типов (list, dict, set) в dataclass нужно использовать default_factory
                    if isinstance(column_obj.default, (list, dict, set)):
                        # Создаем фабрику, которая возвращает копию дефолтного значения
                        default_val = column_obj.default
                        setattr(cls, field_name, field(default_factory=lambda v=default_val: type(v)(v)))
                    else:
                        setattr(cls, field_name, field(default=column_obj.default))
                elif column_obj.primary_key or column_obj.auto_now or column_obj.auto_now_add:
                    # PK и авто-поля не обязательны при создании объекта
                    setattr(cls, field_name, field(default=None))
                else:
                    # Если дефолта нет, dataclass будет требовать аргумент в __init__
                    delattr(cls, field_name)

                # Если это FK, автоматически создаем свойство для связи
                if column_obj.fk:
                    target_table_name, target_col_name = column_obj.fk.split(".")
                    
                    def get_related_object(self, t_name=target_table_name, f_name=field_name):
                        ledger = getattr(self, "_ledger", None)
                        val = getattr(self, f_name)
                        if val is None:
                            return None
                            
                        if ledger:
                            return ledger.get_by_id(t_name, val)
                        
                        print(f"Предупреждение: К объекту {self.__class__.__name__} не привязан активный Ledger. Ленивая загрузка {t_name} невозможна.")
                        return None
                    
                    # Генерируем имя свойства:
                    # 1. Если имя поля заканчивается на _id (creator_id -> creator)
                    # 2. Иначе используем имя целевой таблицы (owner -> user)
                    if field_name.endswith("_id"):
                        prop_name = field_name[:-3]
                    else:
                        prop_name = target_table_name
                    
                    if not hasattr(cls, prop_name):
                        setattr(cls, prop_name, property(get_related_object))

            else:
                columns[field_name] = Column(name=field_name, type=field_type)

        # Регистрируем метаданные
        metadata = TableMetadata(
            name=table_name,
            version=version,
            columns=columns,
            cls=cls
        )
        TableRegistry.register(metadata)
        
        # Делаем класс датаклассом
        cls = dataclass(cls, kw_only=True)

        # После создания датакласса, заменяем атрибуты класса на ColumnExpression 
        # для возможности писать User.balance > 10
        for col_name, col in columns.items():
            setattr(cls, col_name, ColumnExpression(col_name, table_name))
        
        return cls
    
    return decorator
