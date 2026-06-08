from typing import Any, List, Tuple, Union, Optional

class Expression:
    def __and__(self, other: 'Expression') -> 'LogicalExpression':
        return LogicalExpression(self, "AND", other)

    def __or__(self, other: 'Expression') -> 'LogicalExpression':
        return LogicalExpression(self, "OR", other)

    def compile(self) -> Tuple[str, List[Any]]:
        raise NotImplementedError()

class Condition(Expression):
    def __init__(self, left: str, operator: str, right: Any):
        self.left = left
        self.operator = operator
        self.right = right

    def compile(self) -> Tuple[str, List[Any]]:
        if self.right is None:
            if self.operator == "=":
                return f"{self.left} IS NULL", []
            if self.operator == "!=":
                return f"{self.left} IS NOT NULL", []
        
        # Если оператор уже содержит плейсхолдеры (например, IN (?, ?, ?)), 
        # то не добавляем лишний "?" и возвращаем список значений как есть.
        if "?" in self.operator:
            return f"{self.left} {self.operator}", list(self.right) if isinstance(self.right, (list, tuple)) else [self.right]
            
        return f"{self.left} {self.operator} ?", [self.right]

class LogicalExpression(Expression):
    def __init__(self, left: Expression, operator: str, right: Expression):
        self.left = left
        self.operator = operator
        self.right = right

    def compile(self) -> Tuple[str, List[Any]]:
        l_sql, l_params = self.left.compile()
        r_sql, r_params = self.right.compile()
        return f"({l_sql} {self.operator} {r_sql})", l_params + r_params

class ColumnExpression(Expression):
    """Обертка над колонкой для создания выражений"""
    def __init__(self, column_name: str, table_name: str):
        self.column_name = column_name
        self.table_name = table_name
        # Используем кавычки для имен таблиц и колонок для избежания конфликтов с ключевыми словами
        self.full_name = f"\"{table_name}\".\"{column_name}\""

    def __eq__(self, other: Any) -> Condition:
        return Condition(self.full_name, "=", other)

    def __ne__(self, other: Any) -> Condition:
        return Condition(self.full_name, "!=", other)

    def __gt__(self, other: Any) -> Condition:
        return Condition(self.full_name, ">", other)

    def __ge__(self, other: Any) -> Condition:
        return Condition(self.full_name, ">=", other)

    def __lt__(self, other: Any) -> Condition:
        return Condition(self.full_name, "<", other)

    def __le__(self, other: Any) -> Condition:
        return Condition(self.full_name, "<=", other)

    def in_(self, values: List[Any]) -> Condition:
        placeholders = ", ".join(["?" for _ in values])
        return Condition(self.full_name, f"IN ({placeholders})", values)
