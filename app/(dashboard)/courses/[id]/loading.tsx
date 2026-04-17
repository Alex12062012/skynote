export default function CourseLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse">
      <div className="mb-6 h-5 w-24 rounded bg-sky-cloud dark:bg-night-border" />
      <div className="mb-8 space-y-3">
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-pill bg-sky-cloud dark:bg-night-border" />
          <div className="h-6 w-16 rounded bg-sky-cloud dark:bg-night-border" />
        </div>
        <div className="h-8 w-3/4 rounded-input bg-sky-cloud dark:bg-night-border" />
      </div>
      <div className="h-20 rounded-card bg-sky-cloud dark:bg-night-border mb-6" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-card bg-sky-cloud dark:bg-night-border" />
        ))}
      </div>
    </div>
  )
}
