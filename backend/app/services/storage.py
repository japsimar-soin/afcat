"""
Storage service for handling image uploads
Supports both local and Supabase storage
"""

import os
import hashlib
from typing import Dict, Optional, Any
from pathlib import Path
import aiofiles

try:
    from supabase import create_client, Client
except ImportError:
    # Supabase not installed, will use local storage
    create_client = None
    Client = None


class StorageAdapter:
    """Base storage adapter interface"""

    async def save(
        self, buffer: bytes, filename: str, options: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Save file and return result with path and checksum"""
        raise NotImplementedError

    async def delete(self, path: str) -> Dict[str, Any]:
        """Delete file"""
        raise NotImplementedError

    def get_url(self, path: str) -> str:
        """Get public URL for file"""
        raise NotImplementedError


class LocalStorageAdapter(StorageAdapter):
    """Local filesystem storage adapter"""

    def __init__(self):
        self.upload_dir = Path(os.getcwd()) / "public" / "uploads"
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def save(
        self, buffer: bytes, filename: str, options: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Save file to local filesystem"""
        try:
            # Generate checksum
            checksum = hashlib.md5(buffer).hexdigest()

            # Create unique filename
            timestamp = (
                int(os.path.getmtime(__file__) * 1000)
                if os.path.exists(__file__)
                else 0
            )
            import time

            timestamp = int(time.time() * 1000)
            unique_filename = f"{timestamp}-{checksum}-{filename}"
            file_path = self.upload_dir / unique_filename

            # Save file
            async with aiofiles.open(file_path, "wb") as f:
                await f.write(buffer)

            return {"success": True, "path": unique_filename, "checksum": checksum}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def delete(self, path: str) -> Dict[str, Any]:
        """Delete file from local filesystem"""
        try:
            file_path = self.upload_dir / path
            if file_path.exists():
                file_path.unlink()
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_url(self, path: str) -> str:
        """Get local file URL"""
        return f"/uploads/{path}"


class SupabaseStorageAdapter(StorageAdapter):
    """Supabase storage adapter"""

    def __init__(self):
        if create_client is None:
            raise ValueError("supabase package not installed")

        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.bucket_name = os.getenv("SUPABASE_BUCKET_NAME", "ssb-prep-images")

    async def save(
        self, buffer: bytes, filename: str, options: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Save file to Supabase storage"""
        try:
            # Generate checksum
            checksum = hashlib.md5(buffer).hexdigest()

            # Create unique filename
            import time

            timestamp = int(time.time() * 1000)
            unique_filename = f"{timestamp}-{checksum}-{filename}"

            # Upload to Supabase (sync API, but we're in async context)
            content_type = (options or {}).get("content_type", "image/webp")
            result = self.supabase.storage.from_(self.bucket_name).upload(
                unique_filename,
                buffer,
                file_options={"content-type": content_type, "upsert": "false"},
            )

            # Supabase Python client returns response differently
            # Check for errors
            if hasattr(result, "error") and result.error:
                return {"success": False, "error": str(result.error)}

            return {"success": True, "path": unique_filename, "checksum": checksum}
        except Exception as e:
            return {"success": False, "error": str(e)}

    async def delete(self, path: str) -> Dict[str, Any]:
        """Delete file from Supabase storage"""
        try:
            result = self.supabase.storage.from_(self.bucket_name).remove([path])
            if hasattr(result, "error") and result.error:
                return {"success": False, "error": str(result.error)}
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_url(self, path: str) -> str:
        """Get Supabase public URL"""
        result = self.supabase.storage.from_(self.bucket_name).get_public_url(path)
        if hasattr(result, "public_url"):
            return result.public_url
        return str(result)


# Initialize storage adapter
def get_storage() -> StorageAdapter:
    """Get storage adapter based on environment"""
    if os.getenv("SUPABASE_URL"):
        return SupabaseStorageAdapter()
    return LocalStorageAdapter()
