export default function QcmLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse">
      <div className="mb-6 h-5 w-24 rounded bg-sky-cloud dark:bg-night-border" />
      <div className="mb-4 h-7 w-48 rounded-input bg-sky-cloud dark:bg-night-border" />
      <div className="space-y-3">
        <div className="h-24 rounded-card bg-sky-cloud dark:bg-night-border" />
        <div className="h-14 rounded-card-sm bg-sky-cloud dark:bg-night-border" />
        <div className="h-14 rounded-card-sm bg-sky-cloud dark:bg-night-border" />
        <div className="h-14 rounded-card-sm bg-sky-cloud dark:bg-night-border" />
        <div className="h-14 rounded-card-sm bg-sky-cloud dark:bg-night-border" />
      </div>
      <div className="mt-6 h-12 rounded-input bg-sky-cloud dark:bg-night-border" />
    </div>
  )
}
