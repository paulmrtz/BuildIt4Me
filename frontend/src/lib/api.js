import {
  API_FIX_STREAM,
  API_GENERATE_STREAM,
  DEFAULT_MAX_TOKENS,
  DEFAULT_MODEL,
  DEFAULT_TEMPERATURE,
} from './env'
import { readSSE } from './stream'

async function postSSE(url, body, { signal } = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(body),
    signal,
  })
  return readSSE(response)
}

export function generateStream({ prompt, currentCode, history, signal }) {
  return postSSE(
    API_GENERATE_STREAM,
    {
      prompt,
      current_code: currentCode || null,
      history: history || [],
      model: DEFAULT_MODEL,
      temperature: DEFAULT_TEMPERATURE,
      max_tokens: DEFAULT_MAX_TOKENS,
    },
    { signal },
  )
}

export function fixStream({ code, error, signal }) {
  return postSSE(
    API_FIX_STREAM,
    {
      code,
      error,
      model: DEFAULT_MODEL,
      temperature: 0.2,
      max_tokens: DEFAULT_MAX_TOKENS,
    },
    { signal },
  )
}
