from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, Optional

@dataclass
class Event:
    """Базовый класс для всех событий системы."""
    type: str
    aggregate_id: str  # К какому объекту привязано (например, wallet_id или server_id)
    data: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=lambda: datetime.now().timestamp())
    id: Optional[int] = None # Установится при сохранении в БД

    def __repr__(self):
        return f"Event(type={self.type}, id={self.aggregate_id}, time={self.timestamp})"
