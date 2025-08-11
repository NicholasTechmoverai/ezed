from fastapi import APIRouter, Depends, HTTPException, Request, Body
from pydantic import BaseModel, UUID4
from typing import Optional

from utils.auth import get_current_user
from utils.user import AuthService, AuthError
from utils.limiter import limiter

auth_router = APIRouter()

class AuthRequest(BaseModel):
    id: Optional[UUID4]  # use UUID4 for standard UUID format

@auth_router.post("/refresh")
@limiter.limit("5/minute")
async def new_token(
    request: Request,
    data: AuthRequest = Body(...),
    auth: AuthService = Depends(),
):
    try:
        return await auth.renew_token(data.id)
    except AuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
