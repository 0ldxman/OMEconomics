from datetime import datetime
from typing import Dict, Any, List, TypeVar, Optional
from uuid import UUID

from economy.commands.base import EconomyCommand
from database.tables import (
    Item,
    Inventory,
    Server,
    Server_Channels,
    Wallet,
    User,
    Org,
    Org_Members,
    Transaction,
    Transaction_Items,
    Task,
    Task_Workers,
    Deal,
    Market_Listing
)
from database.ledger import Ledger

T = TypeVar("T")

# --- Commands for base entities ---

class GetWallet(EconomyCommand[Optional[Wallet]]):
    """Команда для получения кошелька."""
    def __init__(self, ledger: Ledger, wallet_id: int):
        super().__init__(ledger)
        self.wallet_id = wallet_id

    async def validate(self) -> None:
        if self.wallet_id is None:
            raise ValueError("wallet_id cannot be None")

    async def execute(self) -> Optional[Wallet]:
        return await self.ledger.repository(Wallet).get(self.wallet_id)

class GetUser(EconomyCommand[Optional[User]]):
    """Команда для получения пользователя."""
    def __init__(self, ledger: Ledger, user_id: int):
        super().__init__(ledger)
        self.user_id = user_id

    async def validate(self) -> None:
        if self.user_id is None:
            raise ValueError("user_id cannot be None")

    async def execute(self) -> Optional[User]:
        return await self.ledger.repository(User).get(self.user_id)

class GetServer(EconomyCommand[Optional[Server]]):
    """Команда для получения сервера."""
    def __init__(self, ledger: Ledger, server_id: int):
        super().__init__(ledger)
        self.server_id = server_id

    async def validate(self) -> None:
        if self.server_id is None:
            raise ValueError("server_id cannot be None")

    async def execute(self) -> Optional[Server]:
        return await self.ledger.repository(Server).get(self.server_id)

class GetOrg(EconomyCommand[Optional[Org]]):
    """Команда для получения организации."""
    def __init__(self, ledger: Ledger, org_id: int):
        super().__init__(ledger)
        self.org_id = org_id

    async def validate(self) -> None:
        if self.org_id is None:
            raise ValueError("org_id cannot be None")

    async def execute(self) -> Optional[Org]:
        return await self.ledger.repository(Org).get(self.org_id)

# --- Commands for other entities ---

class GetItemType(EconomyCommand[Optional[Item]]):
    """Команда для получения информации о типе предмета."""
    def __init__(self, ledger: Ledger, item_id: int):
        super().__init__(ledger)
        self.item_id = item_id

    async def validate(self) -> None:
        if self.item_id is None:
            raise ValueError("item_id cannot be None")

    async def execute(self) -> Optional[Item]:
        return await self.ledger.repository(Item).get(self.item_id)

class GetWalletItems(EconomyCommand[List[Inventory]]):
    """Команда для получения всех предметов в инвентаре кошелька."""
    def __init__(self, ledger: Ledger, wallet_id: int):
        super().__init__(ledger)
        self.wallet_id = wallet_id

    async def validate(self) -> None:
        if self.wallet_id is None:
            raise ValueError("wallet_id cannot be None")

    async def execute(self) -> List[Inventory]:
        return await self.ledger.repository(Inventory).find().where(Inventory.owner_id == self.wallet_id).all()

class GetServerChannels(EconomyCommand[List[Server_Channels]]):
    """Команда для получения каналов сервера, участвующих в экономике."""
    def __init__(self, ledger: Ledger, server_id: int):
        super().__init__(ledger)
        self.server_id = server_id

    async def validate(self) -> None:
        if self.server_id is None:
            raise ValueError("server_id cannot be None")

    async def execute(self) -> List[Server_Channels]:
        return await self.ledger.repository(Server_Channels).find().where(Server_Channels.server_id == self.server_id).all()

class GetOrgMembers(EconomyCommand[List[Org_Members]]):
    """Команда для получения членов организации."""
    def __init__(self, ledger: Ledger, org_id: int):
        super().__init__(ledger)
        self.org_id = org_id

    async def validate(self) -> None:
        if self.org_id is None:
            raise ValueError("org_id cannot be None")

    async def execute(self) -> List[Org_Members]:
        return await self.ledger.repository(Org_Members).find().where(Org_Members.org_id == self.org_id).all()

class GetTransaction(EconomyCommand[Optional[Transaction]]):
    """Команда для получения информации о транзакции."""
    def __init__(self, ledger: Ledger, transaction_id: int):
        super().__init__(ledger)
        self.transaction_id = transaction_id

    async def validate(self) -> None:
        if self.transaction_id is None:
            raise ValueError("transaction_id cannot be None")

    async def execute(self) -> Optional[Transaction]:
        return await self.ledger.repository(Transaction).get(self.transaction_id)

class GetTransactionItems(EconomyCommand[List[Transaction_Items]]):
    """Команда для получения предметов, связанных с транзакцией."""
    def __init__(self, ledger: Ledger, transaction_id: int):
        super().__init__(ledger)
        self.transaction_id = transaction_id

    async def validate(self) -> None:
        if self.transaction_id is None:
            raise ValueError("transaction_id cannot be None")

    async def execute(self) -> List[Transaction_Items]:
        return await self.ledger.repository(Transaction_Items).find().where(Transaction_Items.transaction_id == self.transaction_id).all()

class GetTask(EconomyCommand[Optional[Task]]):
    """Команда для получения информации о задаче."""
    def __init__(self, ledger: Ledger, task_id: str):
        super().__init__(ledger)
        self.task_id = task_id

    async def validate(self) -> None:
        if not self.task_id:
            raise ValueError("task_id cannot be empty")

    async def execute(self) -> Optional[Task]:
        return await self.ledger.repository(Task).get(self.task_id)

class GetTaskWorkers(EconomyCommand[List[Task_Workers]]):
    """Команда для получения исполнителей задачи."""
    def __init__(self, ledger: Ledger, task_id: str):
        super().__init__(ledger)
        self.task_id = task_id

    async def validate(self) -> None:
        if not self.task_id:
            raise ValueError("task_id cannot be empty")

    async def execute(self) -> List[Task_Workers]:
        return await self.ledger.repository(Task_Workers).find().where(Task_Workers.task_id == self.task_id).all()

class GetDeal(EconomyCommand[Optional[Deal]]):
    """Команда для получения информации о сделке."""
    def __init__(self, ledger: Ledger, deal_id: str):
        super().__init__(ledger)
        self.deal_id = deal_id

    async def validate(self) -> None:
        if not self.deal_id:
            raise ValueError("deal_id cannot be empty")

    async def execute(self) -> Optional[Deal]:
        return await self.ledger.repository(Deal).get(self.deal_id)

class GetMarketListing(EconomyCommand[Optional[Market_Listing]]):
    """Команда для получения информации о лоте на рынке."""
    def __init__(self, ledger: Ledger, listing_id: str):
        super().__init__(ledger)
        self.listing_id = listing_id

    async def validate(self) -> None:
        if not self.listing_id:
            raise ValueError("listing_id cannot be empty")

    async def execute(self) -> Optional[Market_Listing]:
        return await self.ledger.repository(Market_Listing).get(self.listing_id)
