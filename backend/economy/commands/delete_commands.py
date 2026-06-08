from typing import Optional
from economy.commands.base import EconomyCommand
from backend.database.tables import (
    Server, Server_Channels, Wallet, User, Org, Org_Members,
    Item, Inventory, Task, Task_Workers, Deal, Market_Listing,
    Transaction, Transaction_Items
)
from backend.database.ledger import Ledger

class DeleteWallet(EconomyCommand[None]):
    """Удаляет кошелек."""
    def __init__(self, ledger: Ledger, wallet_id: int):
        super().__init__(ledger)
        self.wallet_id = wallet_id

    async def validate(self) -> None:
        wallet = await self.ledger.repository(Wallet).get(self.wallet_id)
        if not wallet:
            raise ValueError(f"Wallet {self.wallet_id} not found")

    async def execute(self) -> None:
        await self.ledger.repository(Wallet).delete(self.wallet_id)

class DeleteOrgMember(EconomyCommand[None]):
    """Удаляет участника из организации."""
    def __init__(self, ledger: Ledger, membership_id: int):
        super().__init__(ledger)
        self.membership_id = membership_id

    async def validate(self) -> None:
        member = await self.ledger.repository(Org_Members).get(self.membership_id)
        if not member:
            raise ValueError(f"Membership {self.membership_id} not found")

    async def execute(self) -> None:
        await self.ledger.repository(Org_Members).delete(self.membership_id)

class DeleteTransactionItem(EconomyCommand[None]):
    """Удаляет запись о предмете в транзакции."""
    def __init__(self, ledger: Ledger, item_record_id: int):
        super().__init__(ledger)
        self.item_record_id = item_record_id

    async def validate(self) -> None:
        record = await self.ledger.repository(Transaction_Items).get(self.item_record_id)
        if not record:
            raise ValueError(f"Transaction item record {self.item_record_id} not found")

    async def execute(self) -> None:
        await self.ledger.repository(Transaction_Items).delete(self.item_record_id)

class DeleteTransaction(EconomyCommand[None]):
    """Удаляет транзакцию и связанные с ней записи предметов."""
    def __init__(self, ledger: Ledger, transaction_id: int):
        super().__init__(ledger)
        self.transaction_id = transaction_id

    async def validate(self) -> None:
        tx = await self.ledger.repository(Transaction).get(self.transaction_id)
        if not tx:
            raise ValueError(f"Transaction {self.transaction_id} not found")

    async def execute(self) -> None:
        # Удаляем связанные предметы
        items = await self.ledger.repository(Transaction_Items).find(transaction_id=self.transaction_id)
        for item in items:
            await self.ledger.repository(Transaction_Items).delete(item.item_record_id)
            
        await self.ledger.repository(Transaction).delete(self.transaction_id)

class DeleteDeal(EconomyCommand[None]):
    """Удаляет сделку."""
    def __init__(self, ledger: Ledger, deal_id: str):
        super().__init__(ledger)
        self.deal_id = deal_id

    async def validate(self) -> None:
        deal = await self.ledger.repository(Deal).get(self.deal_id)
        if not deal:
            raise ValueError(f"Deal {self.deal_id} not found")

    async def execute(self) -> None:
        await self.ledger.repository(Deal).delete(self.deal_id)

class DeleteMarketListing(EconomyCommand[None]):
    """Удаляет лот на рынке."""
    def __init__(self, ledger: Ledger, listing_id: str):
        super().__init__(ledger)
        self.listing_id = listing_id

    async def validate(self) -> None:
        listing = await self.ledger.repository(Market_Listing).get(self.listing_id)
        if not listing:
            raise ValueError(f"Market listing {self.listing_id} not found")

    async def execute(self) -> None:
        await self.ledger.repository(Market_Listing).delete(self.listing_id)

class DeleteTaskWorker(EconomyCommand[None]):
    """Удаляет запись об исполнителе задачи."""
    def __init__(self, ledger: Ledger, work_id: int):
        super().__init__(ledger)
        self.work_id = work_id

    async def validate(self) -> None:
        worker = await self.ledger.repository(Task_Workers).get(self.work_id)
        if not worker:
            raise ValueError(f"Task worker record {self.work_id} not found")

    async def execute(self) -> None:
        await self.ledger.repository(Task_Workers).delete(self.work_id)

class DeleteTask(EconomyCommand[None]):
    """Удаляет задачу и записи о её исполнителях."""
    def __init__(self, ledger: Ledger, task_id: str):
        super().__init__(ledger)
        self.task_id = task_id

    async def validate(self) -> None:
        task = await self.ledger.repository(Task).get(self.task_id)
        if not task:
            raise ValueError(f"Task {self.task_id} not found")

    async def execute(self) -> None:
        # Удаляем исполнителей
        workers = await self.ledger.repository(Task_Workers).find(task_id=self.task_id)
        for worker in workers:
            await self.ledger.repository(Task_Workers).delete(worker.work_id)
            
        await self.ledger.repository(Task).delete(self.task_id)

class DeleteUser(EconomyCommand[None]):
    """Удаляет пользователя и опционально его кошелек."""
    def __init__(
        self, 
        ledger: Ledger,
        user_id: int,
        delete_wallet: bool = True
    ):
        super().__init__(ledger)
        self.user_id = user_id
        self.delete_wallet = delete_wallet
        self.user = None
    
    async def validate(self) -> None:
        self.user = await self.ledger.repository(User).get(self.user_id)
        if not self.user:
            raise ValueError(f"User {self.user_id} not found")
    
    async def execute(self) -> None:
        wallet_id = self.user.wallet_id
        
        # Удаляем пользователя
        await self.ledger.repository(User).delete(self.user_id)
        
        # Если нужно, удаляем кошелек
        if self.delete_wallet and wallet_id:
            await self.ledger.repository(Wallet).delete(wallet_id)

class DeleteServer(EconomyCommand[None]):
    """Удаляет сервер, его каналы и опционально кошелек."""
    def __init__(
        self, 
        ledger: Ledger,
        server_id: int,
        delete_wallet: bool = True
    ):
        super().__init__(ledger)
        self.server_id = server_id
        self.delete_wallet = delete_wallet
        self.server = None

    async def validate(self) -> None:
        self.server = await self.ledger.repository(Server).get(self.server_id)
        if not self.server:
            raise ValueError(f"Server {self.server_id} not found")
    
    async def execute(self) -> None:
        wallet_id = self.server.wallet_id
        
        # Удаляем каналы сервера
        channels = await self.ledger.repository(Server_Channels).find(server_id=self.server_id)
        for channel in channels:
            await self.ledger.repository(Server_Channels).delete(channel.id)
            
        # Удаляем сам сервер
        await self.ledger.repository(Server).delete(self.server_id)
        
        # Удаляем кошелек
        if self.delete_wallet and wallet_id:
            await self.ledger.repository(Wallet).delete(wallet_id)

class DeleteOrg(EconomyCommand[None]):
    """Удаляет организацию, её участников и опционально кошелек."""
    def __init__(
        self, 
        ledger: Ledger,
        org_id: int,
        delete_wallet: bool = True
    ):
        super().__init__(ledger)
        self.org_id = org_id
        self.delete_wallet = delete_wallet
        self.org = None

    async def validate(self) -> None:
        self.org = await self.ledger.repository(Org).get(self.org_id)
        if not self.org:
            raise ValueError(f"Organization {self.org_id} not found")
    
    async def execute(self) -> None:
        wallet_id = self.org.wallet_id
        
        # Удаляем участников организации
        members = await self.ledger.repository(Org_Members).find(org_id=self.org_id)
        for member in members:
            await self.ledger.repository(Org_Members).delete(member.id)
            
        # Удаляем организацию
        await self.ledger.repository(Org).delete(self.org_id)
        
        # Удаляем кошелек
        if self.delete_wallet and wallet_id:
            await self.ledger.repository(Wallet).delete(wallet_id)

class DeleteItemType(EconomyCommand[None]):
    """Удаляет тип предмета (только если нет предметов в инвентарях)."""
    def __init__(
        self,
        ledger: Ledger,
        item_id: int
    ):
        super().__init__(ledger)
        self.item_id = item_id

    async def validate(self) -> None:
        item = await self.ledger.repository(Item).get(self.item_id)
        if not item:
            raise ValueError(f"Item type {self.item_id} not found")
            
        # Проверяем, есть ли такие предметы у игроков
        in_inventories = await self.ledger.repository(Inventory).find(item_type=self.item_id)
        if in_inventories:
            raise ValueError(f"Cannot delete item type {self.item_id}: it is still present in user inventories")

    async def execute(self) -> None:
        await self.ledger.repository(Item).delete(self.item_id)

class RemoveFromInventory(EconomyCommand[None]):
    """Удаляет конкретный экземпляр предмета из инвентаря."""
    def __init__(
        self,
        ledger: Ledger,
        inventory_id: int
    ):
        super().__init__(ledger)
        self.inventory_id = inventory_id

    async def validate(self) -> None:
        item = await self.ledger.repository(Inventory).get(self.inventory_id)
        if not item:
            raise ValueError(f"Inventory item {self.inventory_id} not found")

    async def execute(self) -> None:
        await self.ledger.repository(Inventory).delete(self.inventory_id)
