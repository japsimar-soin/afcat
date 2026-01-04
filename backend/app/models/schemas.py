"""
Pydantic schemas for request/response models
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class UpdateAttemptSchema(BaseModel):
    story_text: Optional[str] = Field(None, alias="storyText")
    answer_image_id: Optional[str] = Field(None, alias="answerImageId")
    status: Optional[Literal["in_progress", "completed", "processing", "scored"]] = None

    class Config:
        populate_by_name = True


class GenerateImageSchema(BaseModel):
    mode: Literal["PPDT", "TAT"]
    prompt: Optional[str] = None


class UploadImageSchema(BaseModel):
    mode: Literal["PPDT", "TAT"]
    image_data: str = Field(..., alias="imageData")  # base64 encoded
    filename: str
    attempt_id: Optional[str] = Field(None, alias="attemptId")

    class Config:
        populate_by_name = True


class OCRSchema(BaseModel):
    image_id: str = Field(..., alias="imageId")

    class Config:
        populate_by_name = True


class ErrorResponse(BaseModel):
    error: str
    details: Optional[str] = None
