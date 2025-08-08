from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi.util import get_remote_address
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from typing import List
import asyncio
from fastapi import Query
from fastapi.responses import StreamingResponse
import mimetypes, os

from utils.limiter import limiter

from tortoise.expressions import Q
from uuid import UUID
from models import User as Users
from typing import Optional
from utils.logger import setup_logger
from utils.auth import get_current_user
from common.index import StreamDownloader, StreamMeta

logger = setup_logger("TIKTOK ROUTES")
youtube_router = APIRouter()

downloader = StreamDownloader()


class DownloadRequest(BaseModel):
    url: str
    id: UUID
    itag: Optional[str] = "best"
    type: Optional[str] = "reel"
    start_byte: Optional[int] = 0
    ext: Optional[str] = None
    format: Optional[str] = None


@youtube_router.post("/{username}/download")
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
            "Content-Disposition": f'attachment; filename="{data.id}.{file_ext}"',
            "Accept-Ranges": "bytes",
            "X-Download-URL": str(data.id),
            "Content-Type": content_type,
            "format": file_ext,
        }

        async def generate():
            async for chunk in downloader.download_stream(
                url=data.url, itag=data.itag, start_byte=data.start_byte
            ):
                yield chunk

        return StreamingResponse(generate(), media_type="video/mp4", headers=headers)

    except Exception as e:
        logger.exception(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


class ListRequest(BaseModel):
    listUrl: str = None


@youtube_router.post("/{username}/list")
@limiter.limit("50/day")
async def get_youtube_songs(request: Request, data: ListRequest):
    if not data.listUrl:
        raise HTTPException(status_code=400, detail="Playlist URL is required")

    try:
        # # Validate URL format
        # if "youtube.com/playlist?" not in data.playlistUrl and "youtube.com/watch?list=" not in data.playlistUrl:
        #     raise HTTPException(status_code=400, detail="Invalid YouTube playlist URL format")

        async with StreamMeta() as stream_meta:
            # Example 1: Get playlist songs
            playlist_name, songs = await stream_meta.get_playlist_songs(data.listUrl)

        if not songs:
            raise HTTPException(
                status_code=404,
                detail="No songs found in playlist (might be private, empty, or unviewable)",
            )

        return {
            "status": "success",
            "count": len(songs),
            "songs": songs,
            "playlist_name": playlist_name,
            "playlist_url": data.listUrl,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to process playlist: {str(e)}"
        )


class DownloadMetatRequest(BaseModel):
    url: str
    itag: Optional[str]=None


@youtube_router.post("/download-meta")
@limiter.limit("5/min")
async def get_download_meta(request: Request, data: DownloadMetatRequest):
    if not data.url:
        raise HTTPException(status_code=400, detail="URL is required")

    try:
        async with StreamMeta() as stream_meta:
            r = await stream_meta.get_download_info(data.url, data.itag)

        return r

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to process download meta: {str(e)}"
        )
