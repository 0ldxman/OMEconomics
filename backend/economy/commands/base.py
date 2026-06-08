from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Any
from backend.database.ledger import Ledger

T = TypeVar("T")

class EconomyCommand(ABC, Generic[T]):
    """
    Базовый класс для всех экономических команд.
    Каждая команда представляет собой атомарное действие в системе.
    """

    def __init__(self, ledger: Ledger):
        self.ledger = ledger
        self.bus = ledger.system_bus # Прямой доступ к системной шине

    @abstractmethod
    async def validate(self) -> None:
        """
        Проверка возможности выполнения команды.
        Должна выбрасывать исключение, если валидация не пройдена.
        """
        pass

    @abstractmethod
    async def execute(self) -> T:
        """
        Основная логика выполнения команды.
        Вызывается только после успешной валидации.
        """
        pass

    async def run(self) -> T:
        """
        Точка входа для выполнения команды с предварительной валидацией.
        """
        await self.validate()
        return await self.execute()

    async def __call__(self) -> T:
        """
        Позволяет вызывать экземпляр команды как функцию.
        """
        return await self.run()
