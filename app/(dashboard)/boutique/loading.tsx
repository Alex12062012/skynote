export default function BoutiqueLoading() {
  return (
    <div className="mx-auto max-w-3xl animate-pulse">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-36 rounded-input bg-sky-cloud dark:bg-night-border" />
        <div className="h-9 w-24 rounded-pill bg-sky-cloud dark:bg-night-border" />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-24 rounded-pill bg-sky-cloud dark:bg-night-border" />
        ))}
      </div>

      {/* Grid d'items */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-card bg-sky-cloud dark:bg-night-border" />
        ))}
      </div>
    </div>
  )
}
