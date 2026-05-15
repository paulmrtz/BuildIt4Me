"""Generic chat endpoint — non-streaming."""
from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from config import get_config
import mistral_client


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["chat"])
_config = get_config()


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    model: str = Field(default=_config["DEFAULT_MODEL"])
    temperature: float = Field(default=_config["DEFAULT_TEMPERATURE"], ge=0.0, le=2.0)
    max_tokens: int = Field(default=_config["DEFAULT_MAX_TOKENS"], gt=0, le=32000)


@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        response = mistral_client.complete(
            messages=[m.model_dump() for m in request.messages],
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )
    except Exception:
        logger.exception("chat completion failed")
        raise HTTPException(status_code=502, detail="upstream model error")

    return {
        "content": response.choices[0].message.content,
        "model": response.model,
        "usage": {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens,
        },
    }
