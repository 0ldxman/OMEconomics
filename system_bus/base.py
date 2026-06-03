import uuid
from dataclasses import dataclass, field
from typing import Any, Dict, Optional, Callable, Awaitable

@dataclass
class Request:
    """Запрос в системную шину."""
    type: str
    data: Dict[str, Any] = field(default_factory=dict)
    correlation_id: str = field(default_factory=lambda: str(uuid.uuid4()))

    def __getitem__(self, key: str) -> Any:
        return self.data[key]

    def get(self, key: str, default: Any = None) -> Any:
        return self.data.get(key, default)

    @classmethod
    def create(cls, request_type: str, **kwargs) -> 'Request':
        """Создать программный запрос (псевдо-реквест) для внутреннего использования."""
        return cls(type=request_type, data=kwargs)

# Декоратор для пометки методов в классах
def on_request(request_type: str):
    def decorator(func):
        func._bus_request_type = request_type
        return func
    return decorator

# Тип обработчика: принимает запрос и возвращает данные для ответа или None
Handler = Callable[[Request], Awaitable[Optional[Dict[str, Any]]]]
