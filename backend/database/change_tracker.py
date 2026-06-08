from typing import Any, Dict
from backend.database.core import TableMetadata

class ChangeTracker:
    """Отслеживание изменений объектов через снапшоты."""
    def __init__(self):
        # { id(obj): {col_name: raw_value} }
        self._snapshots: Dict[int, Dict[str, Any]] = {}

    def take_snapshot(self, obj: Any, metadata: TableMetadata):
        """Сохраняет текущее состояние всех колонок объекта."""
        data = {}
        for col_name, col in metadata.columns.items():
            val = getattr(obj, col_name)
            data[col_name] = val
        self._snapshots[id(obj)] = data

    def get_changes(self, obj: Any, metadata: TableMetadata) -> Dict[str, Any]:
        """Сравнивает текущее состояние со снапшотом и возвращает измененные поля."""
        snapshot = self._snapshots.get(id(obj))
        if not snapshot:
            return {}

        changes = {}
        for col_name, col in metadata.columns.items():
            current_val = getattr(obj, col_name)
            if current_val != snapshot.get(col_name):
                changes[col_name] = col.to_db(current_val)
        return changes
