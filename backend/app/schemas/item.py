from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ItemCreate(BaseModel):
    sku: str = Field(min_length=1)
    barcode: str | None = None
    name: str = Field(min_length=1)
    category_id: int

    cost_price: Decimal = Field(
        ge=0
    )

    selling_price: Decimal = Field(
        ge=0
    )

    tax_rate: Decimal = Field(
        default=0,
        ge=0
    )

    current_stock: int = Field(
        default=0,
        ge=0
    )

    reorder_level: int = Field(
        default=5,
        ge=0
    )


class ItemUpdate(BaseModel):
    sku: str | None = None
    barcode: str | None = None
    name: str | None = None
    category_id: int | None = None

    cost_price: Decimal | None = Field(
        default=None,
        ge=0
    )

    selling_price: Decimal | None = Field(
        default=None,
        ge=0
    )

    tax_rate: Decimal | None = Field(
        default=None,
        ge=0
    )

    current_stock: int | None = Field(
        default=None,
        ge=0
    )

    reorder_level: int | None = Field(
        default=None,
        ge=0
    )

    is_active: bool | None = None


class ItemResponse(BaseModel):
    id: int
    sku: str
    barcode: str | None
    name: str
    category_id: int

    cost_price: Decimal
    selling_price: Decimal
    tax_rate: Decimal

    current_stock: int
    reorder_level: int
    is_active: bool

    model_config = ConfigDict(
        from_attributes=True
    )