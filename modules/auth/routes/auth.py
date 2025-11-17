from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from typing import Dict, Any

from commons.schemas.user import UserRegister, User
from commons.dependencies.auth_dependencies import get_current_user
from modules.auth.services.auth_service import register_service, login_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=User)
async def register_user(user: UserRegister) -> User:
    user_dict = await register_service(user)
    return User(**user_dict)


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> Dict[str, Any]:
    return await login_service(form_data)


@router.get("/user", response_model=User)
async def get_user(_user: User = Depends(get_current_user)) -> User:
    return _user
