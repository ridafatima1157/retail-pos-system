from datetime import datetime

from pydantic import BaseModel


class AuditLogCreate(BaseModel):
    action: str
    invoice_number: str | None = None
    reason: str | None = None


class AuditLogResponse(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_role: str
    action: str
    invoice_number: str | None
    reason: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    total: int
    logs: list[AuditLogResponse]