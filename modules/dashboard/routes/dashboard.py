from fastapi import APIRouter, Depends, HTTPException, status as httpstatus
from commons.schemas.user import User, UserRole
from commons.dependencies.auth_dependencies import get_current_user
from modules.dashboard.services.dashboard_service import get_admin_dashboard_data_service


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/")
async def get_admin_dashboard(_user: User = Depends(get_current_user)):
    if _user.role != UserRole.ADMIN:
        raise HTTPException(status_code=httpstatus.HTTP_403_FORBIDDEN, detail="Admins only")
    return await get_admin_dashboard_data_service()