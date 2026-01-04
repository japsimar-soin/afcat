"""
Attempts API routes
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from app.models.schemas import UpdateAttemptSchema, ErrorResponse
from app.middleware.auth import get_clerk_user_id
from app.db import get_prisma
from prisma import Prisma

router = APIRouter()


@router.get("/{attempt_id}")
async def get_attempt(
    attempt_id: str,
    user_id: str = Depends(get_clerk_user_id),
    prisma: Prisma = Depends(get_prisma),
) -> Dict[str, Any]:
    """Get a specific attempt by ID"""
    try:
        # Get user profile
        user_profile = await prisma.userprofile.find_unique(where={"clerk_id": user_id})

        if not user_profile:
            raise HTTPException(status_code=404, detail="User profile not found")

        # Get attempt with relations
        attempt = await prisma.attempt.find_first(
            where={"id": attempt_id, "user_id": user_profile.id},
            include={"image": True, "answer_image": True, "user": True},
        )

        if not attempt:
            raise HTTPException(status_code=404, detail="Attempt not found")

        return {"attempt": attempt.dict()}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.patch("/{attempt_id}")
async def update_attempt(
    attempt_id: str,
    data: UpdateAttemptSchema,
    user_id: str = Depends(get_clerk_user_id),
    prisma: Prisma = Depends(get_prisma),
) -> Dict[str, Any]:
    """Update an attempt"""
    try:
        # Get user profile
        user_profile = await prisma.userprofile.find_unique(where={"clerk_id": user_id})

        if not user_profile:
            raise HTTPException(status_code=404, detail="User profile not found")

        # Verify attempt belongs to user
        existing_attempt = await prisma.attempt.find_first(
            where={"id": attempt_id, "user_id": user_profile.id}
        )

        if not existing_attempt:
            raise HTTPException(status_code=404, detail="Attempt not found")

        # Prepare update data
        update_data: Dict[str, Any] = {}
        if data.story_text is not None:
            update_data["story_text"] = data.story_text
        if data.answer_image_id is not None:
            update_data["answer_image_id"] = data.answer_image_id
        if data.status is not None:
            update_data["status"] = data.status

        # Update attempt
        attempt = await prisma.attempt.update(
            where={"id": attempt_id},
            data=update_data,
            include={"image": True, "answer_image": True, "user": True},
        )

        # Enqueue AI analysis if story text is provided
        if data.story_text and data.story_text.strip():
            # TODO: Enqueue AI analysis job
            # This will be implemented when we migrate the worker
            pass

        return {"attempt": attempt.dict()}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
