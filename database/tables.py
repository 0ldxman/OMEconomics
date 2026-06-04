from database.core import db_table, Column
from datetime import datetime

@db_table(version=1)
class Wallet: # Таблица балансов любых сущностей в нашей системе
    id: int = Column(
        primary_key=True,
        on_delete="CASCADE",
        on_update="CASCADE",
        )
    balance: float = Column(default=0.0)
    gold: float = Column(default=0.0)
    last_use: datetime = Column(auto_now_add=True)

@db_table(version=1)
class User: # Таблица пользователей
    id: int = Column(
        primary_key=True,
        on_delete="CASCADE",
        on_update="CASCADE",
    )
    wallet_id: int = Column(fk="wallet.id")

@db_table(version=1)
class Server: # Таблица серверов и их настроек экономики
    id: int = Column(
        primary_key=True,
        on_delete="CASCADE",
        on_update="CASCADE",
    )
    wallet_id: int = Column(fk="wallet.id")
    last_emission: datetime = Column(auto_now_add=True)
    settings: dict = Column( # Тут задаются настройки комиссий и налогов сервера
        default={
            "monetary": {
                "reserve_percent": 0.1,
                "base_emission_per_user": 1000,
                "inactive_days_threshold": 5,
                "new_user_gift": 1000,
            },
            "market": {
                "listing": 10,
                "sale": 0.05,
                "expiration_hours": 24,
            },
            "task": {
                "listing": 10,
                "escrow": 0.05,
                "expiration_hours": 72,
            },
            "transactions": {
                "tax": 0.02,
            },
            "shop": {
                "margin": 0.1,
            },
            "organization": {
                "tax": 0.01,
                "per_member_tax": 100,
                "registration_fee": 500,
            },
            "filters": {
                "min_message_length": 10,
                "message_length_weight": 0.5,
                "spam_cooldown_seconds": 10,
                "outliers_trim_pct": 0.05,
                "reaction_bonus": 0.5,
                "score_bonus_per_media": 0.5,
            }
        }
    )

@db_table(version=1)
class Server_Channels: # Таблица где хранятся каналы, треды, форумы и категории за общение в которых даются деньги.
    server_id: int = Column(fk="server.id")
    channel_id: int = Column(primary_key=True)
    type: str = Column(default="text-channel")
    weight: float = Column(default=0.0)

@db_table(version=1)
class Item: # Таблица всех предметов которые создают и продают сервера
    id: int = Column(
        primary_key=True,
        on_delete="CASCADE",
        on_update="CASCADE",
    )
    name: str = Column(default="Unknown Item")
    server_id: int = Column(fk="server.id")
    description: str = Column(default="Unknown Item")
    price: float = Column(default=0.0)
    picture_url: str = Column()
    settings: dict = Column( # Тут задаются доп настройки предмета
        default={
            "required_roles": [],
            "market": {
                "is_tradable": True,
                "is_marketable": True,
            },
            "temporary": {
                "is_temporary": False,
                "expiration_hours": -1,
            },
            "consumable": {
                "is_consumable": False,
                "max_uses": -1,
                "effects": {
                    "grant_roles": [],
                    "take_roles": [],
                    "give_items": [],
                    "take_items": [],
                    "cash_bonus": 0.0,
                    "gold_bonus": 0.0,
                    "script": [],
                    "message_on_use": "",
                    "message_contents": []
                }
            }
        }
    )

@db_table(version=1)
class Inventory:
    id: int = Column(
        primary_key=True,
        on_delete="CASCADE",
        on_update="CASCADE",
    )
    item_type: int = Column(fk="item.id")
    owner_id: int = Column(fk="wallet.id")
    created_at: datetime = Column(auto_now_add=True)
    owned_at: datetime = Column(auto_now=True)
    data: dict = Column( # Тут хранятся доп данные о предмете
        default={}
    )

@db_table(version=1) # Таблица организаций
class Org:
    id: int = Column(
        primary_key=True,
        on_delete="CASCADE",
        on_update="CASCADE",
    )
    wallet_id: int = Column(fk="wallet.id")
    long_name: str = Column(default="Unknown Organization")
    short_name: str = Column(default="Unknown Org")
    founder_id: int = Column(fk="user.id")
    type: str = Column(default="Unknown")
    description: str = Column(default="Unknown Organization")
    created_at: datetime = Column(auto_now_add=True)
    creator_id: int = Column(fk="user.id")

@db_table(version=1)
class Org_Members:
    membership_id: int = Column(primary_key=True)
    org_id: int = Column(fk="org.id")
    user_id: int = Column(fk="user.id")
    roles: dict = Column(default={})

@db_table(version=1)
class Transaction:
    id: int = Column(
        primary_key=True,
        on_delete="CASCADE",
        on_update="CASCADE",
    )
    transaction_group_id: int = Column(index=True)
    wallet_id: int = Column(fk="wallet.id")
    type: str = Column(default="gift")
    description: str = Column()
    amount: float = Column(default=0.0)
    gold_amount: float = Column(default=0.0)
    timestamp: datetime = Column(auto_now_add=True)

@db_table(version=1)
class Transaction_Items:
    item_record_id: int = Column(primary_key=True)
    transaction_id: int = Column(fk="transaction.id")
    item_id: int = Column(fk="item.id")

@db_table(version=1)
class Task: # Фриланс таблица задач. Здесь люди создают и выполняют задачи друг друга
    id: str = Column(
        primary_key=True,
        on_delete="CASCADE",
        on_update="CASCADE",
    )
    name: str = Column(default="Unknown Task")
    creator_id: int = Column(fk="wallet.id")
    server_id: int = Column(fk="server.id")
    description: str = Column(default="Unknown Task")
    tags: list = Column(default=[])
    status: str = Column(default="pending")
    created_at: datetime = Column(auto_now_add=True)
    updated_at: datetime = Column(auto_now=True)
    closed_at: datetime = Column(default=None)
    price: float = Column(default=0.0)
    budget: float = Column(default=0.0)

@db_table(version=1)
class Task_Payments:
    task_id: str = Column(fk="task.id")
    payment_id: int = Column(fk="transaction.id", primary_key=True)
    type: str = Column(default="worker_reward")

@db_table(version=1)
class Task_Workers:
    work_id: int = Column(primary_key=True)
    task_id: str = Column(fk="task.id")
    worker_id: int = Column(fk="wallet.id")
    started_at: datetime = Column(auto_now_add=True)

@db_table(version=1)
class Deal:
    id: str = Column(
        primary_key=True,
        on_delete="CASCADE",
        on_update="CASCADE",
    )
    side_a_id: int = Column(fk="wallet.id")
    side_b_id: int = Column(fk="wallet.id")
    side_a_amount: float = Column(default=0.0)
    side_b_amount: float = Column(default=0.0)
    side_a_gold_amount: float = Column(default=0.0)
    side_b_gold_amount: float = Column(default=0.0)
    created_at: datetime = Column(auto_now_add=True)
    updated_at: datetime = Column(auto_now=True)
    closed_at: datetime = Column(default=None)

@db_table(version=1)
class Deal_Items:
    item_record_id: int = Column(primary_key=True)
    deal_id: str = Column(fk="deal.id")
    side: str = Column(default="side_a")
    item_id: int = Column(fk="item.id")

@db_table(version=1)
class Deal_Events:
    event_id: int = Column(primary_key=True)
    deal_id: str = Column(fk="deal.id")
    side: str = Column()
    event_type: str = Column()
    payload: str = Column()