export default function EvalLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse">
      {/* Header */}
      <div className="mb-2 h-5 w-24 rounded bg-sky-cloud dark:bg-night-border" />
      <div className="mb-6 h-8 w-56 rounded-input bg-sky-cloud dark:bg-night-border" />

      {/* Timeline */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="h-12 w-12 flex-shrink-0 rounded-full bg-sky-cloud dark:bg-night-border" />
            <div className="flex-1 rounded-card bg-sky-cloud dark:bg-night-border" />
          </div>
        ))}
      </div>
    </div>
  )
}
