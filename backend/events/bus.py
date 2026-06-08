from typing import List, Callable, Dict, Any, Awaitable
import asyncio
from backend.events.base import Event

# Тип для подписчика: асинхронная функция, принимающая список событий
Handler = Callable[[List[Event]], Awaitable[None]]

class EventBus:
    """Шина событий для аналитики и логов (Fire-and-Forget)."""
    def __init__(self):
        self._handlers: List[Handler] = []

    def subscribe(self, handler: Handler):
        """Подписать обработчик на поток событий."""
        if handler not in self._handlers:
            self._handlers.append(handler)

    async def dispatch(self, events: List[Event]):
        """Разослать события всем подписчикам."""
        if not events:
            return

        # Выполняем все обработчики параллельно
        tasks = [handler(events) for handler in self._handlers]
        if tasks:
            await asyncio.gather(*tasks)
