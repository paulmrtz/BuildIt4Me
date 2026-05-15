"""Streaming React-component generation and self-heal endpoints."""
from __future__ import annotations

import json
import logging
import time
from typing import List, Optional

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from config import get_config
import mistral_client
from prompts import (
    EDIT_SYSTEM_PROMPT,
    FIX_SYSTEM_PROMPT,
    GENERATE_SYSTEM_PROMPT,
)


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["generate"])
_config = get_config()


class HistoryMessage(BaseModel):
    role: str
    content: str


class GenerateRequest(BaseModel):
    prompt: str
    current_code: Optional[str] = None
    history: List[HistoryMessage] = Field(default_factory=list)
    model: str = Field(default=_config["DEFAULT_MODEL"])
    temperature: float = Field(default=_config["DEFAULT_TEMPERATURE"], ge=0.0, le=2.0)
    max_tokens: int = Field(default=_config["DEFAULT_MAX_TOKENS"], gt=0, le=32000)


class FixRequest(BaseModel):
    code: str
    error: str
    model: str = Field(default=_config["DEFAULT_MODEL"])
    temperature: float = Field(default=0.2, ge=0.0, le=2.0)
    max_tokens: int = Field(default=_config["DEFAULT_MAX_TOKENS"], gt=0, le=32000)


def _sse(event: dict) -> str:
    return f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


def _build_generate_messages(req: GenerateRequest) -> list[dict]:
    system_prompt = EDIT_SYSTEM_PROMPT if req.current_code else GENERATE_SYSTEM_PROMPT
    messages: list[dict] = [{"role": "system", "content": system_prompt}]

    for m in req.history:
        if m.role in {"user", "assistant"} and m.content:
            messages.append({"role": m.role, "content": m.content})

    if req.current_code:
        user_content = (
            f"Current /App.js:\n```jsx\n{req.current_code}\n```\n\n"
            f"Change request: {req.prompt}"
        )
    else:
        user_content = req.prompt
    messages.append({"role": "user", "content": user_content})
    return messages


def _build_fix_messages(req: FixRequest) -> list[dict]:
    return [
        {"role": "system", "content": FIX_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Broken /App.js:\n```jsx\n{req.code}\n```\n\n"
                f"Sandpack error:\n{req.error}\n\n"
                "Return the corrected file."
            ),
        },
    ]


async def _stream_events(messages: list[dict], req):
    started = time.perf_counter()
    yield _sse({"type": "start", "model": req.model})
    try:
        async for chunk in mistral_client.stream_completion(
            messages=messages,
            model=req.model,
            temperature=req.temperature,
            max_tokens=req.max_tokens,
        ):
            if chunk["type"] == "delta":
                yield _sse({"type": "delta", "content": chunk["content"]})
            elif chunk["type"] == "done":
                latency_ms = int((time.perf_counter() - started) * 1000)
                yield _sse(
                    {
                        "type": "done",
                        "usage": chunk.get("usage"),
                        "model": chunk.get("model") or req.model,
                        "latency_ms": latency_ms,
                    }
                )
    except Exception as exc:
        logger.exception("stream failed")
        yield _sse({"type": "error", "message": str(exc)})


@router.post("/generate/stream")
async def generate_stream(req: GenerateRequest):
    messages = _build_generate_messages(req)
    return StreamingResponse(
        _stream_events(messages, req),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/fix/stream")
async def fix_stream(req: FixRequest):
    messages = _build_fix_messages(req)
    return StreamingResponse(
        _stream_events(messages, req),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
