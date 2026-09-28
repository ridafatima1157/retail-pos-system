
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.category import Category
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
)


router = APIRouter(
    prefix="/api/categories",
    tags=["Categories"]
)


@router.get(
    "",
    response_model=list[CategoryResponse]
)
def get_categories(
    db: Session = Depends(get_db)
):
    return (
        db.query(Category)
        .order_by(Category.name.asc())
        .all()
    )


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=201
)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db)
):
    name = category_data.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Category name is required"
        )

    existing = (
        db.query(Category)
        .filter(Category.name.ilike(name))
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Category already exists"
        )

    category = Category(
        name=name
    )

    db.add(category)
    db.commit()
    db.refresh(category)

    return category