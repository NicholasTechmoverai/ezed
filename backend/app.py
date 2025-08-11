from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from fastapi import FastAPI, Request
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from tortoise import Tortoise  # Needed for shutdown
import socketio
from fastapi.staticfiles import StaticFiles
from web_socket.main import (
    UsersNamespace,
    NotificationsNamespace,
)

import sys
import platform
import asyncio

if platform.system() == "Windows":
    # Use the Selector event loop on Windows so subprocess support works
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    
from config import init_db  # Your DB init logic
from routes.auth import auth_router
from routes.instagram import instagram_router
from routes.facebook import facebook_router
from routes.tiktok import tiktok_router
from routes.youtube import youtube_router
from routes.x import x_router
from utils.limiter import limiter
from utils.user import AuthService


import os
from config import Config, WEB_SERVER, BASE_SERVER

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:8080",
    "https://e-zed.netlify.app",
    f"{WEB_SERVER}",
]


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins=ALLOWED_ORIGINS,
)


# sio.register_namespace(MainNamespace("/main"))
# sio.register_namespace(RecipesNamespace("/recipes", RecipeService()))
sio.register_namespace(UsersNamespace("/users", AuthService()))
notifications_namespace = NotificationsNamespace("/notifications", AuthService())
sio.register_namespace(notifications_namespace)

zed_app = socketio.ASGIApp(
    sio,
    other_asgi_app=app,
    socketio_path="/ws/socket.io",  # Match frontend path
)


app.state.limiter = limiter  # for integration


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429, content={"detail": "Rate limit exceeded. Please wait."}
    )

app.include_router(instagram_router, prefix="/api/inst")
app.include_router(facebook_router, prefix="/api/fb")
app.include_router(tiktok_router, prefix="/api/tk")
app.include_router(youtube_router, prefix="/api/yt")
app.include_router(x_router, prefix="/api/x")
app.include_router(auth_router, prefix="/api/auth")


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VUE_DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "dist"))
BASE_DIRECTORY = "uploads"
app.mount("/static", StaticFiles(directory=BASE_DIRECTORY), name="uploads")
# app.mount("/static", StaticFiles(directory=VUE_DIST_DIR), name="static")
# @app.get("/", include_in_schema=False)
# async def serve_root():
#     return FileResponse(os.path.join(VUE_DIST_DIR, "index.html"))


# @app.get("/{full_path:path}", include_in_schema=False)
# async def serve_vue(full_path: str):
#     # Let FastAPI serve actual static files (favicon, manifest, etc.)
#     file_path = os.path.join(VUE_DIST_DIR, full_path)
#     if os.path.exists(file_path) and os.path.isfile(file_path):
#         return FileResponse(file_path)

#     # Fallback to index.html for SPA routing
#     return FileResponse(os.path.join(VUE_DIST_DIR, "index.html"))



@app.on_event("startup")
async def startup():
    print("🚀 Connecting to database...")
    await init_db(app)
    print("✅ DATABASE CONNECTED")


@app.on_event("shutdown")
async def shutdown():
    print("🛑 Closing DB connections...")
    await Tortoise.close_connections()


# uvicorn app:zed_app --reload
# cloudflared tunnel --url http://localhost:8000
