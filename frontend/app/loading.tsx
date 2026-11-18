export default function GlobalLoading() {
  return (
    <div
      className="min-h-screen pt-24 pb-20 bg-[#f5f4ee] px-4 sm:px-6 lg:px-8"
      role="status"
      aria-label="Loading PlayNova page"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        <div className="h-44 rounded-3xl bg-[#0c2f35]/10 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-black/5 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

