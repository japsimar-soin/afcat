"""
Authentication middleware for Clerk JWT verification
"""

from fastapi import HTTPException, Security, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
import httpx
from typing import Optional

security = HTTPBearer(auto_error=False)


async def get_clerk_user_id(
    authorization: Optional[str] = Header(None),
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
) -> str:
    """
    Get Clerk user ID from Authorization header
    For now, we'll extract from the token directly (frontend sends it)
    In production, verify the token with Clerk's API
    """
    token = None

    if credentials:
        token = credentials.credentials
    elif authorization:
        # Extract token from "Bearer <token>" format
        if authorization.startswith("Bearer "):
            token = authorization[7:]

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authorization token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify token with Clerk API
    clerk_secret_key = os.getenv("CLERK_SECRET_KEY")

    if clerk_secret_key:
        try:
            async with httpx.AsyncClient() as client:
                # Verify session token with Clerk
                response = await client.get(
                    "https://api.clerk.dev/v1/sessions/verify",
                    headers={
                        "Authorization": f"Bearer {token}",
                        "X-API-Key": clerk_secret_key,
                    },
                    timeout=5.0,
                )

                if response.status_code == 200:
                    session_data = response.json()
                    user_id = session_data.get("user_id")
                    if user_id:
                        return user_id
        except Exception:
            # Fall through to alternative verification
            pass

    # Alternative: For development, accept token in X-User-Id header
    # This is a temporary solution - in production, always verify with Clerk
    dev_user_id = os.getenv("DEV_USER_ID")
    if dev_user_id and os.getenv("ENVIRONMENT") == "development":
        return dev_user_id

    raise HTTPException(
        status_code=401,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
