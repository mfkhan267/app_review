from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field

Platform = Literal["Web", "App", "Database"]
ComponentType = Literal["Application", "Database", "OS"]


class ComponentBase(BaseModel):
    component_type: ComponentType
    tech_name: str = Field(..., max_length=100)
    version: Optional[str] = None
    eol_date: date
    extended_support_date: Optional[date] = None


class ComponentCreate(ComponentBase):
    pass


class UpgradePlanUpdate(BaseModel):
    upgrade_plan: str
    upgrade_target_date: Optional[date] = None


class ComponentOut(ComponentBase):
    id: int
    upgrade_plan: Optional[str] = None
    upgrade_target_date: Optional[date] = None
    status: str

    class Config:
        from_attributes = True


class AppBase(BaseModel):
    app_id: str = Field(..., max_length=50)
    app_name: str = Field(..., max_length=200)
    platform: Platform
    app_owner: str
    app_owner_email: EmailStr
    platform_owner: str
    platform_owner_email: Optional[EmailStr] = None


class AppCreate(AppBase):
    components: list[ComponentCreate] = Field(..., min_length=1)


class AppUpdate(AppBase):
    components: list[ComponentCreate] = Field(..., min_length=1)


class AppOut(AppBase):
    id: int
    components: list[ComponentOut]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SummaryOut(BaseModel):
    total_apps: int
    total_components: int
    by_status: dict
    by_platform: dict
    by_tech_name: dict


class TechCatalogBase(BaseModel):
    component_type: ComponentType
    tech_name: str = Field(..., max_length=100)
    version: str = Field(..., max_length=50)
    eoss_date: date   # End of Standard Support
    eoes_date: Optional[date] = None  # End of Extended Support
    notes: Optional[str] = None


class TechCatalogCreate(TechCatalogBase):
    pass


class TechCatalogOut(TechCatalogBase):
    id: int

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    password: str


class LoginResponse(BaseModel):
    token: str
    expires_in: int


class ImportResult(BaseModel):
    apps_created: int
    apps_updated: int
    errors: list[str]
