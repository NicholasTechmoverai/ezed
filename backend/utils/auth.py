import random
from datetime import datetime, timedelta
import os
import re
from pathlib import Path
from config import Config, WEB_SERVER, BASE_SERVER
import secrets
from .logger import setup_logger
import hashlib

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, ExpiredSignatureError, jwt

from models import User as Users

# OAuth2 scheme to extract Bearer token from Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

logger = setup_logger("AUTH")


# Dependency: Extracts user from token
async def get_current_user(token: str = Depends(oauth2_scheme)) ->dict:
    try:
        # print("Token::",token)
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=[Config.ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=401, detail="Invalid token: missing subject"
            )
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token is invalid")

    user = await Users.get_or_none(id=user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # if not user.is_verified:
    #     raise HTTPException(status_code=401, detail="User unverified!!")

    return {"user": user, "token":await make_room_id(token)}

async def generate_token( user) -> dict:
    # if not user.is_verified:
    #     raise HTTPException(status_code=401, detail="User unverified!!")

    expire = datetime.utcnow() + timedelta(
        minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": str(user.id), "email": user.email, "exp": expire}

    token = jwt.encode(payload, Config.SECRET_KEY, algorithm=Config.ALGORITHM)

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": Config.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": str(user.id),
            "username": user.username or user.name,
            "isVerified": user.is_verified,
            "theme": user.theme,
            "profilePic": user.picture_url
            if user.picture_url.startswith("https://")
            else f"{BASE_SERVER}/{user.picture_url}",
        },
    }

def generate_secure_code(self, NO=6) -> str:
    return "".join(secrets.choice("0123456789") for _ in range(NO))


async def make_room_id(token: str) -> str:
    """
    Generate a short room ID from a token.
    Change the logic inside to swap between slicing, hashing, etc.
    """
    return hashlib.sha256(token.encode()).hexdigest()[:16]

