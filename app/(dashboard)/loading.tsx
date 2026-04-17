export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8 flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-input bg-sky-cloud dark:bg-night-border" />
          <div className="h-4 w-32 rounded-input bg-sky-cloud dark:bg-night-border" />
        </div>
        <div className="h-10 w-36 rounded-input bg-sky-cloud dark:bg-night-border" />
      </div>

      {/* Stats bar skeleton */}
      <div className="mb-8 flex gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 flex-1 rounded-card bg-sky-cloud dark:bg-night-border" />
        ))}
      </div>

      {/* Cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-card bg-sky-cloud dark:bg-night-border" />
        ))}
      </div>
    </div>
  )
}
