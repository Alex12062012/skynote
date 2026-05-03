export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse">
      {/* Avatar + nom */}
      <div className="mb-8 flex items-center gap-4">
        <div className="h-20 w-20 rounded-full bg-sky-cloud dark:bg-night-border" />
        <div className="space-y-2">
          <div className="h-6 w-40 rounded-input bg-sky-cloud dark:bg-night-border" />
          <div className="h-4 w-24 rounded-input bg-sky-cloud dark:bg-night-border" />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-card bg-sky-cloud dark:bg-night-border" />
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-28 rounded-card bg-sky-cloud dark:bg-night-border" />
        ))}
      </div>
    </div>
  )
}
