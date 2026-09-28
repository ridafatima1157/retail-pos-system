from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User


def create_admin():
    db: Session = SessionLocal()

    try:
        email = "admin@retailpos.com"
        password = "Admin@123"

        # Check if admin already exists
        existing_user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if existing_user:
            print("Admin already exists.")
            print("Email:", existing_user.email)
            print("Role:", existing_user.role)
            return

        # Create admin with hashed password
        admin = User(
            name="System Admin",
            email=email,
            password_hash=hash_password(password),
            role="ADMIN",
            is_active=True,
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("Admin created successfully!")
        print("ID:", admin.id)
        print("Email:", admin.email)
        print("Password:", password)
        print("Role:", admin.role)

    except Exception as e:
        db.rollback()
        print("Error:", e)

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()