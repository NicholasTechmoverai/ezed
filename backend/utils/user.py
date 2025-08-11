import random
from datetime import datetime, timedelta
from typing import Optional, Dict
from tortoise.expressions import Q
import os
import re
from pathlib import Path
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, ExpiredSignatureError, jwt
from passlib.context import CryptContext
from typing import List, Dict
from utils.auth import generate_token
from models import (
    User as Users,

)

from uuid import UUID
from datetime import timezone

datetime.now(timezone.utc)
unallowed_usernames = [
    "saved",
    "chefs",
    "terms",
    "videos",
    "live",
    "notifications",
    "recipes",
    "cooking-tips",
    "report",
    "faqs",
    "about",
    "contact",
    "reservations",
]
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

defaultAvatar = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"


class AuthError(Exception):
    """Custom exception for authentication-related issues."""

    def __init__(self, message="Authentication failed"):
        self.message = message
        super().__init__(self.message)


class AuthService:
    def __init__(self, user_repo=Users):
        self.user_repo = user_repo

    async def renew_token(self, user_id) -> dict:
        user = await self.user_repo.get_or_none(id=user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return await generate_token(user)

    async def login(self, email: str, password: str) -> dict:
        user = await self.user_repo.get_or_none(email=email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if not await self.verify_password(password, user.password):
            raise HTTPException(status_code=401, detail="Incorrect password")

        return await generate_token(user)
    
    async def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

