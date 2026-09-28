from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_password_hash
from app.dependencies.auth import get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


class CreateUserRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str


def require_admin(user: User):
    if str(user.role).upper() != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )


@router.get("")
def get_users(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_admin(user)

    users = (
        db.query(User)
        .order_by(User.created_at.desc())
        .all()
    )

    return [
        {
            "id": item.id,
            "name": item.name,
            "email": item.email,
            "role": item.role,
            "is_active": item.is_active,
            "created_at": item.created_at.isoformat(),
        }
        for item in users
    ]


@router.post("")
def create_user(
    data: CreateUserRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    require_admin(user)

    name = data.name.strip()
    email = data.email.strip().lower()
    role = data.role.strip().upper()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Name is required",
        )

    if len(data.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters",
        )

    if role not in ["ADMIN", "CASHIER"]:
        raise HTTPException(
            status_code=400,
            detail="Role must be ADMIN or CASHIER",
        )

    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists",
        )

    new_user = User(
        name=name,
        email=email,
        password_hash=get_password_hash(
            data.password
        ),
        role=role,
        is_active=True,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User created successfully",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "is_active": new_user.is_active,
            "created_at": new_user.created_at.isoformat(),
        },
    }