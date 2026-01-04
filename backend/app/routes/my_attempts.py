"""
My Attempts API routes
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from app.middleware.auth import get_clerk_user_id
from app.db import get_prisma
from prisma import Prisma

router = APIRouter()


@router.get("")
async def get_my_attempts(
    user_id: str = Depends(get_clerk_user_id), prisma: Prisma = Depends(get_prisma)
) -> Dict[str, Any]:
    """Get all attempts for the current user"""
    try:
        # Get user profile
        # Note: Field name may be clerk_id (snake_case) or clerkId (camelCase)
        # depending on Prisma Python client generation
        user_profile = await prisma.userprofile.find_unique(
            where={
                "clerk_id": user_id
            }  # May need to be "clerkId" - check generated client
        )

        if not user_profile:
            raise HTTPException(status_code=404, detail="User profile not found")

        # Get user's attempts with relations
        attempts = await prisma.attempt.find_many(
            where={"user_id": user_profile.id},  # May need to be "userId"
            include={
                "image": True,
                "answer_image": True,  # May need to be "answerImage"
            },
            order_by={"created_at": "desc"},  # May need to be "createdAt"
        )

        return {"attempts": [attempt.dict() for attempt in attempts]}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
