import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MessageList from './components/MessageList'
import MessageInput from './components/MessageInput'
import PreviewPane from './components/PreviewPane'
import UsagePanel from './components/UsagePanel'
import { generateStream, fixStream } from './lib/api'
import { extractComponent } from './lib/codeExtraction'
import { APP_NAME, APP_VERSION, SELF_HEAL_MAX_RETRIES } from './lib/env'

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

const SYSTEM_GREETING = {
  id: 'sys-greet',
  role: 'assistant',
  content:
    'Describe a UI in plain English and I will build it. Try: "Build a modern dashboard with sidebar and charts".',
}

export default function App() {
  const [messages, setMessages] = useState([SYSTEM_GREETING])
  const [code, setCode] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [view, setView] = useState('preview')
  const [usage, setUsage] = useState(null)
  const [latencyMs, setLatencyMs] = useState(null)
  const [model, setModel] = useState(null)
  const [healCount, setHealCount] = useState(0)
  const [dark, setDark] = useState(false)

  const abortRef = useRef(null)
  const healAttemptsRef = useRef(0)
  const lastHandledErrorRef = useRef(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const conversationHistory = useMemo(
    () =>
      messages
        .filter((m) => m.id !== SYSTEM_GREETING.id)
        .map(({ role, content }) => ({ role, content })),
    [messages],
  )

  const consumeStream = useCallback(
    async (stream, { onAssistantMessageId }) => {
      let accumulated = ''
      let finalUsage = null
      let finalLatency = null
      let finalModel = null
      let errored = null

      for await (const event of stream) {
        if (event.type === 'delta') {
          accumulated += event.content
          const visible = extractComponent(accumulated)
          setCode(visible)
          if (onAssistantMessageId) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === onAssistantMessageId
                  ? { ...m, content: 'Streaming code…' }
                  : m,
              ),
            )
          }
        } else if (event.type === 'done') {
          finalUsage = event.usage || null
          finalLatency = event.latency_ms ?? null
          finalModel = event.model || null
        } else if (event.type === 'error') {
          errored = event.message || 'stream error'
        }
      }

      const finalCode = extractComponent(accumulated)
      setCode(finalCode)
      setUsage(finalUsage)
      setLatencyMs(finalLatency)
      if (finalModel) setModel(finalModel)

      if (onAssistantMessageId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === onAssistantMessageId
              ? {
                  ...m,
                  content: errored
                    ? `Generation failed: ${errored}`
                    : 'Updated /App.js.',
                }
              : m,
          ),
        )
      }
      return { code: finalCode, errored }
    },
    [],
  )

  const sendPrompt = useCallback(
    async (prompt) => {
      if (streaming) return

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const userMsg = { id: newId(), role: 'user', content: prompt }
      const placeholder = { id: newId(), role: 'assistant', content: 'Thinking…' }
      setMessages((prev) => [...prev, userMsg, placeholder])
      setStreaming(true)
      setUsage(null)
      setLatencyMs(null)
      healAttemptsRef.current = 0
      lastHandledErrorRef.current = null

      try {
        const stream = await generateStream({
          prompt,
          currentCode: code || null,
          history: conversationHistory,
          signal: controller.signal,
        })
        await consumeStream(stream, { onAssistantMessageId: placeholder.id })
      } catch (err) {
        if (err.name !== 'AbortError') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === placeholder.id
                ? { ...m, content: `Request failed: ${err.message}` }
                : m,
            ),
          )
        }
      } finally {
        setStreaming(false)
        abortRef.current = null
      }
    },
    [code, conversationHistory, consumeStream, streaming],
  )

  const handleRuntimeError = useCallback(
    async (errorMessage) => {
      if (!errorMessage || streaming) return
      if (!code) return
      if (lastHandledErrorRef.current === errorMessage) return
      if (healAttemptsRef.current >= SELF_HEAL_MAX_RETRIES) return

      lastHandledErrorRef.current = errorMessage
      healAttemptsRef.current += 1

      const controller = new AbortController()
      abortRef.current = controller
      const healMsg = {
        id: newId(),
        role: 'assistant',
        content: `Detected runtime error — self-healing (attempt ${healAttemptsRef.current}/${SELF_HEAL_MAX_RETRIES})…`,
      }
      setMessages((prev) => [...prev, healMsg])
      setStreaming(true)

      try {
        const stream = await fixStream({
          code,
          error: errorMessage,
          signal: controller.signal,
        })
        const { errored } = await consumeStream(stream, {
          onAssistantMessageId: healMsg.id,
        })
        if (!errored) setHealCount((n) => n + 1)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === healMsg.id
                ? { ...m, content: `Self-heal failed: ${err.message}` }
                : m,
            ),
          )
        }
      } finally {
        setStreaming(false)
        abortRef.current = null
      }
    },
    [code, consumeStream, streaming],
  )

  const stopStreaming = () => {
    abortRef.current?.abort()
    setStreaming(false)
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-baseline gap-2">
          <h1 className="text-lg font-semibold">{APP_NAME}</h1>
          <span className="text-xs text-slate-400">v{APP_VERSION}</span>
        </div>
        <div className="flex items-center gap-2">
          {streaming && (
            <button
              type="button"
              onClick={stopStreaming}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Stop
            </button>
          )}
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            aria-pressed={dark}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {dark ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1">
        <section className="flex w-full max-w-md min-w-[18rem] flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <MessageList messages={messages} streaming={streaming} />
          <MessageInput
            onSend={sendPrompt}
            disabled={streaming}
            placeholder={code ? 'Edit: "Make it dark mode"…' : 'Describe a UI…'}
          />
          <UsagePanel
            usage={usage}
            latencyMs={latencyMs}
            model={model}
            healCount={healCount}
          />
        </section>
        <section className="flex min-w-0 flex-1 flex-col">
          <PreviewPane
            code={code}
            view={view}
            onView={setView}
            onRuntimeError={handleRuntimeError}
          />
        </section>
      </main>
    </div>
  )
}
