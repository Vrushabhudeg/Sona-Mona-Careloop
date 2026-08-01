from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime, time
from typing import Optional, List

# Profile Schemas
class ProfileBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[str] = "user"

class ProfileCreate(ProfileBase):
    id: UUID

class ProfileResponse(ProfileBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Reminder Schemas
class ReminderBase(BaseModel):
    title: str
    message: Optional[str] = None
    schedule_time: str = Field(..., description="HH:MM format")
    is_active: Optional[bool] = True

class ReminderCreate(ReminderBase):
    pass

class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    schedule_time: Optional[str] = None
    is_active: Optional[bool] = None

class ReminderResponse(ReminderBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Reminder History Schemas
class ReminderHistoryBase(BaseModel):
    reminder_id: UUID
    status: str = Field(..., description="'sent', 'completed', 'snoozed'")
    action_time: Optional[datetime] = None

class ReminderHistoryCreate(ReminderHistoryBase):
    user_id: UUID

class ReminderHistoryResponse(ReminderHistoryBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Nutrition Log Schemas
class NutritionLogBase(BaseModel):
    meal_type: str = Field(..., description="'breakfast', 'lunch', 'dinner', 'snack', 'water'")
    food_name: Optional[str] = None
    calories: Optional[float] = 0.0
    protein: Optional[float] = 0.0
    carbs: Optional[float] = 0.0
    fat: Optional[float] = 0.0
    water_amount: Optional[float] = 0.0

class NutritionLogCreate(NutritionLogBase):
    pass

class NutritionLogResponse(NutritionLogBase):
    id: UUID
    user_id: UUID
    logged_at: datetime

    class Config:
        from_attributes = True
