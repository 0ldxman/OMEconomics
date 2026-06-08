import asyncio
import uuid
import inspect
from typing import Any, Dict, Optional, List, Callable
from .base import Request, Handler

class SystemBus:
    """
    Системная шина для прямого взаимодействия компонентов через Request-Response.
    А также поддержка событийной модели (Pub/Sub).
    """
    def __init__(self):
        self._handlers: Dict[str, Handler] = {}
        self._pending_requests: Dict[str, asyncio.Future] = {}
        self._event_listeners: Dict[str, List[Callable]] = {}

    def on(self, event_name: str, listener: Callable):
        """Подписаться на событие."""
        if event_name not in self._event_listeners:
            self._event_listeners[event_name] = []
        self._event_listeners[event_name].append(listener)

    def off(self, event_name: str, listener: Callable):
        """Отписаться от события."""
        if event_name in self._event_listeners:
            if listener in self._event_listeners[event_name]:
                self._event_listeners[event_name].remove(listener)

    async def emit(self, event_name: str, **data):
        """Разослать событие всем подписчикам."""
        if event_name in self._event_listeners:
            for listener in self._event_listeners[event_name]:
                try:
                    if asyncio.iscoroutinefunction(listener):
                        await listener(event_name, **data)
                    else:
                        listener(event_name, **data)
                except Exception as e:
                    print(f"Error in event listener {event_name}: {e}")

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
