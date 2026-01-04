"""
FastAPI backend for SSB Prep application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = FastAPI(
    title="SSB Prep API",
    description="Backend API for SSB Preparation application",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and register routes
from app.routes import attempts, images, ocr, my_attempts

app.include_router(attempts.router, prefix="/api/attempts", tags=["attempts"])
app.include_router(images.router, prefix="/api/images", tags=["images"])
app.include_router(ocr.router, prefix="/api/ocr", tags=["ocr"])
app.include_router(my_attempts.router, prefix="/api/my-attempts", tags=["my-attempts"])


@app.on_event("startup")
async def startup():
    """Initialize database connection on startup"""
    from app.db import get_prisma

    await get_prisma()


@app.on_event("shutdown")
async def shutdown():
    """Close database connection on shutdown"""
    from app.db import disconnect_prisma

    await disconnect_prisma()


@app.get("/")
async def root():
    return {"message": "SSB Prep API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
