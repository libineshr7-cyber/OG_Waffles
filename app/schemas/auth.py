from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, Union


class LoginRequest(BaseModel):
    username: str = Field(..., example="owner_dev")
    password: str = Field(..., example="owner123")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    name: str


class UserOut(BaseModel):
    id: Union[int, str] = 1
    name: str
    username: str
    role: str
    active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
