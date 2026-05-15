"""Thin wrapper around the Mistral SDK with sync + async streaming helpers."""
from __future__ import annotations

from typing import AsyncIterator, Iterable, List

from mistralai.client import Mistral
from mistralai.client.models import (
    AssistantMessage,
    SystemMessage,
    UserMessage,
)

from config import get_config


_ROLE_MAP = {
    "user": UserMessage,
    "assistant": AssistantMessage,
    "system": SystemMessage,
}


def to_sdk_message(role: str, content: str):
    cls = _ROLE_MAP.get(role.lower())
    if cls is None:
        raise ValueError(f"Unknown message role: {role}")
    return cls(content=content)


def to_sdk_messages(messages: Iterable[dict]) -> list:
    return [to_sdk_message(m["role"], m["content"]) for m in messages]


_client: Mistral | None = None


def get_client() -> Mistral:
    """Return a process-wide Mistral client. Created lazily on first call."""
    global _client
    if _client is None:
        config = get_config()
        _client = Mistral(
            api_key=config["MISTRAL_API_KEY"],
            server_url=config["MISTRAL_BASE_URL"],
            timeout_ms=int(config["REQUEST_TIMEOUT"]) * 1000,
        )
    return _client


def complete(
    *,
    messages: List[dict],
    model: str,
    temperature: float,
    max_tokens: int,
):
    """Non-streaming completion. Returns the SDK response object."""
    return get_client().chat.complete(
        model=model,
        messages=to_sdk_messages(messages),
        temperature=temperature,
        max_tokens=max_tokens,
    )


async def stream_completion(
    *,
    messages: List[dict],
    model: str,
    temperature: float,
    max_tokens: int,
) -> AsyncIterator[dict]:
    """Yield delta dicts as the model streams.

    Each yielded dict is one of:
      {"type": "delta", "content": str}
      {"type": "done", "usage": {...} | None, "model": str | None}
    """
    stream = await get_client().chat.stream_async(
        model=model,
        messages=to_sdk_messages(messages),
        temperature=temperature,
        max_tokens=max_tokens,
    )

    final_usage = None
    final_model = None
    async for event in stream:
        data = event.data
        if data.choices:
            delta = data.choices[0].delta
            content = getattr(delta, "content", None)
            if content:
                yield {"type": "delta", "content": content}
        # Mistral emits usage on the terminal event
        usage = getattr(data, "usage", None)
        if usage is not None:
            final_usage = {
                "prompt_tokens": usage.prompt_tokens,
                "completion_tokens": usage.completion_tokens,
                "total_tokens": usage.total_tokens,
            }
        if getattr(data, "model", None):
            final_model = data.model

    yield {"type": "done", "usage": final_usage, "model": final_model}
