from economy.commands.base import EconomyCommand
from database.tables import Org, Wallet, User, Server

class GetWallet(EconomyCommand[Wallet]):
    def __init__(self, ledger, wallet_id):
        super().__init__(ledger)
        self.wallet_id = wallet_id
    
    async def validate(self):
        if self.wallet_id is None:
            raise ValueError("Wallet ID is required")

    async def execute(self):
        wallet = await self.ledger.repository(Wallet).get(self.wallet_id)
        return wallet

class GetUser(EconomyCommand[User]):
    def __init__(self, ledger, user_id):
        super().__init__(ledger)
        self.user_id = user_id
    
    async def validate(self):
        if self.user_id is None:
            raise ValueError("User ID is required")
    
    async def execute(self):
        user = await self.ledger.repository(User).get(self.user_id)
        return user

class GetServer(EconomyCommand[Server]):
    def __init__(self, ledger, server_id):
        super().__init__(ledger)
        self.server_id = server_id
    
    async def validate(self):
        if self.server_id is None:
            raise ValueError("Server ID is required")
    
    async def execute(self):
        server = await self.ledger.repository(Server).get(self.server_id)
        return server

class GetOrg(EconomyCommand[Org]):
    def __init__(self, ledger, org_id):
        super().__init__(ledger)
        self.org_id = org_id
    
    async def validate(self):
        if self.org_id is None:
            raise ValueError("Organization ID is required")
    
    async def execute(self):
        org = await self.ledger.repository(Org).get(self.org_id)
        return org