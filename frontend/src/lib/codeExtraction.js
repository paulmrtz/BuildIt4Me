/**
 * The system prompt instructs the model to emit raw code, but real-world
 * outputs sometimes still arrive wrapped in markdown fences or trailing
 * commentary. This module normalizes the stream into renderable source.
 */

const FENCE_OPEN = /^\s*```(?:jsx?|tsx?|javascript|typescript)?\s*\n/i
const FENCE_CLOSE = /\n?```[\s\S]*$/

export function stripFences(raw) {
  if (!raw) return ''
  let out = raw
  if (FENCE_OPEN.test(out)) out = out.replace(FENCE_OPEN, '')
  if (/```/.test(out)) out = out.replace(FENCE_CLOSE, '')
  return out
}

/**
 * Best-effort: keep characters from the first `import` or function/const
 * declaration onward, discarding any leading prose the model might emit.
 */
export function extractComponent(raw) {
  const code = stripFences(raw)
  const match = code.match(/(^|\n)(import |const \w+ ?= ?\(|function \w+\s?\(|export default)/)
  if (!match) return code.trim()
  return code.slice(match.index + (match[1] ? 1 : 0)).trim()
}

export function looksLikeReactComponent(code) {
  return /export\s+default\s+\w+/.test(code) || /return\s*\(\s*</.test(code)
}
