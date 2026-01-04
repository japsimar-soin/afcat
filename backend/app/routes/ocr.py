"""
OCR API routes
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
import os
from pathlib import Path
from app.models.schemas import OCRSchema
from app.middleware.auth import get_clerk_user_id
from app.db import get_prisma
from prisma import Prisma

router = APIRouter()

# Initialize Google Cloud Vision client if configured
vision_client = None
if all(
    [
        os.getenv("GCP_PROJECT_ID"),
        os.getenv("VISION_CLIENT_EMAIL"),
        os.getenv("VISION_PRIVATE_KEY"),
    ]
):
    try:
        from google.cloud import vision
        import json

        credentials_info = {
            "type": "service_account",
            "project_id": os.getenv("GCP_PROJECT_ID"),
            "private_key_id": "",
            "private_key": os.getenv("VISION_PRIVATE_KEY").replace("\\n", "\n"),
            "client_email": os.getenv("VISION_CLIENT_EMAIL"),
            "client_id": "",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }

        vision_client = vision.ImageAnnotatorClient.from_service_account_info(
            credentials_info
        )
    except Exception as e:
        print(f"Failed to initialize Google Cloud Vision client: {e}")


@router.post("")
async def perform_ocr(
    data: OCRSchema,
    user_id: str = Depends(get_clerk_user_id),
    prisma: Prisma = Depends(get_prisma),
) -> Dict[str, Any]:
    """Perform OCR on an image"""
    try:
        # Get image from database
        image = await prisma.image.find_unique(where={"id": data.image_id})

        if not image:
            raise HTTPException(status_code=404, detail="Image not found")

        # Construct image path
        image_path = Path(os.getcwd()) / "public" / "uploads" / image.storage_key
        if not image_path.exists():
            # Try alternative path
            image_path = Path(os.getcwd()) / "public" / image.storage_key
            if not image_path.exists():
                raise HTTPException(status_code=404, detail="Image file not found")

        extracted_text = ""

        if vision_client:
            try:
                from PIL import Image
                from io import BytesIO

                # Read and process image
                with open(image_path, "rb") as f:
                    image_content = f.read()

                # Preprocess image
                img = Image.open(BytesIO(image_content))
                if img.mode != "RGB":
                    img = img.convert("RGB")

                # Convert to grayscale and resize
                img = img.convert("L")  # Grayscale
                img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)

                # Save processed image to buffer
                processed_buffer = BytesIO()
                img.save(processed_buffer, format="PNG")
                processed_buffer.seek(0)

                # Perform OCR
                response = vision_client.document_text_detection(
                    image=vision.Image(content=processed_buffer.read())
                )

                texts = response.text_annotations
                if texts:
                    extracted_text = texts[0].description

            except Exception as e:
                print(f"Google Cloud Vision OCR failed: {e}")
                extracted_text = (
                    "OCR processing failed. Please type your response manually."
                )
        else:
            extracted_text = "OCR not configured. Please type your response manually."

        return {"text": extracted_text}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
