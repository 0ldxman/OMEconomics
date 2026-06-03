from typing import Any, Dict, Optional, Tuple, List

class IdentityMap:
    """Кэш объектов для обеспечения уникальности экземпляров в рамках транзакции."""
    def __init__(self):
        # { (table_name, pk_value): object }
        self._map: Dict[Tuple[str, Any], Any] = {}

    def get(self, table_name: str, pk_val: Any) -> Optional[Any]:
        return self._map.get((table_name, pk_val))

    def add(self, table_name: str, pk_val: Any, obj: Any):
        if pk_val is not None:
            self._map[(table_name, pk_val)] = obj

    def remove(self, table_name: str, pk_val: Any):
        self._map.pop((table_name, pk_val), None)

    def all_objects(self) -> List[Any]:
        return list(self._map.values())
