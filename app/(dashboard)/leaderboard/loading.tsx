export default function LeaderboardLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse">
      {/* Header */}
      <div className="mb-6 h-8 w-48 rounded-input bg-sky-cloud dark:bg-night-border" />

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-28 rounded-pill bg-sky-cloud dark:bg-night-border" />
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-card border border-sky-border px-4 py-3 dark:border-night-border">
            <div className="h-5 w-5 rounded bg-sky-cloud dark:bg-night-border" />
            <div className="h-8 w-8 rounded-full bg-sky-cloud dark:bg-night-border" />
            <div className="flex-1">
              <div className="h-4 w-32 rounded bg-sky-cloud dark:bg-night-border" />
            </div>
            <div className="h-4 w-16 rounded bg-sky-cloud dark:bg-night-border" />
          </div>
        ))}
      </div>
    </div>
  )
}
