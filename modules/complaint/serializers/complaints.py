from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

from commons.schemas.user import UserRole


class ComplaintSort(str, Enum):
    CREATED_AT_ASC = "createdAt"
    CREATED_AT_DESC = "-createdAt"
    UPDATED_AT_ASC = "updatedAt"
    UPDATED_AT_DESC = "-updatedAt"
    TITLE_ASC = "title"
    TITLE_DESC = "-title"


class ComplaintStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"
    CLOSED = "CLOSED"


class ComplaintAction(str, Enum):
    START = "START"
    REJECT = "REJECT"
    RESOLVE = "RESOLVE"
    CLOSE = "CLOSE"
    REOPEN = "REOPEN"


ACTION_TRANSITIONS = {
    ComplaintAction.START: [
        { "from": ComplaintStatus.OPEN,         "to": ComplaintStatus.IN_PROGRESS,  "role": UserRole.ADMIN },
    ],

    ComplaintAction.REJECT: [
        { "from": ComplaintStatus.OPEN,         "to": ComplaintStatus.REJECTED,     "role": UserRole.ADMIN },
        { "from": ComplaintStatus.IN_PROGRESS,  "to": ComplaintStatus.REJECTED,     "role": UserRole.ADMIN }
    ],

    ComplaintAction.RESOLVE: [
        { "from": ComplaintStatus.IN_PROGRESS,  "to": ComplaintStatus.RESOLVED,     "role": UserRole.ADMIN }
    ],

    ComplaintAction.CLOSE: [
        { "from": ComplaintStatus.OPEN,         "to": ComplaintStatus.CLOSED,       "role": UserRole.CITIZEN },
        { "from": ComplaintStatus.IN_PROGRESS,  "to": ComplaintStatus.CLOSED,       "role": UserRole.CITIZEN },
        { "from": ComplaintStatus.RESOLVED,     "to": ComplaintStatus.CLOSED,       "role": UserRole.CITIZEN },
        { "from": ComplaintStatus.REJECTED,     "to": ComplaintStatus.CLOSED,       "role": UserRole.CITIZEN },
    ],

    ComplaintAction.REOPEN: [
        { "from": ComplaintStatus.RESOLVED,     "to": ComplaintStatus.OPEN,         "role": "ANY" },
        { "from": ComplaintStatus.REJECTED,     "to": ComplaintStatus.OPEN,         "role": UserRole.CITIZEN }
    ]
}


class CreateComplaintPayload(BaseModel):
    title: str = Field(...)
    description: str = Field(...)
    status: ComplaintStatus = Field(...)
    createdAt: datetime = Field(..., default_factory=datetime.now)
    updatedAt: datetime = Field(..., default_factory=datetime.now)


class ListComplaintsParams(BaseModel):
    page: int = Field(1, ge=1)
    limit: int = Field(10, ge=1, le=100)
    status: Optional[ComplaintStatus] = Field(None)
    sort_by: Optional[ComplaintSort] = Field(ComplaintSort.UPDATED_AT_ASC)


class Complaint(BaseModel):
    id: str = Field(..., validation_alias="_id", serialization_alias="id")
    user_id: str = Field(...)
    title: str = Field(...)
    description: str = Field(...)
    status: ComplaintStatus = Field(...)
    images: List[str] = Field(default_factory=list)
    createdAt: datetime = Field(..., default_factory=datetime.now)
    updatedAt: datetime = Field(..., default_factory=datetime.now)
