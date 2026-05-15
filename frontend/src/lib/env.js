const env = import.meta.env

export const API_BASE_URL = env.VITE_API_BASE_URL || 'http://localhost:8000'
export const API_GENERATE_STREAM = `${API_BASE_URL}/api/generate/stream`
export const API_FIX_STREAM = `${API_BASE_URL}/api/fix/stream`

export const DEFAULT_MODEL = env.VITE_DEFAULT_MODEL || 'mistral-tiny'
export const DEFAULT_TEMPERATURE = parseFloat(env.VITE_DEFAULT_TEMPERATURE ?? '0.7')
export const DEFAULT_MAX_TOKENS = parseInt(env.VITE_DEFAULT_MAX_TOKENS ?? '1000', 10)

export const APP_NAME = env.VITE_APP_NAME || 'BuildIt4Me'
export const APP_VERSION = env.VITE_APP_VERSION || '1.0.0'

export const SELF_HEAL_MAX_RETRIES = 2
