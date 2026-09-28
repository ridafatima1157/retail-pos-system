from datetime import datetime, timezone, timedelta

PAKISTAN_TZ = timezone(timedelta(hours=5))

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    invoice_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    cashier_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    subtotal: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    discount: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    tax: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    grand_total: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="COMPLETED",
    )

    idempotency_key: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
    DateTime,
    default=lambda: datetime.now(PAKISTAN_TZ).replace(tzinfo=None),
    nullable=False
)

    voided_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    cashier = relationship("User")

    items = relationship(
        "SaleItem",
        back_populates="sale",
        cascade="all, delete-orphan",
    )

    payments = relationship(
        "SalePayment",
        back_populates="sale",
        cascade="all, delete-orphan",
    )