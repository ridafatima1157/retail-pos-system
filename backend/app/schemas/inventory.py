from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict


class StockAdjustmentRequest(BaseModel):
    item_id: int

    quantity: int

    reason: str = Field(
        min_length=1,
        max_length=255
    )

    movement_type: str = Field(
        default="ADJUSTMENT"
    )


class InventoryResponse(BaseModel):
    id: int
    sku: str
    barcode: str | None
    name: str
    category: str
    current_stock: int
    reorder_level: int
    is_low_stock: bool
    is_active: bool


class StockMovementResponse(BaseModel):
    id: int
    item_id: int
    item_name: str
    user_name: str
    movement_type: str
    quantity: int
    reason: str | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )