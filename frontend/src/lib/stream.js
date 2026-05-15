/**
 * Minimal SSE-over-fetch reader for our /generate/stream and /fix/stream
 * endpoints. The server emits `data: <json>\n\n` frames.
 */
export async function* readSSE(response) {
  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status}`)
  }
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let sep
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, sep).trim()
      buffer = buffer.slice(sep + 2)
      if (!frame.startsWith('data:')) continue
      const payload = frame.slice(5).trim()
      if (!payload) continue
      try {
        yield JSON.parse(payload)
      } catch {
        // ignore malformed frames; the model produced bad output once
      }
    }
  }
}
