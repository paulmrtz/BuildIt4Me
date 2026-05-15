import { useEffect, useRef } from 'react'

export default function MessageList({ messages, streaming }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  return (
    <div
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
    >
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={[
              'max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm',
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-white text-slate-800 rounded-bl-sm border border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700',
            ].join(' ')}
          >
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          </div>
        </div>
      ))}
      {streaming && (
        <div className="flex justify-start">
          <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-sm italic text-slate-500 shadow-sm border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
            Generating…
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  )
}
