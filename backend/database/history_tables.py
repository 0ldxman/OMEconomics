import datetime

from backend.database.core import db_table, Column

@db_table(version=1)
class ServerSnapshots:
    snapshot_id: int = Column(primary_key=True, on_delete="CASCADE", on_update="CASCADE")
    server_id: int = Column(index=True)
    timestamp: datetime = Column(index=True, auto_now_add=True)

@db_table(version=1)
class ServerGDP:
    snapshot_id: int = Column(primary_key=True, fk="ServerSnapshots.snapshot_id")
    gdp_shop: float = Column()
    gdp_market: float = Column()
    gdp_jobs: float = Column()
    gdp_orgs: float = Column()
    gdp_tax: float = Column()

@db_table(version=1)
class ServerUsers:
    snapshot_id: int = Column(primary_key=True, fk="ServerSnapshots.snapshot_id")
    users_active: int = Column()
    users_inactive: int = Column()

@db_table(version=1)
class UserSnapshot:
    pass

@db_table(version=1)
class GlobalSnapshot:
    pass