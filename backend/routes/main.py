from fastapi import APIRouter, Request, UploadFile, File, Form, HTTPException
from fastapi.responses import RedirectResponse, FileResponse
from typing import Optional, List
from uuid import uuid4
from pathlib import Path
import os
from datetime import datetime
from utils.logger import setup_logger
from config  import Config
import re
from urllib.parse import unquote
from typing import Optional, List

logger = setup_logger("SHARE")
share_router = APIRouter()

shares = {}


os.makedirs(Config.SHARE_SAVE_PATH, exist_ok=True)


async def save_file(file: UploadFile, file_id: str) -> dict:
    file_extension = Path(file.filename).suffix
    safe_filename = f"{file_id}{file_extension}"
    file_path = os.path.join(Config.SHARE_SAVE_PATH, safe_filename)
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    await file.seek(0)
    return {
        "filename": file.filename,
        "safe_filename": safe_filename,
        "content_type": file.content_type,
        "size": len(content),
        "file_path": file_path
    }




URL_RE = re.compile(r"(https?://[^\s'\"<>]+)|(www\.[^\s'\"<>]+)", re.IGNORECASE)
TEXT_EXTS = {".txt", ".json", ".md", ".csv", ".html", ".htm", ".js", ".css"}

def extract_first_url_from_string(s: Optional[str]) -> Optional[str]:
    if not s:
        return None
    try:
        s = unquote(s)  # decode percent-encoded text like %0A
    except Exception:
        pass
    m = URL_RE.search(s)
    if not m:
        return None
    url = m.group(0)
    if url.startswith("www."):
        url = "https://" + url
    return url

def looks_like_text_filename(filename: Optional[str]) -> bool:
    if not filename:
        return False
    lower = filename.lower()
    return any(lower.endswith(ext) for ext in TEXT_EXTS)

@share_router.post("/share")
async def share(
    request: Request,
    title: Optional[str] = Form(None),
    text: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
):
    file_info = []

    if url:
        url = url.strip()
    else:
        url = extract_first_url_from_string(text) or extract_first_url_from_string(title)

    # if not found in text/title, scan text-like uploaded files for a URL
    if not url and files:
        for f in files:
            try:
                # consider text content-types or text-like filename extensions
                ctype = (f.content_type or "").lower()
                if ctype.startswith("text") or looks_like_text_filename(f.filename):
                    # read a safe chunk (64KB) to search for URLs
                    chunk = await f.read(64 * 1024)
                    snippet = None
                    try:
                        snippet = chunk.decode("utf-8", errors="ignore")
                    except Exception:
                        snippet = None
                    if snippet:
                        found = extract_first_url_from_string(snippet)
                        if found:
                            url = found
                    # IMPORTANT: reset file pointer so save_file can read the whole file later
                    try:
                        await f.seek(0)
                    except Exception:
                        # If seek unsupported, continue (save_file may still work)
                        pass
                else:
                    # reset pointer even if we didn't read
                    try:
                        await f.seek(0)
                    except Exception:
                        pass
            except Exception as e:
                logger.debug("Error scanning uploaded file for URL: %s", e)
                try:
                    await f.seek(0)
                except Exception:
                    pass

    if files:
        for f in files:
            file_id = str(uuid4())
            info = await save_file(f, file_id)
            file_info.append(info)

    share_id = str(uuid4())
    shares[share_id] = {
        "id": share_id,
        "title": title,
        "text": text,
        "url": url,
        "files": file_info,
        "created_at": datetime.now().isoformat()
    }

    logger.info("Created share %s (url=%s) with %d files", share_id, url, len(file_info))
    return RedirectResponse(url=f"/share/{share_id}", status_code=303)


@share_router.get("/share/{share_id}")
async def share_item(share_id: str):
    item = shares.get(share_id)
    if not item:
        logger.warning("Share ID not found: %s", share_id)
        raise HTTPException(status_code=404, detail="Share not found")

    logger.info("Serving share ID: %s", share_id)
    return {"status": "success", "id": share_id, "data": item}


@share_router.get("/download/{share_id}/{filename}")
async def download_file(share_id: str, filename: str):
    if share_id not in shares:
        raise HTTPException(status_code=404, detail="Share not found")
    
    # Safely find the file
    file_info = next(
        (
            f for f in shares[share_id]["files"]
            if f.get("safe_filename", f.get("filename")) == filename or f.get("filename") == filename
        ),
        None
    )

    if not file_info:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_path = file_info.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        path=file_path,
        media_type=file_info.get("content_type", "application/octet-stream"),
        filename=file_info.get("filename", filename)
    )



@share_router.delete("/share/{share_id}/file/{safe_filename}")
async def delete_share_file(share_id: str, safe_filename: str):
    if not share_id:
        raise HTTPException(status_code=400, detail="Share id required")

    item = shares.get(share_id)
    if not item:
        raise HTTPException(status_code=404, detail="Share not found")

    files = item.get("files", []) or []

    file_info = next(
        (f for f in files if f.get("safe_filename") == safe_filename or f.get("filename") == safe_filename),
        None,
    )

    if not file_info:
        raise HTTPException(status_code=404, detail="File not found in share")

    try:
        file_path = Path(file_info.get("file_path", "")).resolve()
        base_dir = Path(Config.SHARE_SAVE_PATH).resolve()
    except Exception as e:
        logger.error("Invalid file path for %s: %s", safe_filename, e)
        raise HTTPException(status_code=400, detail="Invalid file path")

    if not str(file_path).startswith(str(base_dir)):
        logger.error("Attempt to delete outside of share dir: %s", file_path)
        raise HTTPException(status_code=400, detail="Invalid file path")

    try:
        if file_path.exists():
            file_path.unlink()
            logger.info("Deleted file from disk: %s", file_path)
    except Exception as e:
        logger.error("Error deleting file %s from disk: %s", file_path, e)
        raise HTTPException(status_code=500, detail="Failed to delete file from disk")

    # Remove file record from the share's files list
    item["files"] = [f for f in files if not (f.get("safe_filename") == safe_filename or f.get("filename") == safe_filename)]

    # Optional: if you want to delete the entire share when no files remain, uncomment:
    # if not item["files"]:
    #     del shares[share_id]
    #     return {"status": "success", "message": "File deleted; share removed (no files left)"}

    # Return updated share metadata
    return {"status": "success", "message": "File deleted", "share": item}
