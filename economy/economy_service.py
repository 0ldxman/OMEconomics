from database.ledger import Ledger
from typing import Optional

class EconomyService:
    """
    Сервис-фасад для упрощенного доступа к экономическим командам.
    """
    def __init__(self, ledger: Ledger):
        self.ledger = ledger

    # Временно пустой сервис, пока команды в разработке
    # async def transfer(self, ...)
