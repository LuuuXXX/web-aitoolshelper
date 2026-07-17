export default function Loading() {
  return (
    <div className="flex-1 pt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-40 rounded" style={{ background: 'var(--card-border)' }} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card h-28" />
            ))}
          </div>
          <div className="card h-40" />
        </div>
      </div>
    </div>
  )
}
