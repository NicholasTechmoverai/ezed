

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi.util import get_remote_address
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from typing import List
import asyncio
from fastapi import Query
from fastapi.responses import StreamingResponse
import mimetypes,os

from utils.limiter import limiter

from tortoise.expressions import Q
from uuid import UUID
from models import User as Users
from typing import Optional
from utils.logger import setup_logger
from utils.auth import get_current_user
from common.index import download_stream

logger = setup_logger("INSTAGRAM ROUTES")
instagram_router = APIRouter()


class DownloadRequest(BaseModel):
    url: str 
    id: UUID
    itag: Optional[str] = 'best'
    type: Optional[str] = 'reel'
    start_byte: Optional[int] = 0
    ext: Optional[str] = None
    format: Optional[str] = None
   
@instagram_router.post("/{username}/download")
@limiter.limit("50/day")
async def download_instagram(
    request: Request,
    username: str,
    data: DownloadRequest,
    # user: Users = Depends(get_current_user),
):
    """
    Download Instagram media content.

    Parameters:
    - url: The media URL to download
    - id: Unique identifier for the download
    - itag: Quality format identifier
    - start_byte: Byte position to start download from (for resuming)
    - ext: File extension (optional)
    """
    try:
        if not data.url:
            raise HTTPException(status_code=400, detail="URL is required")

        # Set default extension if not provided
        file_ext = data.ext or "mp4"
        content_type = mimetypes.guess_type(f"file.{file_ext}")[0] or "video/mp4"

        headers = {
            'Content-Disposition': f'attachment; filename="{data.id}.{file_ext}"',
            'Accept-Ranges': 'bytes',
            'X-Download-URL': str(data.id),
            'Content-Type': content_type,
            'format': file_ext,
        }

        stream = download_stream(
            url=data.url, 
            itag=data.itag, 
            start_byte=data.start_byte
        )

        return StreamingResponse(
            stream,
            media_type=content_type,
            headers=headers
        )

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
         