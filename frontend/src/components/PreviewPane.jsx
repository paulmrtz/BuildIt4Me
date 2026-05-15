import { useEffect, useState } from 'react'
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackCodeEditor,
  useSandpack,
} from '@codesandbox/sandpack-react'

const STARTER = `export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
      <div className="text-center">
        <p className="text-sm uppercase tracking-widest text-slate-400">BuildIt4Me</p>
        <h1 className="mt-2 text-3xl font-semibold">Describe a UI to get started</h1>
        <p className="mt-2 text-slate-500">Try: "Build a modern dashboard with sidebar and charts."</p>
      </div>
    </div>
  )
}
`

const SANDPACK_DEPS = {
  react: '^18.2.0',
  'react-dom': '^18.2.0',
}

// External: a CDN Tailwind so generated Tailwind utility classes render
// inside the Sandpack iframe without a build step.
const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`

function ErrorBridge({ onError }) {
  const { sandpack } = useSandpack()
  useEffect(() => {
    const message =
      sandpack.error?.message ||
      sandpack.error?.title ||
      (typeof sandpack.error === 'string' ? sandpack.error : null)
    if (message) onError(message)
  }, [sandpack.error, onError])
  return null
}

export default function PreviewPane({ code, view, onView, onRuntimeError }) {
  const appCode = code && code.trim().length > 0 ? code : STARTER
  // Force a Sandpack remount on every code change so streaming partials
  // don't accumulate stale module errors.
  const [key, setKey] = useState(0)
  useEffect(() => setKey((k) => k + 1), [appCode])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
        <div className="text-xs uppercase tracking-widest text-slate-400">Preview</div>
        <div className="inline-flex rounded-md border border-slate-200 bg-slate-100 p-0.5 text-xs dark:border-slate-700 dark:bg-slate-800">
          {['preview', 'code'].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onView(opt)}
              className={[
                'rounded px-3 py-1 capitalize transition-colors',
                view === opt
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
              ].join(' ')}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900">
        <SandpackProvider
          key={key}
          template="react"
          theme="auto"
          files={{
            '/App.js': appCode,
            '/public/index.html': { code: INDEX_HTML, hidden: true },
          }}
          customSetup={{ dependencies: SANDPACK_DEPS }}
          options={{ recompileMode: 'delayed', recompileDelay: 300 }}
        >
          <ErrorBridge onError={onRuntimeError} />
          <SandpackLayout style={{ height: '100%', border: 'none' }}>
            {view === 'preview' ? (
              <SandpackPreview
                style={{ height: '100%' }}
                showOpenInCodeSandbox={false}
                showRefreshButton
              />
            ) : (
              <SandpackCodeEditor
                style={{ height: '100%' }}
                showTabs={false}
                showLineNumbers
                wrapContent
                readOnly
              />
            )}
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  )
}
