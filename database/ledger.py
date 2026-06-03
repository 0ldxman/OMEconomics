from typing import Any, List, Optional, Type, TypeVar, Generic
import aiosqlite
from database.identity_map import IdentityMap
from database.change_tracker import ChangeTracker
from database.flusher import Flusher
from database.repository import Repository
from events.bus import EventBus
from system_bus.bus import SystemBus
from events.base import Event

T = TypeVar("T")

class Ledger:
    def __init__(self, connection: aiosqlite.Connection, event_bus: Optional[EventBus] = None, system_bus: Optional[SystemBus] = None):
        self.connection = connection
        self.identity_map = IdentityMap()
        self.tracker = ChangeTracker()
        self.flusher = Flusher(connection)
        self.event_bus = event_bus
        self.system_bus = system_bus
        self._new: List[Any] = []
        self._events: List[Event] = []

    def repository(self, model_cls: Type[T]) -> Repository[T]:
        """Явное получение репозитория для модели."""
        return Repository(model_cls, self)

    def add_new(self, obj: Any):
        if obj not in self._new:
            self._new.append(obj)

    def delete(self, obj: Any):
        """Пометить объект для удаления (будет реализовано в Flusher)."""
        # Пока просто заглушка для интерфейса
        pass

    def emit(self, event: Event):
        """Добавить событие в очередь для отправки после коммита."""
        self._events.append(event)

    def get_by_id(self, table_name: str, id: Any) -> Any:
        """Для Lazy Loading."""
        cached = self.identity_map.get(table_name, id)
        if cached: return cached
        raise RuntimeError(f"Объект {table_name}:{id} не в кэше. Используйте await repo.get(id) заранее.")

    async def __aenter__(self):
        await self.connection.execute("BEGIN")
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            await self.connection.execute("ROLLBACK")
            return False # Пробрасываем исключение дальше
        
        try:
            # Пытаемся сбросить изменения в БД
            await self.flusher.flush(self._new, self.identity_map.all_objects(), self.tracker)
            await self.connection.execute("COMMIT")
            
            # Рассылаем события ТОЛЬКО после успешного коммита
            if self.event_bus and self._events:
                await self.event_bus.dispatch(self._events)
        except Exception as e:
            # Если flush или commit упали, обязательно откатываемся
            await self.connection.execute("ROLLBACK")
            raise e

class Database:
    def __init__(self, db_path: str, event_bus: Optional[EventBus] = None, system_bus: Optional[SystemBus] = None):
        self.db_path = db_path
        self.event_bus = event_bus
        self.system_bus = system_bus
        self._conn: Optional[aiosqlite.Connection] = None

    async def connect(self):
        self._conn = await aiosqlite.connect(self.db_path)
        await self._conn.execute("PRAGMA foreign_keys = ON")
        return self._conn

    async def close(self):
        if self._conn: await self._conn.close()

    def ledger(self) -> Ledger:
        if not self._conn: raise RuntimeError("Connect first")
        return Ledger(self._conn, event_bus=self.event_bus, system_bus=self.system_bus)

class QueryBuilder(Generic[T]):
    """Оставлен для совместимости, но теперь использует Repository."""
    def __init__(self, repository: Repository[T]):
        self.repository = repository
        self.metadata = repository.metadata
        self.ledger = repository.ledger
        self.expressions = []
        self._order_by = None
        self._limit = None

    def where(self, expression: Any) -> 'QueryBuilder[T]':
        self.expressions.append(expression)
        return self

    def order_by(self, field: str) -> 'QueryBuilder[T]':
        self._order_by = field
        return self

    def limit(self, count: int) -> 'QueryBuilder[T]':
        self._limit = count
        return self

    async def all(self) -> List[T]:
        where_clauses, params = [], []
        for expr in self.expressions:
            s, p = expr.compile()
            where_clauses.append(s)
            params.extend(p)
        
        sql = f"SELECT * FROM \"{self.metadata.name}\""
        if where_clauses: sql += f" WHERE {' AND '.join(where_clauses)}"
        if self._order_by:
            if self._order_by.startswith("-"): sql += f" ORDER BY \"{self._order_by[1:]}\" DESC"
            else: sql += f" ORDER BY \"{self._order_by}\""
        if self._limit: sql += f" LIMIT {self._limit}"
            
        async with self.ledger.connection.execute(sql, params) as cursor:
            rows = await cursor.fetchall()
            col_names = [d[0] for d in cursor.description]
            return [self.repository._map_row_to_obj(dict(zip(col_names, r))) for r in rows]

    async def first(self) -> Optional[T]:
        self.limit(1)
        res = await self.all()
        return res[0] if res else None
