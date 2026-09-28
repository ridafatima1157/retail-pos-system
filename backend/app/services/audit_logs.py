from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def create_audit_log(
    db: Session,
    user_id: int,
    action: str,
    invoice_number: str | None = None,
    reason: str | None = None,
):
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        invoice_number=invoice_number,
        reason=reason,
    )

    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)

    return audit_log