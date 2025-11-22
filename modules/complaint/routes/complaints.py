from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.responses import FileResponse
import os
from typing import List, Dict, Any, Optional

from commons.schemas.user import User, UserRole
from commons.dependencies.auth_dependencies import get_current_user
from modules.complaint.serializers.complaints import Complaint, ListComplaintsParams, ComplaintStatus, ComplaintAction
from modules.complaint.services.complaint_service import create_complaint_service, list_complaints_service, get_complaint_service, edit_complaint_service

router = APIRouter(prefix="/complaints", tags=["Complaints"])


@router.post("/")
async def create_complaint(
    title: str = Form(...),
    description: str = Form(...),
    status: ComplaintStatus = Form(ComplaintStatus.OPEN),
    images: Optional[List[UploadFile]] = File(None),
    _user: User = Depends(get_current_user)
) -> Dict[str, Any]:

    if _user.role == UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins cannot create complaints")
    
    if images:
        images = [image for image in images if image and not isinstance(image, str)]

    return await create_complaint_service(_user.id, title, description, status, images)


@router.get("/filters")
async def get_complaint_filters(
    _user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    pass


@router.get("/")
async def list_complaints(
    query: ListComplaintsParams = Depends(),
    _user: User = Depends(get_current_user)
) -> Dict[str, Any]:

    user_id = None
    if _user.role == UserRole.CITIZEN:
        user_id = _user.id

    return await list_complaints_service(
        page=query.page,
        limit=query.limit,
        status=query.status,
        user_id=user_id,
        sort_by=query.sort_by
    )

@router.get("/{complaint_id}")
async def get_complaint(
    complaint_id: str,
    _user: User = Depends(get_current_user)
) -> Complaint:
    
    complaint = await get_complaint_service(complaint_id)

    if _user.role == UserRole.CITIZEN and complaint.user_id != _user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this complaint"
        )
    
    return complaint


@router.get("/images/{filename}")
async def get_complaint_image(
        filename: str,
        _user: User = Depends(get_current_user)
) -> FileResponse:
    image_path = f"uploads/complaints/{filename}"

    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image not found")

    return FileResponse(image_path)


@router.put("/{complaint_id}")
async def update_complaint(
    complaint_id: str,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    action: Optional[ComplaintAction] = Form(None),
    remove_images: Optional[List[str]] = Form(None),
    images: Optional[List[UploadFile]] = File(None),
    _user: User = Depends(get_current_user)
):
    if isinstance(remove_images, str):
        remove_images = [remove_images]

    if images:
        images = [img for img in images if img and not isinstance(img, str)]

    updated = await edit_complaint_service(
        complaint_id=complaint_id,
        user_id=_user.id,
        user_role=_user.role,
        title=title,
        description=description,
        action=action,
        remove_images=remove_images,
        new_images=images,
    )

    return {"message": "Complaint updated successfully", "data": updated}