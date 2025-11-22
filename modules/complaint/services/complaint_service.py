from fastapi import HTTPException, status as httpstatus, File, UploadFile
from typing import Optional
from bson import ObjectId
from datetime import datetime, timezone
import uuid
import aiofiles
from typing import Dict, List, Any, Tuple
from pathlib import Path
from email.message import EmailMessage
from aiosmtplib import send

from config import settings
from commons.utils.file import delete_file
from commons.utils.db import db
from commons.schemas.user import User, UserRole
from commons.serializers.collections import Collections
from modules.complaint.serializers.complaints import Complaint, ComplaintAction, ComplaintStatus, ComplaintSort, ACTION_TRANSITIONS


async def create_complaint_service(
    user_id: str,
    title: str,
    description: str,
    status: ComplaintStatus = ComplaintStatus.OPEN,
    images: Optional[List[UploadFile]] = None,
) -> Dict[str, Any]:
    image_paths = []
    if images:
        image_paths = await save_complaint_images(user_id, images)
    
    complaint_dict = {}
    complaint_dict["user_id"] = user_id
    complaint_dict["title"] = title
    complaint_dict["description"] = description
    status_value = status.value if isinstance(status, ComplaintStatus) else status
    complaint_dict["status"] = status_value
    complaint_dict["images"] = image_paths
    complaint_dict["createdAt"] = datetime.now(timezone.utc)
    complaint_dict["updatedAt"] = datetime.now(timezone.utc)

    clean_copy = complaint_dict.copy()

    collection = db.get_collection(Collections.COMPLAINT)
    result = await collection.insert_one(complaint_dict)
    complaint_response = {
        **clean_copy,
        "id": str(result.inserted_id),
        "createdAt": complaint_dict["createdAt"].isoformat(),
        "updatedAt": complaint_dict["updatedAt"].isoformat(),
    }

    return {"message": "Complaint created successfully", "complaint": complaint_response}


async def save_complaint_images(
        user_id: str,
        images: Optional[List[UploadFile]] = None,
) -> List[str]:
    UPLOAD_DIR = Path("uploads/complaints")
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    
    image_paths = []
    
    for image in images:
        if not image.filename:
            continue

        file_extension = Path(image.filename).suffix.lower()
        if file_extension not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=httpstatus.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type: {image.filename}. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )
        
        contents = await image.read()
        
        if len(contents) > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=httpstatus.HTTP_400_BAD_REQUEST,
                detail=f"File {image.filename} exceeds maximum size of 5MB"
            )
        
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        unique_filename = f"{user_id}_{timestamp}_{uuid.uuid4().hex[:8]}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(contents)
        
        relative_path = f"uploads/complaints/{unique_filename}"
        image_paths.append(unique_filename)
        
        await image.seek(0)
    
    return image_paths


async def list_complaints_service(
    page: int = 1,
    limit: int = 10,
    status: Optional[ComplaintStatus] = None,
    user_id: Optional[str] = None,
    sort_by: ComplaintSort = ComplaintSort.UPDATED_AT_ASC
) -> Dict[str, Any]:
    
    collection = db.get_collection(Collections.COMPLAINT)
    
    query = {}
    if status:
        query["status"] = status.value if isinstance(status, ComplaintStatus) else status
    if user_id:
        query["user_id"] = user_id

    sort_value = (sort_by.value if isinstance(sort_by, ComplaintSort) else sort_by) or "updatedAt"
    sort_field = sort_value
    sort_direction = 1
    if sort_value.startswith("-"):
        sort_field = sort_value[1:]
        sort_direction = -1

    skip = (page - 1) * limit
    total_count = await collection.count_documents(query)
    
    cursor = (
        collection.find(query)
        .sort(sort_field, sort_direction)
        .skip(skip)
        .limit(limit)
    )
    complaints = await cursor.to_list(length=limit)
    
    for complaint in complaints:
        complaint["id"] = str(complaint.pop("_id"))
        if "createdAt" in complaint and isinstance(complaint["createdAt"], datetime):
            complaint["createdAt"] = complaint["createdAt"].isoformat()
        if "updatedAt" in complaint and isinstance(complaint["updatedAt"], datetime):
            complaint["updatedAt"] = complaint["updatedAt"].isoformat()
    
    total_pages = (total_count + limit - 1) // limit 
    has_next = page < total_pages
    has_prev = page > 1
    
    return {
        "complaints": complaints,
        "pagination": {
            "page": page,
            "limit": limit,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_next": has_next,
            "has_prev": has_prev
        }
    }


async def get_complaint_service(
        _user: User,
        complaint_id: str
) -> Tuple[Complaint, List]:
    if not ObjectId.is_valid(complaint_id):
        raise HTTPException(
            status_code=httpstatus.HTTP_400_BAD_REQUEST,
            detail="Invalid complaint ID format"
        )
    
    collection = db.get_collection(Collections.COMPLAINT)
    complaint = await collection.find_one({"_id": ObjectId(complaint_id)})
    
    current_status = ComplaintStatus(complaint.get("status", ""))

    allowed_actions = get_allowed_actions(
        current_status=current_status,
        user_role=_user.role
    )

    #complaint["status_options"] = allowed_actions
    
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    return Complaint(**complaint), allowed_actions


def validate_action(
    action: ComplaintAction,
    current_status: ComplaintStatus,
    user_role: UserRole,
) -> ComplaintStatus:

    if action not in ACTION_TRANSITIONS:
        raise HTTPException(400, f"Unknown action {action}")

    transitions = ACTION_TRANSITIONS[action]

    matching_transition = None

    # 1. Find transition for this action + current status
    for t in transitions:
        if t["from"] == current_status:
            matching_transition = t
            break

    # 2. No matching transition = invalid action for this status
    if not matching_transition:
        raise HTTPException(
            400, f"Invalid action {action} for status {current_status}"
        )

    # 3. Validate role
    allowed_role = matching_transition["role"]
    if allowed_role != "ANY" and allowed_role != user_role:
        raise HTTPException(
            403, f"User role {user_role} not allowed to perform {action}"
        )

    # 4. Success
    return matching_transition["to"]


async def edit_complaint_service(
    complaint_id: str,
    user_id: str,
    user_role: UserRole,
    title: Optional[str],
    description: Optional[str],
    action: Optional[ComplaintAction],
    remove_images: Optional[List[str]],
    new_images: Optional[List[UploadFile]] = None
) ->  Complaint:
    collection = db.get_collection(Collections.COMPLAINT)
    complaint = await collection.find_one({"_id": ObjectId(complaint_id)})
    if not complaint:
        raise HTTPException(404, "Complaint not found")

    complaint_obj = Complaint(**complaint)

    if user_role == UserRole.CITIZEN and complaint_obj.user_id != user_id:
        raise HTTPException(403, "You cannot modify others' complaints")

    update_data = {}
    updated_images = complaint_obj.images.copy()

    old_status = complaint_obj.status
    status_changed = False

    if remove_images:
        for img in remove_images:
            if img in updated_images:
                updated_images.remove(img)
                await delete_file(img)  # implement your file delete logic

    if new_images:
        saved_paths = await save_complaint_images(user_id, new_images)
        updated_images.extend(saved_paths)

    if title is not None:
        update_data["title"] = title

    if description is not None:
        update_data["description"] = description

    if action:
        new_status = validate_action(
            action=action,
            current_status=complaint_obj.status,
            user_role=user_role,
        )
        status_value = new_status.value if isinstance(new_status, ComplaintStatus) else new_status
        update_data["status"] = status_value

        if new_status != old_status:
            status_changed = True

    update_data["images"] = updated_images
    update_data["updatedAt"] = datetime.now(timezone.utc)

    collection = db.get_collection(Collections.COMPLAINT)
    await collection.update_one(
        {"_id": ObjectId(complaint_id)},
        {"$set": update_data}
    )

    if status_changed and user_role == UserRole.ADMIN:
        user_collection = db.get_collection(Collections.USER)
        citizen = await user_collection.find_one({"_id": ObjectId(complaint_obj.user_id)}, {"email": 1})
        if citizen:
            citizen_email = citizen["email"]
            await send_status_email(
                email=citizen_email,
                complaint_title=complaint_obj.title,
                complaint_id=complaint_id,
                old_status=old_status.value if isinstance(old_status, ComplaintStatus) else str(old_status),
                new_status=new_status.value if isinstance(new_status, ComplaintStatus) else str(new_status)
            )

    collection = db.get_collection(Collections.COMPLAINT)
    updated = await collection.find_one({"_id": ObjectId(complaint_id)})
    return Complaint(**updated)


def get_allowed_actions(current_status: ComplaintStatus, user_role: UserRole):
    allowed = []

    for action, rules in ACTION_TRANSITIONS.items():
        for rule in rules:
            if rule["from"] == current_status:

                role_allowed = (
                    rule["role"] == "ANY" or
                    rule["role"] == user_role
                )

                if role_allowed:
                    allowed.append(action)

    return allowed


async def send_status_email(email: str, complaint_title: str, complaint_id: str, old_status: str, new_status: str):

    subject = f"Complaint Status Updated: {complaint_title}"

    body = f"""
Hello,

Your complaint "{complaint_title}" (ID: {complaint_id}) has been updated.

Previous Status: {old_status}
New Status: {new_status}

You can check the latest status in your dashboard.

Regards,
Municipal Service Team
    """

    await send_email_async(
        to=email,
        subject=subject,
        body=body
    )

async def send_email_async(to: str, subject: str, body: str):
    msg = EmailMessage()
    msg["From"] = "digicom.services.ltd@gmail.com"
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)

    await send(
        message=msg,
        hostname="smtp.gmail.com",
        port=587,
        start_tls=True,
        username="digicom.services.ltd@gmail.com",
        password=settings.GOOGLE_APP_PASSWORD
    )