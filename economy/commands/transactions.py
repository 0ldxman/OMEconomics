from typing import Optional, List, Dict
import uuid
from economy.commands.base import EconomyCommand
from database.tables import Wallet, Transaction, Transaction_Items, Server, Inventory
from database.ledger import Ledger

class WalletPay(EconomyCommand[bool]):
    """
    Атомарная операция: Изменение баланса кошельков без логирования.
    Используется внутри более высокоуровневых команд.
    """
    def __init__(self, ledger: Ledger, giver_id: int, receiver_id: int, amount: float = 0.0, gold_amount: float = 0.0):
        super().__init__(ledger)
        self.giver_id = giver_id
        self.receiver_id = receiver_id
        self.amount = amount
        self.gold_amount = gold_amount
    
    async def validate(self) -> None:
        giver = await self.ledger.repository(Wallet).get(self.giver_id)
        receiver = await self.ledger.repository(Wallet).get(self.receiver_id)

        if not giver:
            raise ValueError(f"Giver wallet {self.giver_id} not found")
        if not receiver:
            raise ValueError(f"Receiver wallet {self.receiver_id} not found")
        if giver.balance < self.amount:
            raise ValueError("Not enough money")
        if giver.gold < self.gold_amount:
            raise ValueError("Not enough gold")
    
    async def execute(self) -> bool:
        giver = await self.ledger.repository(Wallet).get(self.giver_id)
        receiver = await self.ledger.repository(Wallet).get(self.receiver_id)
        
        giver.balance -= self.amount
        giver.gold -= self.gold_amount
        receiver.balance += self.amount
        receiver.gold += self.gold_amount
        return True

class GiveItems(EconomyCommand[List[int]]):
    """
    Атомарная операция: Передача предметов между владельцами.
    Возвращает список ID переданных предметов.
    """
    def __init__(self, ledger: Ledger, giver_id: int, receiver_id: int, item_type: int, amount: int = 1):
        super().__init__(ledger)
        self.giver_id = giver_id
        self.receiver_id = receiver_id
        self.item_type = item_type
        self.amount = amount
    
    async def validate(self) -> None:
        giver_items = await self.ledger.repository(Inventory).find().where(
            (Inventory.owner_id == self.giver_id) & (Inventory.item_type == self.item_type)
        ).all()

        if len(giver_items) < self.amount:
            raise ValueError(f"Not enough items of type {self.item_type}")
    
    async def execute(self) -> List[int]:
        giver_items = await self.ledger.repository(Inventory).find().where(
            (Inventory.owner_id == self.giver_id) & (Inventory.item_type == self.item_type)
        ).all()
        
        item_ids = []
        for item in giver_items[:self.amount]:
            item.owner_id = self.receiver_id
            item_ids.append(item.id)
        return item_ids

class BaseTransaction(EconomyCommand[bool]):
    """Базовый класс для всех денежных и предметных операций с логированием."""
    def __init__(self, ledger: Ledger, transaction_group_id: Optional[int] = None):
        super().__init__(ledger)
        self.group_id = transaction_group_id or int(uuid.uuid4().int >> 96)

    async def _log_tx(
        self, 
        wallet_id: int, 
        amount: float = 0.0, 
        gold_amount: float = 0.0, 
        tx_type: str = "gift", 
        description: str = "",
        item_ids: Optional[List[int]] = None
    ) -> Transaction:
        tx_id = int(uuid.uuid4().int >> 65)
        tx = Transaction(
            id=tx_id,
            transaction_group_id=self.group_id,
            wallet_id=wallet_id,
            type=tx_type,
            description=description,
            amount=amount,
            gold_amount=gold_amount
        )
        await self.ledger.repository(Transaction).add(tx)
        
        if item_ids:
            for item_id in item_ids:
                tx_item = Transaction_Items(
                    transaction_id=tx_id,
                    item_id=item_id
                )
                await self.ledger.repository(Transaction_Items).add(tx_item)
        
        return tx

class TransferCommand(BaseTransaction):
    """
    Высокоуровневая команда: Перевод валюты и предметов.
    Использует атомарные команды WalletPay и GiveItems.
    """
    def __init__(
        self, 
        ledger: Ledger, 
        sender_wallet_id: int, 
        receiver_wallet_id: int, 
        amount: float = 0.0,
        gold_amount: float = 0.0,
        items: Optional[Dict[int, int]] = None, # {item_type: count}
        server_id: Optional[int] = None,
        description: str = "Перевод",
        transaction_group_id: Optional[int] = None,
        sender_tag: str = "transfer_out",
        receiver_tag: str = "transfer_in"
    ):
        super().__init__(ledger, transaction_group_id=transaction_group_id)
        self.sender_id = sender_wallet_id
        self.receiver_id = receiver_wallet_id
        self.amount = amount
        self.gold_amount = gold_amount
        self.items = items or {}
        self.server_id = server_id
        self.description = description
        self.sender_tag = sender_tag
        self.receiver_tag = receiver_tag

    async def validate(self) -> None:
        # 1. Расчет налога для валидации
        tax_amount = 0.0
        if self.server_id and self.amount > 0:
            server = await self.ledger.repository(Server).get(self.server_id)
            if server:
                tax_rate = server.settings.get("transactions", {}).get("tax", 0.0)
                tax_amount = self.amount * tax_rate

        total_needed = self.amount + tax_amount
        
        # Валидация денег (отправитель должен иметь сумму + налог)
        giver = await self.ledger.repository(Wallet).get(self.sender_id)
        if not giver:
            raise ValueError(f"Giver wallet {self.sender_id} not found")
        if giver.balance < total_needed:
            raise ValueError(f"Insufficient funds to cover transfer and tax (needed: {total_needed}, available: {giver.balance})")
        if giver.gold < self.gold_amount:
            raise ValueError(f"Insufficient gold (needed: {self.gold_amount}, available: {giver.gold})")

        # Валидация получателя
        receiver = await self.ledger.repository(Wallet).get(self.receiver_id)
        if not receiver:
            raise ValueError(f"Receiver wallet {self.receiver_id} not found")
        
        # Валидация предметов через GiveItems
        for item_type, count in self.items.items():
            await GiveItems(self.ledger, self.sender_id, self.receiver_id, item_type, count).validate()

    async def execute(self) -> bool:
        # 1. Расчет налога
        tax_amount = 0.0
        server_wallet_id = None
        if self.server_id and self.amount > 0:
            server = await self.ledger.repository(Server).get(self.server_id)
            if server:
                tax_rate = server.settings.get("transactions", {}).get("tax", 0.0)
                tax_amount = self.amount * tax_rate
                server_wallet_id = server.wallet_id

        # 2. Перевод налога серверу (отправитель платит сверху)
        if tax_amount > 0 and server_wallet_id:
            await WalletPay(self.ledger, self.sender_id, server_wallet_id, tax_amount, 0.0).execute()
            await self._log_tx(server_wallet_id, tax_amount, 0.0, "tax", f"Налог за перевод")

        # 3. Перевод полной суммы получателю
        await WalletPay(self.ledger, self.sender_id, self.receiver_id, self.amount, self.gold_amount).execute()
        
        # 4. Передача предметов
        all_item_ids = []
        for item_type, count in self.items.items():
            ids = await GiveItems(self.ledger, self.sender_id, self.receiver_id, item_type, count).execute()
            all_item_ids.extend(ids)

        # 5. Логирование сторон
        # Отправитель теряет полную сумму (сумма + налог)
        total_spent = self.amount + tax_amount
        await self._log_tx(self.sender_id, -total_spent, -self.gold_amount, self.sender_tag, self.description, all_item_ids)
        # Получатель получает ровно столько, сколько ему отправили
        await self._log_tx(self.receiver_id, self.amount, self.gold_amount, self.receiver_tag, self.description, all_item_ids)
        
        return True

class MintCommand(BaseTransaction):
    """
    Печать денег (эмиссия). Деньги появляются в системе из ниоткуда.
    Обычно используется только сервером для пополнения своего бюджета.
    """
    def __init__(self, ledger, wallet_id, amount=0.0, gold_amount=0.0, description="Эмиссия", transaction_group_id=None, tag="mint"):
        super().__init__(ledger, transaction_group_id=transaction_group_id)
        self.wallet_id = wallet_id
        self.amount = amount
        self.gold_amount = gold_amount
        self.description = description
        self.tag = tag

    async def validate(self) -> None:
        if self.amount < 0 or self.gold_amount < 0:
            raise ValueError("Нельзя напечатать отрицательное количество")
        wallet = await self.ledger.repository(Wallet).get(self.wallet_id)
        if not wallet: raise ValueError("Wallet not found")

    async def execute(self) -> bool:
        wallet = await self.ledger.repository(Wallet).get(self.wallet_id)
        wallet.balance += self.amount
        wallet.gold += self.gold_amount
        await self._log_tx(self.wallet_id, self.amount, self.gold_amount, self.tag, self.description)
        return True

class BurnCommand(BaseTransaction):
    """
    Уничтожение денег (вывод из системы).
    Используется при закупках сервером или штрафах, когда деньги должны исчезнуть.
    """
    def __init__(self, ledger, wallet_id, amount=0.0, gold_amount=0.0, description="Сжигание", transaction_group_id=None):
        super().__init__(ledger, transaction_group_id=transaction_group_id)
        self.wallet_id = wallet_id
        self.amount = amount
        self.gold_amount = gold_amount
        self.description = description

    async def validate(self) -> None:
        wallet = await self.ledger.repository(Wallet).get(self.wallet_id)
        if not wallet or wallet.balance < self.amount or wallet.gold < self.gold_amount:
            raise ValueError("Insufficient funds for burning")

    async def execute(self) -> bool:
        wallet = await self.ledger.repository(Wallet).get(self.wallet_id)
        wallet.balance -= self.amount
        wallet.gold -= self.gold_amount
        await self._log_tx(self.wallet_id, -self.amount, -self.gold_amount, "burn", self.description)
        return True
