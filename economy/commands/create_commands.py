
from datetime import datetime, timedelta
from typing import Dict, Any, List, TypeVar, Optional
import uuid
from economy.commands.base import EconomyCommand
from economy.commands.transactions import TransferCommand, GiveItems, BurnCommand
from database.tables import (
    Server, Server_Channels, Wallet, User, Transaction, Org, Org_Members,
    Item, Inventory, Task, Task_Workers, Deal, Market_Listing
)
from database.ledger import Ledger

class CreateWallet(EconomyCommand[Wallet]):
    def __init__(
        self, 
        ledger: Ledger,
        wallet_id: Optional[int] = None,
    ):
        super().__init__(ledger)
        self.wallet_id = wallet_id
    
    async def validate(self) -> None:
        if self.wallet_id is not None:
            if self.wallet_id < 0:
                raise ValueError("wallet_id must be positive")
            existing = await self.ledger.repository(Wallet).get(self.wallet_id)
            if existing:
                raise ValueError("wallet_id already exists")
    
    async def execute(self) -> Wallet:
        if self.wallet_id is None:
            self.wallet_id = int(uuid.uuid4().int >> 65)

        wallet = Wallet(id=self.wallet_id)
        await self.ledger.repository(Wallet).add(wallet)
        return wallet

class CreateUser(EconomyCommand[User]):
    def __init__(
        self, 
        ledger: Ledger,
        user_id: int,
        wallet_id: Optional[int] = None,
    ):
        super().__init__(ledger)
        self.user_id = user_id
        self.wallet_id = wallet_id
    
    async def validate(self) -> None:
        if self.user_id is None:
            raise ValueError("user_id is None")
        
        existing_user = await self.ledger.repository(User).get(self.user_id)
        if existing_user:
            raise ValueError(f"User {self.user_id} already exists")

        if self.wallet_id is not None:
            existing_wallet = await self.ledger.repository(Wallet).get(self.wallet_id)
            if not existing_wallet:
                raise ValueError(f"Wallet {self.wallet_id} does not exist")
    
    async def execute(self) -> User:
        if self.wallet_id is None:
            wallet = await CreateWallet(self.ledger).execute()
            self.wallet_id = wallet.id

        user = User(
            id=self.user_id,
            wallet_id=self.wallet_id,
        )
        await self.ledger.repository(User).add(user)
        return user

class AddServer(EconomyCommand[Server]):
    def __init__(
        self, 
        ledger: Ledger,
        server_id: int,
        wallet_id: Optional[int] = None,
        last_emission: Optional[datetime] = None,
        settings: Optional[dict] = None,
    ):
        super().__init__(ledger)
        self.server_id = server_id
        self.wallet_id = wallet_id
        self.last_emission = last_emission
        self.settings = settings

    async def validate(self) -> None:
        if self.server_id is None:
            raise ValueError("server_id is None")
        
        existing = await self.ledger.repository(Server).get(self.server_id)
        if existing:
            raise ValueError(f"Server {self.server_id} already exists")
    
    async def execute(self) -> Server:
        if self.wallet_id is None:
            wallet = await CreateWallet(self.ledger).execute()
            self.wallet_id = wallet.id

        server_data = {"id": self.server_id, "wallet_id": self.wallet_id}
        if self.last_emission:
            server_data["last_emission"] = self.last_emission
        if self.settings:
            server_data["settings"] = self.settings

        server = Server(**server_data)
        await self.ledger.repository(Server).add(server)
        return server


class CreateOrg(EconomyCommand[Org]):
    def __init__(
        self, 
        ledger: Ledger,
        org_id: int,
        creator_id: int,
        founder_id: Optional[int] = None,
        long_name: Optional[str] = None,
        short_name: Optional[str] = None,
        org_type: Optional[str] = None,
        description: Optional[str] = None,
        wallet_id: Optional[int] = None,
    ):
        super().__init__(ledger)
        self.org_id = org_id
        self.creator_id = creator_id
        self.founder_id = founder_id or creator_id
        self.long_name = long_name
        self.short_name = short_name
        self.org_type = org_type
        self.description = description
        self.wallet_id = wallet_id

    async def validate(self) -> None:
        if self.org_id is None:
            raise ValueError("org_id is required")
        
        existing = await self.ledger.repository(Org).get(self.org_id)
        if existing:
            raise ValueError(f"Organization {self.org_id} already exists")
        
        creator = await self.ledger.repository(User).get(self.creator_id)
        if not creator:
            raise ValueError(f"Creator (User) {self.creator_id} not found")

        if self.founder_id != self.creator_id:
            founder = await self.ledger.repository(User).get(self.founder_id)
            if not founder:
                raise ValueError(f"Founder (User) {self.founder_id} not found")

        if self.wallet_id is not None:
            wallet = await self.ledger.repository(Wallet).get(self.wallet_id)
            if not wallet:
                raise ValueError(f"Wallet {self.wallet_id} not found")

    async def execute(self) -> Org:
        if self.wallet_id is None:
            wallet = await CreateWallet(self.ledger).execute()
            self.wallet_id = wallet.id

        org_data = {
            "id": self.org_id,
            "wallet_id": self.wallet_id,
            "creator_id": self.creator_id,
            "founder_id": self.founder_id
        }
        
        if self.long_name: org_data["long_name"] = self.long_name
        if self.short_name: org_data["short_name"] = self.short_name
        if self.org_type: org_data["type"] = self.org_type
        if self.description: org_data["description"] = self.description

        org = Org(**org_data)
        await self.ledger.repository(Org).add(org)
        return org

class CreateItemType(EconomyCommand[Item]):
    def __init__(
        self,
        ledger: Ledger,
        server_id: int,
        name: str,
        price: float = 0.0,
        description: Optional[str] = None,
        picture_url: Optional[str] = None,
        settings: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(ledger)
        self.server_id = server_id
        self.name = name
        self.price = price
        self.description = description
        self.picture_url = picture_url
        self.settings = settings

    async def validate(self) -> None:
        server = await self.ledger.repository(Server).get(self.server_id)
        if not server:
            raise ValueError(f"Server with id {self.server_id} not found")

    async def execute(self) -> Item:
        item_data = {
            "server_id": self.server_id,
            "name": self.name,
            "price": self.price,
        }
        if self.description: item_data["description"] = self.description
        if self.picture_url: item_data["picture_url"] = self.picture_url
        if self.settings: item_data["settings"] = self.settings

        item = Item(**item_data)
        await self.ledger.repository(Item).add(item)
        return item

class AddItemToInventory(EconomyCommand[Inventory]):
    def __init__(
        self,
        ledger: Ledger,
        owner_id: int, 
        item_type: int,
        data: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(ledger)
        self.owner_id = owner_id
        self.item_type = item_type
        self.data = data

    async def validate(self) -> None:
        wallet = await self.ledger.repository(Wallet).get(self.owner_id)
        if not wallet:
            raise ValueError(f"Wallet with id {self.owner_id} not found")
            
        item_def = await self.ledger.repository(Item).get(self.item_type)
        if not item_def:
            raise ValueError(f"Item definition with id {self.item_type} not found")

    async def execute(self) -> Inventory:
        inventory_item = Inventory(
            owner_id=self.owner_id,
            item_type=self.item_type,
            data=self.data,
        )
        await self.ledger.repository(Inventory).add(inventory_item)
        return inventory_item

class CreateTask(EconomyCommand[Task]):
    def __init__(
        self,
        ledger: Ledger,
        creator_id: int,
        server_id: int,
        name: str,
        price: float,
        task_id: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ):
        super().__init__(ledger)
        self.task_id = task_id or uuid.uuid4().hex
        self.creator_id = creator_id
        self.server_id = server_id
        self.name = name
        self.description = description
        self.price = price
        self.tags = tags

    async def validate(self) -> None:
        creator_wallet = await self.ledger.repository(Wallet).get(self.creator_id)
        if not creator_wallet:
            raise ValueError(f"Creator's wallet with id {self.creator_id} not found")
        
        server = await self.ledger.repository(Server).get(self.server_id)
        if not server:
            raise ValueError(f"Server with id {self.server_id} not found")
            
        listing_fee = server.settings.get("task", {}).get("listing", 0)
        total_cost = self.price + listing_fee

        if creator_wallet.balance < total_cost:
            raise ValueError(f"Creator's wallet has insufficient funds. Required: {total_cost} (price + fee), Available: {creator_wallet.balance}")

        existing_task = await self.ledger.repository(Task).get(self.task_id)
        if existing_task:
            raise ValueError(f"Task with id {self.task_id} already exists")

    async def execute(self) -> Task:
        server = await self.ledger.repository(Server).get(self.server_id)
        server_wallet_id = server.wallet_id
        listing_fee = server.settings.get("task", {}).get("listing", 0)

        # Сжигаем комиссию за размещение
        if listing_fee > 0:
            burn_cmd = BurnCommand(
                ledger=self.ledger,
                wallet_id=self.creator_id,
                amount=listing_fee,
                description=f"Комиссия за размещение задачи {self.task_id}"
            )
            await burn_cmd.validate()
            await burn_cmd.execute()

        # Создаем эскроу-кошелек и переводим на него бюджет задачи
        escrow_wallet = await CreateWallet(self.ledger).execute()
        transfer_cmd = TransferCommand(
            ledger=self.ledger,
            sender_wallet_id=self.creator_id,
            receiver_wallet_id=escrow_wallet.id,
            amount=self.price,
            server_id=self.server_id,
            description=f"Резервирование средств для задачи {self.task_id}"
        )
        await transfer_cmd.validate()
        await transfer_cmd.execute()

        task_data = {
            "id": self.task_id,
            "wallet_id": escrow_wallet.id,
            "creator_id": self.creator_id,
            "server_id": self.server_id,
            "name": self.name,
            "price": self.price,
        }
        if self.description: task_data["description"] = self.description
        if self.tags: task_data["tags"] = self.tags

        task = Task(**task_data)
        await self.ledger.repository(Task).add(task)
        return task

class CreateDeal(EconomyCommand[Deal]):
    def __init__(
        self,
        ledger: Ledger,
        side_a_id: int,
        side_b_id: int,
        deal_id: Optional[str] = None,
    ):
        super().__init__(ledger)
        self.deal_id = deal_id or uuid.uuid4().hex
        self.side_a_id = side_a_id
        self.side_b_id = side_b_id
    
    async def validate(self) -> None:
        side_a_wallet = await self.ledger.repository(Wallet).get(self.side_a_id)
        if not side_a_wallet:
            raise ValueError(f"Side A wallet with id {self.side_a_id} not found")

        side_b_wallet = await self.ledger.repository(Wallet).get(self.side_b_id)
        if not side_b_wallet:
            raise ValueError(f"Side B wallet with id {self.side_b_id} not found")

        existing_deal = await self.ledger.repository(Deal).get(self.deal_id)
        if existing_deal:
            raise ValueError(f"Deal with id {self.deal_id} already exists")

    async def execute(self) -> Deal:
        escrow_wallet = await CreateWallet(self.ledger).execute()
        
        deal = Deal(
            id=self.deal_id,
            wallet_id=escrow_wallet.id,
            side_a_id=self.side_a_id,
            side_b_id=self.side_b_id
        )
        await self.ledger.repository(Deal).add(deal)
        return deal

class CreateMarketListing(EconomyCommand[Market_Listing]):
    def __init__(
        self,
        ledger: Ledger,
        server_id: int,
        owner_id: int,
        item_type: int,
        amount: int,
        price_per_item: float,
        listing_id: Optional[str] = None
    ):
        super().__init__(ledger)
        self.server_id = server_id
        self.owner_id = owner_id
        self.item_type = item_type
        self.amount = amount
        self.price_per_item = price_per_item
        self.listing_id = listing_id or uuid.uuid4().hex

    async def validate(self) -> None:
        if self.amount <= 0:
            raise ValueError("Amount must be positive")
        if self.price_per_item < 0:
            raise ValueError("Price must be non-negative")

        # 1. Проверка существования сущностей
        seller_wallet = await self.ledger.repository(Wallet).get(self.owner_id)
        if not seller_wallet:
            raise ValueError(f"Seller wallet with id {self.owner_id} not found")
            
        server = await self.ledger.repository(Server).get(self.server_id)
        if not server:
            raise ValueError(f"Server with id {self.server_id} not found")

        item_def = await self.ledger.repository(Item).get(self.item_type)
        if not item_def:
            raise ValueError(f"Item definition with id {self.item_type} not found")

        # 2. Проверка наличия предметов у продавца
        seller_items = await self.ledger.repository(Inventory).find().where(
            (Inventory.owner_id == self.owner_id) & (Inventory.item_type == self.item_type)
        ).all()
        if len(seller_items) < self.amount:
            raise ValueError(f"Insufficient items. Seller has {len(seller_items)}, but requires {self.amount}")

    async def execute(self) -> Market_Listing:
        listing = Market_Listing(
            id=self.listing_id,
            server_id=self.server_id,
            owner_id=self.owner_id,
            item_type=self.item_type,
            amount=self.amount,
            price_per_item=self.price_per_item
        )
        await self.ledger.repository(Market_Listing).add(listing)
        return listing

class AddOrgMember(EconomyCommand[Org_Members]):
    def __init__(
        self,
        ledger: Ledger,
        org_id: int,
        user_id: int,
        roles: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(ledger)
        self.org_id = org_id
        self.user_id = user_id
        self.roles = roles or {}

    async def validate(self) -> None:
        org = await self.ledger.repository(Org).get(self.org_id)
        if not org:
            raise ValueError(f"Organization with id {self.org_id} not found")
        
        user = await self.ledger.repository(User).get(self.user_id)
        if not user:
            raise ValueError(f"User with id {self.user_id} not found")

    async def execute(self) -> Org_Members:
        membership_id = int(uuid.uuid4().int >> 65)
        member = Org_Members(
            membership_id=membership_id,
            org_id=self.org_id,
            user_id=self.user_id,
            roles=self.roles
        )
        await self.ledger.repository(Org_Members).add(member)
        return member

class AddServerChannel(EconomyCommand[Server_Channels]):
    def __init__(
        self,
        ledger: Ledger,
        server_id: int,
        channel_id: int,
        channel_type: str = "text-channel",
        weight: float = 1.0,
    ):
        super().__init__(ledger)
        self.server_id = server_id
        self.channel_id = channel_id
        self.channel_type = channel_type
        self.weight = weight

    async def validate(self) -> None:
        server = await self.ledger.repository(Server).get(self.server_id)
        if not server:
            raise ValueError(f"Server with id {self.server_id} not found")
        
        existing_channel = await self.ledger.repository(Server_Channels).get(self.channel_id)
        if existing_channel:
            raise ValueError(f"Channel with id {self.channel_id} already registered")

    async def execute(self) -> Server_Channels:
        channel = Server_Channels(
            server_id=self.server_id,
            channel_id=self.channel_id,
            type=self.channel_type,
            weight=self.weight
        )
        await self.ledger.repository(Server_Channels).add(channel)
        return channel

class AddTaskWorker(EconomyCommand[Task_Workers]):
    def __init__(
        self,
        ledger: Ledger,
        task_id: str,
        worker_id: int,
    ):
        super().__init__(ledger)
        self.task_id = task_id
        self.worker_id = worker_id

    async def validate(self) -> None:
        task = await self.ledger.repository(Task).get(self.task_id)
        if not task:
            raise ValueError(f"Task with id {self.task_id} not found")

        worker_wallet = await self.ledger.repository(Wallet).get(self.worker_id)
        if not worker_wallet:
            raise ValueError(f"Worker wallet with id {self.worker_id} not found")

    async def execute(self) -> Task_Workers:
        work_id = int(uuid.uuid4().int >> 65)
        worker = Task_Workers(
            work_id=work_id,
            task_id=self.task_id,
            worker_id=self.worker_id
        )
        await self.ledger.repository(Task_Workers).add(worker)
        return worker
