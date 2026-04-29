export default function ProfileLoading() {
  return (
    <div className="space-y-4">
      <section className="panel overflow-hidden border-none bg-gradient-to-br from-[#2b2b31] to-[#1b1b20] p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="skeleton h-12 w-12 rounded-full" />
          <div className="min-w-0 flex-1">
            <div className="skeleton skeleton-soft h-7 w-40" />
            <div className="mt-2 flex gap-3">
              <div className="skeleton skeleton-soft h-4 w-24" />
              <div className="skeleton skeleton-soft h-4 w-28" />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="rounded-[16px] bg-white/[0.04] p-3">
              <div className="skeleton skeleton-soft h-3 w-14" />
              <div className="mt-3 skeleton skeleton-soft h-6 w-10" />
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="skeleton skeleton-soft h-4 w-24" />
            <div className="mt-2 skeleton skeleton-soft h-6 w-20" />
          </div>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className="skeleton h-2 w-2 rounded-[1px]" />
            ))}
          </div>
        </div>
        <div className="mt-4 skeleton h-[100px] rounded-[16px]" />
      </section>

      <section className="panel overflow-hidden p-2">
        <div className="space-y-0.5">
          <div className="rounded-[16px] border border-white/[0.04] bg-white/[0.02] px-3 py-3">
            <div className="skeleton skeleton-soft h-4 w-28" />
            <div className="mt-3 skeleton skeleton-soft h-4 w-64 max-w-full" />
            <div className="mt-3 skeleton h-11 rounded-[14px]" />
          </div>
          <div className="px-3 py-3">
            <div className="skeleton skeleton-soft h-5 w-full" />
          </div>
          <div className="px-3 py-3">
            <div className="skeleton skeleton-soft h-5 w-44" />
          </div>
          <div className="px-3 py-3">
            <div className="skeleton skeleton-soft h-5 w-24" />
          </div>
        </div>
      </section>
    </div>
  )
}
