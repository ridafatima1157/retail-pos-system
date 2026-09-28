from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    item_id: Mapped[int] = mapped_column(
        ForeignKey("items.id"),
        nullable=False
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    movement_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    quantity_change: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    stock_before: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    stock_after: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    reason: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    created_by: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    item = relationship("Item")
    user = relationship("User")