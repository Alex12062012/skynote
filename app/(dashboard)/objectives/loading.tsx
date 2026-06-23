export default function ObjectivesLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse">
      {/* Header */}
      <div className="mb-6 h-8 w-40 rounded-input bg-sky-cloud dark:bg-night-border" />

      {/* Objectifs */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="rounded-card border border-sky-border bg-sky-surface p-4 dark:border-night-border dark:bg-night-surface">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-sky-cloud dark:bg-night-border" />
                <div className="space-y-1.5">
                  <div className="h-4 w-40 rounded bg-sky-cloud dark:bg-night-border" />
                  <div className="h-3 w-24 rounded bg-sky-cloud dark:bg-night-border" />
                </div>
              </div>
              <div className="h-6 w-16 rounded-pill bg-sky-cloud dark:bg-night-border" />
            </div>
            <div className="h-2 w-full rounded-full bg-sky-cloud dark:bg-night-border" />
          </div>
        ))}
      </div>
    </div>
  )
}
