from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.category import Category
from app.models.item import Item
from app.dependencies.auth import get_current_user

from app.models.user import User
from app.schemas.item import (
    ItemCreate,
    ItemResponse,
    ItemUpdate,
)


router = APIRouter(
    prefix="/api/items",
    tags=["Items"]
)


@router.get(
    "",
    response_model=list[ItemResponse]
)
def get_items(
    search: str | None = Query(default=None),
    category_id: int | None = Query(default=None),
    active_only: bool = Query(default=False),
    db: Session = Depends(get_db)
):
    query = db.query(Item)

    if search:
        search_value = f"%{search.strip()}%"

        query = query.filter(
            (Item.name.ilike(search_value))
            | (Item.sku.ilike(search_value))
            | (Item.barcode.ilike(search_value))
        )

    if category_id:
        query = query.filter(
            Item.category_id == category_id
        )

    if active_only:
        query = query.filter(
            Item.is_active.is_(True)
        )

    return (
        query
        .order_by(Item.id.desc())
        .all()
    )


@router.get(
    "/{item_id}",
    response_model=ItemResponse
)
def get_item(
    item_id: int,
    db: Session = Depends(get_db)
):
    item = (
        db.query(Item)
        .filter(Item.id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Item not found"
        )

    return item


@router.post(
    "",
    response_model=ItemResponse,
    status_code=201
)
def create_item(
    item_data: ItemCreate,
    db: Session = Depends(get_db)
):
    sku = item_data.sku.strip()

    existing_sku = (
        db.query(Item)
        .filter(Item.sku == sku)
        .first()
    )

    if existing_sku:
        raise HTTPException(
            status_code=400,
            detail="SKU already exists"
        )

    if item_data.barcode:
        barcode = item_data.barcode.strip()

        existing_barcode = (
            db.query(Item)
            .filter(Item.barcode == barcode)
            .first()
        )

        if existing_barcode:
            raise HTTPException(
                status_code=400,
                detail="Barcode already exists"
            )

    category = (
        db.query(Category)
        .filter(Category.id == item_data.category_id)
        .first()
    )

    if not category:
        raise HTTPException(
            status_code=400,
            detail="Category not found"
        )

    item = Item(
        sku=sku,
        barcode=(
            item_data.barcode.strip()
            if item_data.barcode
            else None
        ),
        name=item_data.name.strip(),
        category_id=item_data.category_id,
        cost_price=item_data.cost_price,
        selling_price=item_data.selling_price,
        tax_rate=item_data.tax_rate,
        current_stock=item_data.current_stock,
        reorder_level=item_data.reorder_level,
        is_active=True,
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


@router.put(
    "/{item_id}",
    response_model=ItemResponse
)
def update_item(
    item_id: int,
    item_data: ItemUpdate,
    db: Session = Depends(get_db)
):
    item = (
        db.query(Item)
        .filter(Item.id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Item not found"
        )

    update_data = item_data.model_dump(
        exclude_unset=True
    )

    if "sku" in update_data:
        sku = update_data["sku"].strip()

        existing = (
            db.query(Item)
            .filter(
                Item.sku == sku,
                Item.id != item_id
            )
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="SKU already exists"
            )

        update_data["sku"] = sku

    if "barcode" in update_data:
        barcode = update_data["barcode"]

        if barcode:
            barcode = barcode.strip()

            existing = (
                db.query(Item)
                .filter(
                    Item.barcode == barcode,
                    Item.id != item_id
                )
                .first()
            )

            if existing:
                raise HTTPException(
                    status_code=400,
                    detail="Barcode already exists"
                )

            update_data["barcode"] = barcode

    if "name" in update_data:
        update_data["name"] = update_data["name"].strip()

        if not update_data["name"]:
            raise HTTPException(
                status_code=400,
                detail="Item name is required"
            )

    if "category_id" in update_data:
        category = (
            db.query(Category)
            .filter(
                Category.id
                == update_data["category_id"]
            )
            .first()
        )

        if not category:
            raise HTTPException(
                status_code=400,
                detail="Category not found"
            )

    for key, value in update_data.items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)

    return item
@router.get("/barcode/{barcode}")
def get_item_by_barcode(
    barcode: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = (
        db.query(Item)
        .filter(
            Item.barcode == barcode,
            Item.is_active == True,
        )
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Item not found for this barcode",
        )

    return {
        "id": item.id,
        "sku": item.sku,
        "barcode": item.barcode,
        "name": item.name,
        "category_id": item.category_id,
        "cost_price": float(item.cost_price),
        "selling_price": float(item.selling_price),
        "tax_rate": float(item.tax_rate),
        "current_stock": item.current_stock,
        "reorder_level": item.reorder_level,
        "is_active": item.is_active,
    }

@router.patch(
    "/{item_id}/status",
    response_model=ItemResponse
)
def change_item_status(
    item_id: int,
    is_active: bool,
    db: Session = Depends(get_db)
):
    item = (
        db.query(Item)
        .filter(Item.id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Item not found"
        )

    item.is_active = is_active

    db.commit()
    db.refresh(item)

    return item