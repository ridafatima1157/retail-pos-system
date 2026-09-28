from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from sqlalchemy.orm import Session

from app.core.database import get_db

from app.models.item import Item
from app.models.category import Category
from app.models.stock_movement import StockMovement
from app.models.user import User

from app.schemas.inventory import (
    InventoryResponse,
    StockAdjustmentRequest,
)


router = APIRouter(
    prefix="/api/inventory",
    tags=["Inventory"]
)


# =========================================================
# GET INVENTORY
# =========================================================

@router.get(
    "",
    response_model=list[InventoryResponse]
)
def get_inventory(
    db: Session = Depends(get_db)
):

    items = (
        db.query(Item)
        .join(Category)
        .order_by(Item.id.desc())
        .all()
    )

    result = []

    for item in items:

        result.append({
            "id": item.id,
            "sku": item.sku,
            "barcode": item.barcode,
            "name": item.name,
            "category": item.category.name,
            "current_stock": item.current_stock,
            "reorder_level": item.reorder_level,
            "is_low_stock": (
                item.is_active
                and item.current_stock <= item.reorder_level
            ),
            "is_active": item.is_active,
        })

    return result


# =========================================================
# GET STOCK MOVEMENTS
# =========================================================

@router.get(
    "/movements"
)
def get_stock_movements(
    db: Session = Depends(get_db)
):

    movements = (
        db.query(
            StockMovement,
            Item.name.label("item_name"),
            User.name.label("user_name")
        )
        .join(
            Item,
            StockMovement.item_id == Item.id
        )
        .join(
            User,
            StockMovement.user_id == User.id
        )
        .order_by(
            StockMovement.created_at.desc()
        )
        .all()
    )

    result = []

    for movement, item_name, user_name in movements:

        result.append({
    "id": movement.id,
    "item_id": movement.item_id,
    "item_name": item_name,
    "user_name": user_name,
    "movement_type": movement.movement_type,
    "quantity": movement.quantity_change,
    "stock_before": movement.stock_before,
    "stock_after": movement.stock_after,
    "reason": movement.reason,
    "created_at": movement.created_at,
})

    return result


# =========================================================
# STOCK ADJUSTMENT
# =========================================================

@router.post(
    "/adjust"
)
def adjust_stock(
    data: StockAdjustmentRequest,
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # Find item
    # -----------------------------------------------------

    item = (
        db.query(Item)
        .filter(Item.id == data.item_id)
        .first()
    )

    if not item:

        raise HTTPException(
            status_code=404,
            detail="Item not found"
        )


    # -----------------------------------------------------
    # Validate quantity
    # -----------------------------------------------------

    if data.quantity == 0:

        raise HTTPException(
            status_code=400,
            detail="Quantity cannot be zero"
        )


    # -----------------------------------------------------
    # Prevent negative stock
    # -----------------------------------------------------

    stock_before = item.current_stock

    new_stock = stock_before + data.quantity

    if new_stock < 0:
        raise HTTPException(
        status_code=400,
        detail=(
            f"Insufficient stock. "
            f"Current stock is {stock_before}."
        )
    )

    if new_stock < 0:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient stock. "
                f"Current stock is {item.current_stock}."
            )
        )


    # -----------------------------------------------------
    # Validate movement type
    # -----------------------------------------------------

    allowed_types = {
        "OPENING",
        "ADJUSTMENT",
    }

    if data.movement_type not in allowed_types:

        raise HTTPException(
            status_code=400,
            detail="Invalid movement type"
        )


    # -----------------------------------------------------
    # Update stock
    # -----------------------------------------------------

    item.current_stock = new_stock


    # -----------------------------------------------------
    # TEMPORARY USER
    # -----------------------------------------------------
    # We will replace this with the actual
    # logged-in user's ID when RBAC is connected.

    user = (
        db.query(User)
        .order_by(User.id.asc())
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=400,
            detail="No user exists for stock adjustment"
        )


    # -----------------------------------------------------
    # Create movement
    # -----------------------------------------------------

    movement = StockMovement(
    item_id=item.id,
    user_id=user.id,
    movement_type=data.movement_type,
    quantity_change=data.quantity,
    stock_before=stock_before,
    stock_after=new_stock,
    reason=data.reason.strip(),
    created_by=user.id,
)
    db.add(movement)

    # -----------------------------------------------------
    # Save everything together
    # -----------------------------------------------------

    try:

        db.commit()

        db.refresh(item)
        db.refresh(movement)

    except Exception as e:

        db.rollback()

        print("INVENTORY ERROR:", e)

        raise HTTPException(
        status_code=500,
        detail=str(e)
        )