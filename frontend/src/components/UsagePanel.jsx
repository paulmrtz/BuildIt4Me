function Stat({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-slate-400">{label}</span>
      <span className="font-mono text-xs text-slate-700 dark:text-slate-200">{value}</span>
    </div>
  )
}

export default function UsagePanel({ usage, latencyMs, model, healCount }) {
  if (!usage && !latencyMs && !healCount) return null
  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/60">
      {model && <Stat label="Model" value={model} />}
      {usage && <Stat label="Prompt" value={usage.prompt_tokens} />}
      {usage && <Stat label="Output" value={usage.completion_tokens} />}
      {usage && <Stat label="Total" value={usage.total_tokens} />}
      {latencyMs != null && <Stat label="Latency" value={`${latencyMs} ms`} />}
      {healCount > 0 && <Stat label="Self-heals" value={healCount} />}
    </div>
  )
}
