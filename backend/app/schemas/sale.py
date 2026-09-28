from datetime import datetime

from pydantic import BaseModel, Field


class SaleItemCreate(BaseModel):
    item_id: int
    quantity: int = Field(gt=0)


class SalePaymentCreate(BaseModel):
    payment_method: str
    amount: float = Field(gt=0)


class SaleCreate(BaseModel):
    items: list[SaleItemCreate]
    discount: float = Field(default=0, ge=0)
    payments: list[SalePaymentCreate]
    idempotency_key: str = Field(
        min_length=1,
        max_length=100
    )


class SaleItemResponse(BaseModel):
    item_id: int
    name: str
    sku: str
    barcode: str
    quantity: int
    unit_price: float
    tax_rate: float
    tax: float
    line_total: float


class SalePaymentResponse(BaseModel):
    payment_method: str
    amount: float


class SaleResponse(BaseModel):
    id: int
    invoice_number: str
    created_at: datetime
    cashier_id: int
    cashier_name: str

    subtotal: float
    discount: float
    tax: float
    grand_total: float

    status: str

    items: list[SaleItemResponse]
    payments: list[SalePaymentResponse]

    change: float = 0

    class Config:
        from_attributes = True