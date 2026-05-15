"""Health + safe-config endpoints."""
from __future__ import annotations

from fastapi import APIRouter

from config import get_config, get_cors_origins, get_cors_allow_methods


router = APIRouter(prefix="/api", tags=["meta"])


@router.get("/health")
async def health():
    config = get_config()
    return {
        "status": "ok",
        "version": "1.0.0",
        "debug": config["DEBUG"],
        "log_level": config["LOG_LEVEL"],
    }


@router.get("/config")
async def safe_config():
    config = get_config()
    return {
        "server": {"host": config["HOST"], "port": config["PORT"]},
        "model_defaults": {
            "model": config["DEFAULT_MODEL"],
            "temperature": config["DEFAULT_TEMPERATURE"],
            "max_tokens": config["DEFAULT_MAX_TOKENS"],
        },
        "cors": {
            "origins": get_cors_origins(),
            "allow_credentials": config["CORS_ALLOW_CREDENTIALS"],
            "allow_methods": get_cors_allow_methods(),
        },
        "api_info": {"version": "1.0.0", "debug": config["DEBUG"]},
    }
