from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User


router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"],
)


@router.get("/")
def get_audit_logs(
    search: str | None = None,
    action: str | None = None,
    skip: int = 0,
    limit: int = Query(
        50,
        ge=1,
        le=200,
    ),
    db: Session = Depends(get_db),
):
    query = (
        db.query(AuditLog)
        .options(
            joinedload(AuditLog.user)
        )
        .order_by(
            AuditLog.created_at.desc()
        )
    )

    # Search
    if search:
        search_value = f"%{search}%"

        query = (
            query
            .join(AuditLog.user)
            .filter(
                or_(
                    AuditLog.action.ilike(
                        search_value
                    ),
                    AuditLog.invoice_number.ilike(
                        search_value
                    ),
                    AuditLog.reason.ilike(
                        search_value
                    ),
                    User.name.ilike(
                        search_value
                    ),
                    User.email.ilike(
                        search_value
                    ),
                )
            )
        )

    # Activity filter
    if action and action.lower() != "all":
        query = query.filter(
            AuditLog.action == action
        )

    total = query.count()

    logs = (
        query
        .offset(skip)
        .limit(limit)
        .all()
    )

    result = []

    for log in logs:
        result.append(
            {
                "id": log.id,
                "user_id": log.user_id,
                "user_name": (
                    log.user.name
                    if log.user
                    else "Unknown"
                ),
                "user_role": (
                    log.user.role
                    if log.user
                    else "Unknown"
                ),
                "action": log.action,
                "invoice_number": (
                    log.invoice_number
                ),
                "reason": log.reason,
                "created_at": log.created_at,
            }
        )

    return {
        "total": total,
        "logs": result,
    }


@router.get("/summary")
def get_audit_summary(
    db: Session = Depends(get_db),
):
    total = (
        db.query(
            func.count(AuditLog.id)
        ).scalar()
        or 0
    )

    stock = (
        db.query(
            func.count(AuditLog.id)
        )
        .filter(
            AuditLog.action
            == "Stock Adjustment"
        )
        .scalar()
        or 0
    )

    voided = (
        db.query(
            func.count(AuditLog.id)
        )
        .filter(
            AuditLog.action
            == "Sale Voided"
        )
        .scalar()
        or 0
    )

    return {
        "total_activities": total,
        "stock_activities": stock,
        "voided_transactions": voided,
    }