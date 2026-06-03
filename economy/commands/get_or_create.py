from economy.commands.base import EconomyCommand
from economy.commands.get_commands import GetWallet, GetUser, GetServer, GetOrg
from economy.commands.create_commands import CreateWallet, CreateUser, CreateOrg, AddServer
from database.tables import Wallet, User, Server, Org

class GetOrCreateWallet(EconomyCommand[Wallet]):
    def __init__(self, ledger, wallet_id):
        super().__init__(ledger)
        self.wallet_id = wallet_id
    
    async def validate(self) -> None:
        if self.wallet_id is None:
            raise ValueError("wallet_id is required")

    async def execute(self) -> Wallet:
        wallet = await GetWallet(self.ledger, self.wallet_id).execute()
        if wallet is None:
            wallet = await CreateWallet(self.ledger, self.wallet_id).execute()
        return wallet

class GetOrCreateUser(EconomyCommand[User]):
    def __init__(self, ledger, user_id):
        super().__init__(ledger)
        self.user_id = user_id
    
    async def validate(self) -> None:
        if self.user_id is None:
            raise ValueError("user_id is required")

    async def execute(self) -> User:
        user = await GetUser(self.ledger, self.user_id).execute()
        if user is None:
            user = await CreateUser(self.ledger, self.user_id).execute()
        elif user.wallet_id is None:
            # Если юзер есть, но у него нет кошелька
            print(f" [Fix] Создание недостающего кошелька для пользователя {self.user_id}")
            wallet = await CreateWallet(self.ledger).execute()
            user.wallet_id = wallet.id
        return user

class GetOrCreateServer(EconomyCommand[Server]):
    def __init__(self, ledger, server_id):
        super().__init__(ledger)
        self.server_id = server_id
    
    async def validate(self) -> None:
        if self.server_id is None:
            raise ValueError("server_id is required")

    async def execute(self) -> Server:
        server = await GetServer(self.ledger, self.server_id).execute()
        if server is None:
            server = await AddServer(self.ledger, self.server_id).execute()
        elif server.wallet_id is None:
            # Если сервер есть, но у него нет кошелька (ошибка миграции или прошлых багов)
            print(f" [Fix] Создание недостающего кошелька для сервера {self.server_id}")
            wallet = await CreateWallet(self.ledger).execute()
            server.wallet_id = wallet.id
        return server

class GetOrCreateOrg(EconomyCommand[Org]):
    def __init__(self, ledger, org_id, creator_id=None):
        super().__init__(ledger)
        self.org_id = org_id
        self.creator_id = creator_id
    
    async def validate(self) -> None:
        if self.org_id is None:
            raise ValueError("org_id is required")

    async def execute(self) -> Org:
        org = await GetOrg(self.ledger, self.org_id).execute()
        if org is None:
            if self.creator_id is None:
                raise ValueError("creator_id is required to create a new organization")
            org = await CreateOrg(self.ledger, self.org_id, self.creator_id).execute()
        elif org.wallet_id is None:
            # Если организация есть, но у нее нет кошелька
            print(f" [Fix] Создание недостающего кошелька для организации {self.org_id}")
            wallet = await CreateWallet(self.ledger).execute()
            org.wallet_id = wallet.id
        return org
