from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from database import Database
from config import settings
from routes import auth, businesses, reviews, trips, promotions, bookings, notifications, favorites, profile
from pathlib import Path

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await Database.connect_db()
    yield
    # Shutdown
    await Database.close_db()

app = FastAPI(
    title="ExplorerHub API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
# Allow a developer override to enable all origins for quick debugging.
# Set environment variable BACKEND_ALLOW_ALL_CORS=1 to enable. Do NOT use in production.
allow_all = False
try:
    import os
    allow_all = os.environ.get('BACKEND_ALLOW_ALL_CORS', '0') in ('1', 'true', 'True')
except Exception:
    allow_all = False

origins = ['*'] if allow_all else settings.cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Log configured CORS origins on startup for diagnostics
@app.on_event('startup')
def log_cors_origins():
    import logging
    logging.getLogger('uvicorn.info').info(f"CORS origins configured: {origins}")

app.include_router(auth)
app.include_router(businesses)
app.include_router(reviews)
app.include_router(trips)
app.include_router(promotions)
app.include_router(bookings)
app.include_router(notifications)
app.include_router(favorites)
app.include_router(profile)

# Mount uploads directory
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def root():
    return {"message": "ExplorerHub API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
