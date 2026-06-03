from datetime import datetime
from typing import Dict, Any, List, TypeVar, Optional
import uuid
from economy.commands.base import EconomyCommand
from database.tables import Server, Server_Channels, Wallet, User, Transaction, Org
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
        # Если ID не передан, генерируем случайный 63-битный ID.
        # SQLite INTEGER — это знаковое 64-битное число. 
        # Чтобы избежать OverflowError, используем 63 бита (всегда положительное).
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

        # Создаем объект Server. 
        # Те поля, которые мы не передали (None), подхватят дефолтные значения из Column в tables.py
        # благодаря магии декоратора @db_table, который превращает класс в dataclass с дефолтами.
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
        
        # Проверка существования организации
        existing = await self.ledger.repository(Org).get(self.org_id)
        if existing:
            raise ValueError(f"Organization {self.org_id} already exists")
        
        # Проверка существования создателя
        creator = await self.ledger.repository(User).get(self.creator_id)
        if not creator:
            raise ValueError(f"Creator (User) {self.creator_id} not found")

        # Проверка существования основателя (если он отличается от создателя)
        if self.founder_id != self.creator_id:
            founder = await self.ledger.repository(User).get(self.founder_id)
            if not founder:
                raise ValueError(f"Founder (User) {self.founder_id} not found")

        # Если передан wallet_id, проверяем его
        if self.wallet_id is not None:
            wallet = await self.ledger.repository(Wallet).get(self.wallet_id)
            if not wallet:
                raise ValueError(f"Wallet {self.wallet_id} not found")

    async def execute(self) -> Org:
        if self.wallet_id is None:
            # Создаем кошелек для организации
            wallet = await CreateWallet(self.ledger).execute()
            self.wallet_id = wallet.id

        org_data = {
            "id": self.org_id,
            "wallet_id": self.wallet_id,
            "creator_id": self.creator_id,
            "founder_id": self.founder_id
        }
        
        # Добавляем опциональные поля, если они переданы
        if self.long_name: org_data["long_name"] = self.long_name
        if self.short_name: org_data["short_name"] = self.short_name
        if self.org_type: org_data["type"] = self.org_type
        if self.description: org_data["description"] = self.description

        org = Org(**org_data)
        await self.ledger.repository(Org).add(org)
        return org