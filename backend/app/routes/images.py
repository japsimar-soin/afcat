"""
Images API routes
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Dict, Any, Optional, Literal
import base64
from PIL import Image
import io
import hashlib
from app.models.schemas import GenerateImageSchema, UploadImageSchema
from app.middleware.auth import get_clerk_user_id
from app.db import get_prisma
from app.services.storage import get_storage
from prisma import Prisma

router = APIRouter()


@router.get("")
async def get_images(
    mode: Optional[Literal["PPDT", "TAT"]] = Query(None),
    public: Optional[bool] = Query(None, alias="public"),
    prisma: Prisma = Depends(get_prisma),
) -> Dict[str, Any]:
    """Get list of images"""
    try:
        where: Dict[str, Any] = {}

        if mode:
            where["mode"] = mode

        if public:
            where["source"] = "seed"

        images = await prisma.image.find_many(
            where=where, order_by={"created_at": "desc"}
        )

        return {"images": [image.dict() for image in images]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/generate")
async def generate_image(
    data: GenerateImageSchema,
    user_id: str = Depends(get_clerk_user_id),
    prisma: Prisma = Depends(get_prisma),
) -> Dict[str, Any]:
    """Generate AI image"""
    try:
        # TODO: Implement image generation
        # This will use the image generation service (Replicate/Freepik)
        # For now, return error
        raise HTTPException(
            status_code=501,
            detail="Image generation not yet implemented in FastAPI backend",
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/upload")
async def upload_image(
    data: UploadImageSchema,
    user_id: str = Depends(get_clerk_user_id),
    prisma: Prisma = Depends(get_prisma),
) -> Dict[str, Any]:
    """Upload an image"""
    try:
        storage = get_storage()

        # Decode base64 image
        import re

        base64_data = re.sub(r"^data:image/\w+;base64,", "", data.image_data)
        try:
            image_buffer = base64.b64decode(base64_data)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 image data")

        # Validate and process image
        try:
            img = Image.open(io.BytesIO(image_buffer))
            # Convert to RGB if needed (handles RGBA, P, etc.)
            if img.mode != "RGB":
                img = img.convert("RGB")

            # Resize to max 800x600
            img.thumbnail((800, 600), Image.Resampling.LANCZOS)

            # Save as WebP
            output = io.BytesIO()
            img.save(output, format="WEBP", quality=85)
            processed_buffer = output.getvalue()
        except Exception as e:
            raise HTTPException(
                status_code=400, detail=f"Invalid image format: {str(e)}"
            )

        # Generate checksum
        checksum = hashlib.md5(processed_buffer).hexdigest()

        # Check if image already exists
        existing_image = await prisma.image.find_first(where={"checksum": checksum})

        if existing_image:
            return {"image": existing_image.dict(), "message": "Image already exists"}

        # Save to storage
        storage_result = await storage.save(
            processed_buffer,
            f"{data.mode.lower()}_{data.filename}",
            {"content_type": "image/webp"},
        )

        if not storage_result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save image: {storage_result.get('error')}",
            )

        # Get or create user profile
        user_profile = await prisma.userprofile.upsert(
            where={"clerk_id": user_id},
            data={"create": {"clerk_id": user_id}, "update": {}},
        )

        # Get image dimensions
        img_width, img_height = img.size

        # Create image record
        image = await prisma.image.create(
            data={
                "storage_key": storage_result["path"],
                "mode": data.mode,
                "source": "user",
                "checksum": checksum,
                "created_by_id": user_profile.id,
                "is_public": False,
                "width": img_width,
                "height": img_height,
                "format": "webp",
                "bytes": len(processed_buffer),
            }
        )

        # Update attempt if attempt_id provided
        if data.attempt_id:
            try:
                await prisma.attempt.update(
                    where={"id": data.attempt_id}, data={"answer_image_id": image.id}
                )
            except Exception as e:
                # Log but don't fail the request
                print(f"Failed to update attempt with answer image: {e}")

        return {"image": image.dict()}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
