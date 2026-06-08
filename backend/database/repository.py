from typing import Any, Dict, List, Optional, Type, TypeVar, Generic, TYPE_CHECKING
from backend.database.core import TableRegistry

if TYPE_CHECKING:
    from backend.database.ledger import Ledger, QueryBuilder

T = TypeVar("T")

class Repository(Generic[T]):
    def __init__(self, model_cls: Type[T], ledger: 'Ledger'):
        self.model_cls = model_cls
        self.metadata = TableRegistry.get_table(model_cls.__name__.lower())
        self.ledger = ledger

    async def get(self, id: Any) -> Optional[T]:
        cached = self.ledger.identity_map.get(self.metadata.name, id)
        if cached:
            return cached

        pk_col = next(col for col in self.metadata.columns.values() if col.primary_key)
        sql = f"SELECT * FROM \"{self.metadata.name}\" WHERE \"{pk_col.name}\" = ?"
        
        async with self.ledger.connection.execute(sql, [id]) as cursor:
            row = await cursor.fetchone()
            if not row: return None
            
            col_names = [d[0] for d in cursor.description]
            raw_data = dict(zip(col_names, row))
            return self._map_row_to_obj(raw_data)

    def _map_row_to_obj(self, raw_data: Dict[str, Any]) -> T:
        processed = {name: col.from_db(raw_data.get(name)) for name, col in self.metadata.columns.items()}
        obj = self.model_cls(**processed)
        obj._ledger = self.ledger
        
        pk_col = next(col for col in self.metadata.columns.values() if col.primary_key)
        self.ledger.identity_map.add(self.metadata.name, processed[pk_col.name], obj)
        self.ledger.tracker.take_snapshot(obj, self.metadata)
        return obj

    async def add(self, obj: T):
        obj._ledger = self.ledger
        self.ledger.add_new(obj)
        
        # Добавляем в IdentityMap сразу, если PK уже известен
        pk_col_name = next(name for name, col in self.metadata.columns.items() if col.primary_key)
        pk_val = getattr(obj, pk_col_name, None)
        if pk_val is not None:
            self.ledger.identity_map.add(self.metadata.name, pk_val, obj)
            self.ledger.tracker.take_snapshot(obj, self.metadata)

    def find(self) -> 'QueryBuilder[T]':
        from database.ledger import QueryBuilder
        return QueryBuilder(self)

    async def delete(self, obj: T):
        self.ledger.delete(obj)
