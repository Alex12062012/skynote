export default function CoursesLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-32 rounded-input bg-sky-cloud dark:bg-night-border" />
        <div className="h-9 w-36 rounded-pill bg-sky-cloud dark:bg-night-border" />
      </div>

      {/* Grid de cours */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-44 rounded-card bg-sky-cloud dark:bg-night-border" />
        ))}
      </div>
    </div>
  )
}
