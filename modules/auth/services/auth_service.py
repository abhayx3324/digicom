from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import Dict, Any

from commons.utils.db import db
from commons.utils.auth import hash_password, verify_password, create_access_token
from commons.schemas.user import UserRegister
from commons.serializers.collections import Collections

async def register_service(user: UserRegister) -> Dict[str, Any]:
    collection = db.get_collection(Collections.USER)
    if await collection.find_one({"email": user.email}):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed_pw = hash_password(user.password)
    user_dict = user.model_dump()
    user_dict["password"] = hashed_pw
    user_dict["dob"] = user.dob.isoformat()

    result = await collection.insert_one(user_dict)
    user_dict["_id"] = result.inserted_id
    user_dict.pop("password", None)

    return user_dict

async def login_service(form_data: OAuth2PasswordRequestForm) -> Dict[str, Any]:
    user_data = await db.get_collection(Collections.USER).find_one({"email": form_data.username})
    if not user_data or not verify_password(form_data.password, user_data["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token = create_access_token({"sub": str(user_data["_id"])})
    return {"access_token": access_token, "token_type": "bearer"}