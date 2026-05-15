# BuildIt4Me

Turn ideas into live web apps instantly.

AI-powered UI generation with real-time rendering, editing, and self-healing code.

---

## What is BuildIt4Me?

BuildIt4Me is a real-time AI app builder that lets you:

- Describe a UI in plain English
- Watch it generated live
- Edit it conversationally
- Automatically fix errors

---

## Demo

"Build a modern dashboard with sidebar and charts"

- Instantly rendered React UI
- "Make it dark mode"
- Updated without restarting

Live demo coming soon.

---

## Features

### Real-Time AI Generation
- Streaming code generation
- Instant UI preview via Sandpack

### Conversational UI Editing
"Make the navbar sticky"
"Add animations"

- Updates existing code

### Self-Healing Code
- Detect runtime errors
- Auto-fix via LLM loop

### Stateful AI
- Maintains conversation + code context

### Observability
- Token usage tracking
- Latency monitoring

---

## Architecture

```
Frontend (React + Tailwind + Vite)
  |
Streaming Layer (Fetch API)
  |
FastAPI Backend
  |
Mistral AI (mistral-tiny)
```

---

## Tech Stack

**Frontend:**
- React 18
- Vite 5
- Tailwind CSS

**Backend:**
- FastAPI
- Uvicorn
- python-dotenv

**AI:**
- Mistral AI (mistralai SDK)

---

## Configuration

### Backend (.env)

Create `backend/.env` from `backend/.env.example`:

```bash
# Server Configuration
HOST=0.0.0.0
PORT=8000

# Mistral API
MISTRAL_API_KEY=your_api_key_here
MISTRAL_BASE_URL=https://api.mistral.ai/v1

# CORS Configuration (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
CORS_ALLOW_CREDENTIALS=true
CORS_ALLOW_METHODS=GET,POST,PUT,DELETE,OPTIONS,PATCH,HEAD
CORS_ALLOW_HEADERS=*

# Application Settings
DEBUG=true
LOG_LEVEL=info

# Model Defaults
DEFAULT_MODEL=mistral-tiny
DEFAULT_TEMPERATURE=0.7
DEFAULT_MAX_TOKENS=1000

# Timeout Settings (seconds)
REQUEST_TIMEOUT=30
CONNECT_TIMEOUT=10
```

### Frontend (.env)

Create `frontend/.env` from `frontend/.env.example`:

```bash
# Development Server
VITE_PORT=5173
VITE_HOST=localhost

# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_API_CHAT_ENDPOINT=/api/chat
VITE_API_HEALTH_ENDPOINT=/api/health

# Application Settings
VITE_APP_NAME=BuildIt4Me
VITE_APP_VERSION=1.0.0

# Model Defaults
VITE_DEFAULT_MODEL=mistral-tiny
VITE_DEFAULT_TEMPERATURE=0.7
VITE_DEFAULT_MAX_TOKENS=1000

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_LOGGING=true
VITE_DEBUG=false
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy example env and add your API key
cp .env.example .env
# Edit .env and set MISTRAL_API_KEY

# Run development server
uvicorn main:app --reload
# Server runs at http://localhost:8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy example env
cp .env.example .env
# Edit .env if needed (defaults work with backend on port 8000)

# Run development server
npm run dev
# App runs at http://localhost:5173
```

### Docker (Optional - Coming Soon)

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | One-shot chat completion (non-streaming) |
| POST | `/api/generate/stream` | Streaming React-component generation / edit (SSE) |
| POST | `/api/fix/stream` | Streaming self-heal of broken /App.js given an error (SSE) |
| GET | `/api/health` | Health check |
| GET | `/api/config` | Safe config snapshot (no secrets) |

### Streaming Event Format

Both `/api/generate/stream` and `/api/fix/stream` emit `text/event-stream`:

```
data: {"type":"start","model":"mistral-tiny"}

data: {"type":"delta","content":"import React"}

data: {"type":"delta","content":" from 'react'\n..."}

data: {"type":"done","model":"mistral-tiny","usage":{"prompt_tokens":...,"completion_tokens":...,"total_tokens":...},"latency_ms":1234}
```

Errors surface as `{"type":"error","message":"..."}`.

### Chat Request

```json
{
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "model": "mistral-tiny",
  "temperature": 0.7,
  "max_tokens": 1000
}
```

### Chat Response

```json
{
  "content": "Hello! How can I help you?",
  "model": "mistral-tiny",
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 15,
    "total_tokens": 25
  }
}
```

---

## Environment Variables Reference

### Backend Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |
| `MISTRAL_API_KEY` | - | **Required** Mistral API key |
| `MISTRAL_BASE_URL` | `https://api.mistral.ai` | Mistral API base URL (SDK appends `/v1`) |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Allowed origins (comma-separated) |
| `CORS_ALLOW_CREDENTIALS` | `true` | Allow credentials |
| `CORS_ALLOW_METHODS` | `GET,POST,PUT,DELETE,OPTIONS,PATCH,HEAD` | Allowed HTTP methods |
| `CORS_ALLOW_HEADERS` | `*` | Allowed headers |
| `DEBUG` | `false` | Debug mode |
| `LOG_LEVEL` | `info` | Logging level (debug, info, warning, error) |
| `DEFAULT_MODEL` | `mistral-tiny` | Default model |
| `DEFAULT_TEMPERATURE` | `0.7` | Default temperature |
| `DEFAULT_MAX_TOKENS` | `1000` | Default max tokens |
| `REQUEST_TIMEOUT` | `30` | Request timeout (seconds) |
| `CONNECT_TIMEOUT` | `10` | Connect timeout (seconds) |

### Frontend Variables

All frontend variables must be prefixed with `VITE_` to be exposed to the app.

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_PORT` | `5173` | Dev server port |
| `VITE_HOST` | `localhost` | Dev server host |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend API base URL |
| `VITE_API_CHAT_ENDPOINT` | `/api/chat` | Chat endpoint path |
| `VITE_API_HEALTH_ENDPOINT` | `/api/health` | Health check endpoint |
| `VITE_APP_NAME` | `BuildIt4Me` | Application name |
| `VITE_APP_VERSION` | `1.0.0` | Application version |
| `VITE_DEFAULT_MODEL` | `mistral-tiny` | Default model |
| `VITE_DEFAULT_TEMPERATURE` | `0.7` | Default temperature |
| `VITE_DEFAULT_MAX_TOKENS` | `1000` | Default max tokens |
| `VITE_DEBUG` | `false` | Debug mode |

---

## Roadmap

- [x] Real-time streaming responses
- [x] Conversational editing
- [x] Agentic error correction (self-heal loop, capped retries)
- [x] Observability (token usage + latency in UI)
- [ ] Docker support
- [ ] Production deployment guides
- [ ] CI/CD pipeline
- [ ] Test coverage

---

## Vision

An autonomous development assistant that can:
- Write code
- Edit code
- Debug itself
- Optimize outputs

---

## Support

If you like the project, drop a star.

---

## License

MIT License
