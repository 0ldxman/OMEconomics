import asyncio
import uuid
import inspect
from typing import Any, Dict, Optional
from .base import Request, Handler

class SystemBus:
    """
    Системная шина для прямого взаимодействия компонентов через Request-Response.
    """
    def __init__(self):
        self._handlers: Dict[str, Handler] = {}
        self._pending_requests: Dict[str, asyncio.Future] = {}

    def subscribe(self, request_type: str, handler: Handler):
        """Прямая подписка функции на запрос."""
        self._handlers[request_type] = handler

    def register_handlers(self, obj: Any):
        """
        Сканирует объект на наличие методов с декоратором @on_request 
        и регистрирует их в шине.
        """
        for name, method in inspect.getmembers(obj, predicate=inspect.iscoroutinefunction):
            if hasattr(method, "_bus_request_type"):
                request_type = getattr(method, "_bus_request_type")
                self.subscribe(request_type, method)

    async def ask(self, request_type: str, timeout: float = 30.0, **kwargs) -> Any:
        """Отправить запрос и дождаться ответа."""
        correlation_id = str(uuid.uuid4())
        request = Request(type=request_type, data=kwargs, correlation_id=correlation_id)
        
        future = asyncio.get_running_loop().create_future()
        self._pending_requests[correlation_id] = future

        if request_type in self._handlers:
            asyncio.create_task(self._process_request(request))
        else:
            if correlation_id in self._pending_requests:
                del self._pending_requests[correlation_id]
            raise RuntimeError(f"Нет обработчика для запроса типа: {request_type}")

        try:
            return await asyncio.wait_for(future, timeout=timeout)
        except asyncio.TimeoutError:
            if correlation_id in self._pending_requests:
                del self._pending_requests[correlation_id]
            raise TimeoutError(f"Запрос {request_type} не получил ответа за {timeout}с")

    async def _process_request(self, request: Request):
        handler = self._handlers.get(request.type)
        if not handler: return

        try:
            response_data = await handler(request)
            if request.correlation_id in self._pending_requests:
                future = self._pending_requests.pop(request.correlation_id)
                if not future.done():
                    future.set_result(response_data)
        except Exception as e:
            if request.correlation_id in self._pending_requests:
                future = self._pending_requests.pop(request.correlation_id)
                if not future.done():
                    future.set_exception(e)
