from tortoise import fields, models
from tortoise.models import Model
from tortoise import fields
from tortoise.models import Model
from fastapi_admin.models import AbstractAdmin
from datetime import datetime
import uuid
from enum import Enum


# -------------------- Users --------------------
class User(Model):
    id = fields.UUIDField(pk=True, default=uuid.uuid4)

    email = fields.CharField(max_length=255, unique=True, index=True)
    name = fields.CharField(max_length=255,index=True)
    username = fields.CharField(max_length=50, unique=True, null=True, index=True)
    bio = fields.TextField(null=True)
    picture_url = fields.CharField(max_length=855, null=True)
    phone_number = fields.CharField(max_length=20, null=True)
    website = fields.CharField(max_length=255, null=True)
    

    password = fields.CharField(max_length=255, null=True)
    is_verified = fields.BooleanField(default=False)
    is_chef = fields.BooleanField(default=False, index=True)
    theme = fields.CharField(max_length=20, default="#07b607ff", index=True)  # Default theme color

    is_active = fields.BooleanField(default=True)
    location = fields.CharField(max_length=180, null=True, index=True)
    user_agent = fields.CharField(max_length=500, null=True)
    last_login = fields.DatetimeField(null=True)

    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "users"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} <{self.email}>"
