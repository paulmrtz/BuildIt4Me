"""
Configuration module for BuildIt4Me backend.
Loads environment variables with sensible defaults.
"""
import os
from typing import List
from functools import lru_cache


@lru_cache()
def get_config():
    """Get all configuration as a dictionary with defaults."""
    return {
        # Server Configuration
        "HOST": os.getenv("HOST", "0.0.0.0"),
        "PORT": int(os.getenv("PORT", "8000")),
        
        # Mistral API Configuration
        "MISTRAL_API_KEY": os.getenv("MISTRAL_API_KEY"),
        "MISTRAL_BASE_URL": os.getenv("MISTRAL_BASE_URL", "https://api.mistral.ai"),
        
        # CORS Configuration
        "CORS_ORIGINS": os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"),
        "CORS_ALLOW_CREDENTIALS": os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true",
        "CORS_ALLOW_METHODS": os.getenv("CORS_ALLOW_METHODS", "GET,POST,PUT,DELETE,OPTIONS,PATCH,HEAD"),
        "CORS_ALLOW_HEADERS": os.getenv("CORS_ALLOW_HEADERS", "*"),
        
        # Application Settings
        "DEBUG": os.getenv("DEBUG", "false").lower() == "true",
        "LOG_LEVEL": os.getenv("LOG_LEVEL", "info").upper(),
        
        # API Settings
        "API_V1_PREFIX": os.getenv("API_V1_PREFIX", "/api"),
        
        # Model Defaults
        "DEFAULT_MODEL": os.getenv("DEFAULT_MODEL", "mistral-tiny"),
        "DEFAULT_TEMPERATURE": float(os.getenv("DEFAULT_TEMPERATURE", "0.7")),
        "DEFAULT_MAX_TOKENS": int(os.getenv("DEFAULT_MAX_TOKENS", "1000")),
        
        # Timeout Settings
        "REQUEST_TIMEOUT": int(os.getenv("REQUEST_TIMEOUT", "30")),
        "CONNECT_TIMEOUT": int(os.getenv("CONNECT_TIMEOUT", "10")),
        
        # Rate Limiting
        "RATE_LIMIT_ENABLED": os.getenv("RATE_LIMIT_ENABLED", "false").lower() == "true",
        "RATE_LIMIT_REQUESTS": int(os.getenv("RATE_LIMIT_REQUESTS", "100")),
        "RATE_LIMIT_PERIOD": int(os.getenv("RATE_LIMIT_PERIOD", "60")),
    }


def get_cors_origins() -> List[str]:
    """Get CORS origins as a list."""
    origins = get_config()["CORS_ORIGINS"]
    return [o.strip() for o in origins.split(",") if o.strip()]


def get_cors_allow_methods() -> List[str]:
    """Get CORS allowed methods as a list."""
    methods = get_config()["CORS_ALLOW_METHODS"]
    return [m.strip() for m in methods.split(",") if m.strip()]


def validate_required_config():
    """Validate that all required configuration is present."""
    config = get_config()
    errors = []
    
    if not config["MISTRAL_API_KEY"]:
        errors.append("MISTRAL_API_KEY is required")
    
    if errors:
        raise ValueError("Missing required configuration: " + ", ".join(errors))
    
    return True
