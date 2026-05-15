"""BuildIt4Me FastAPI application entrypoint."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load .env before importing config so values are picked up.
load_dotenv()

from config import (  # noqa: E402  (must be after load_dotenv)
    get_config,
    get_cors_allow_methods,
    get_cors_origins,
    validate_required_config,
)
from routes import chat, generate, health  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_required_config()
    config = get_config()
    logging.basicConfig(
        level=config["LOG_LEVEL"],
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    logging.getLogger(__name__).info(
        "BuildIt4Me starting (model=%s, debug=%s)",
        config["DEFAULT_MODEL"],
        config["DEBUG"],
    )
    yield


config = get_config()
app = FastAPI(title="BuildIt4Me API", version="1.0.0", debug=config["DEBUG"], lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=config["CORS_ALLOW_CREDENTIALS"],
    allow_methods=get_cors_allow_methods(),
    allow_headers=[h.strip() for h in config["CORS_ALLOW_HEADERS"].split(",")] or ["*"],
)

app.include_router(health.router)
app.include_router(chat.router)
app.include_router(generate.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=config["HOST"], port=config["PORT"], reload=config["DEBUG"])
