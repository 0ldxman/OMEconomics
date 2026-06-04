from datetime import datetime
from typing import Dict, Any, List, TypeVar, Optional
from uuid import UUID

from economy.commands.base import EconomyCommand
from database.tables import (
    Item,
    Inventory,
    Server_Channels,
    Org_Members,
    Transaction,
    Transaction_Items,
    Task,
    Task_Workers,
    Deal,
    Deal_Items,
    Deal_Events
)
from database.ledger import Ledger

T = TypeVar("T")

# 1. GetItemType
class GetItemType(EconomyCommand[Optional[Item]]):
    """
    Команда для получения информации о типе предмета.
    """
    def __init__(self, ledger: Ledger, item_id: int):
        super().__init__(ledger)
        self.item_id = item_id

    def execute(self) -> Optional[Item]:
        return self.ledger.get_one(Item, self.item_id)

# 2. GetUserItems (исправлено) -> GetWalletItems
class GetWalletItems(EconomyCommand[List[Inventory]]):
    """
    Команда для получения всех предметов в инвентаре кошелька.
    """
    def __init__(self, ledger: Ledger, wallet_id: int):
        super().__init__(ledger)
        self.wallet_id = wallet_id

    def execute(self) -> List[Inventory]:
        # Ищем по owner_id, который является fk на wallet.id
        return self.ledger.get_many_by_filter(Inventory, {"owner_id": self.wallet_id})

# 3. GetServerChannels
class GetServerChannels(EconomyCommand[List[Server_Channels]]):
    """
    Команда для получения каналов сервера, участвующих в экономике.
    """
    def __init__(self, ledger: Ledger, server_id: int):
        super().__init__(ledger)
        self.server_id = server_id

    def execute(self) -> List[Server_Channels]:
        return self.ledger.get_many_by_filter(Server_Channels, {"server_id": self.server_id})

# 4. GetOrgMembers
class GetOrgMembers(EconomyCommand[List[Org_Members]]):
    """
    Команда для получения членов организации.
    """
    def __init__(self, ledger: Ledger, org_id: int):
        super().__init__(ledger)
        self.org_id = org_id

    def execute(self) -> List[Org_Members]:
        return self.ledger.get_many_by_filter(Org_Members, {"org_id": self.org_id})

# 5. GetTransaction (исправлено)
class GetTransaction(EconomyCommand[Optional[Transaction]]):
    """
    Команда для получения информации о транзакции.
    """
    def __init__(self, ledger: Ledger, transaction_id: int): # UUID заменен на int
        super().__init__(ledger)
        self.transaction_id = transaction_id

    def execute(self) -> Optional[Transaction]:
        return self.ledger.get_one(Transaction, self.transaction_id)

# 6. GetTransactionItems (исправлено)
class GetTransactionItems(EconomyCommand[List[Transaction_Items]]):
    """
    Команда для получения предметов, связанных с транзакцией.
    """
    def __init__(self, ledger: Ledger, transaction_id: int): # UUID заменен на int
        super().__init__(ledger)
        self.transaction_id = transaction_id

    def execute(self) -> List[Transaction_Items]:
        return self.ledger.get_many_by_filter(Transaction_Items, {"transaction_id": self.transaction_id})

# 7. GetTask
class GetTask(EconomyCommand[Optional[Task]]):
    """
    Команда для получения информации о задаче.
    """
    def __init__(self, ledger: Ledger, task_id: str):
        super().__init__(ledger)
        self.task_id = task_id

    def execute(self) -> Optional[Task]:
        return self.ledger.get_one(Task, self.task_id)

# 8. GetTaskWorkers
class GetTaskWorkers(EconomyCommand[List[Task_Workers]]):
    """
    Команда для получения исполнителей задачи.
    """
    def __init__(self, ledger: Ledger, task_id: str):
        super().__init__(ledger)
        self.task_id = task_id

    def execute(self) -> List[Task_Workers]:
        return self.ledger.get_many_by_filter(Task_Workers, {"task_id": self.task_id})

# 9. GetDeal
class GetDeal(EconomyCommand[Optional[Deal]]):
    """
    Команда для получения информации о сделке.
    """
    def __init__(self, ledger: Ledger, deal_id: str):
        super().__init__(ledger)
        self.deal_id = deal_id

    def execute(self) -> Optional[Deal]:
        return self.ledger.get_one(Deal, self.deal_id)

# 10. GetDealItems
class GetDealItems(EconomyCommand[List[Deal_Items]]):
    """
    Команда для получения предметов, задействованных в сделке.
    """
    def __init__(self, ledger: Ledger, deal_id: str):
        super().__init__(ledger)
        self.deal_id = deal_id

    def execute(self) -> List[Deal_Items]:
        return self.ledger.get_many_by_filter(Deal_Items, {"deal_id": self.deal_id})

# 11. GetDealEvents
class GetDealEvents(EconomyCommand[List[Deal_Events]]):
    """
    Команда для получения событий, связанных со сделкой.
    """
    def __init__(self, ledger: Ledger, deal_id: str):
        super().__init__(ledger)
        self.deal_id = deal_id

    def execute(self) -> List[Deal_Events]:
        return self.ledger.get_many_by_filter(Deal_Events, {"deal_id": self.deal_id})
