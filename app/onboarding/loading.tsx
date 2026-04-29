export default function OnboardingLoading() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-8">
      <div className="panel w-full p-6 md:p-8">
        <div className="skeleton skeleton-soft h-12 w-12 rounded-2xl" />
        <div className="mt-6 skeleton skeleton-soft h-2 w-full rounded-full" />
        <div className="mt-6 skeleton skeleton-soft h-4 w-24" />
        <div className="mt-3 skeleton skeleton-soft h-10 w-72" />
        <div className="mt-3 skeleton skeleton-soft h-5 w-full" />
        <div className="mt-2 skeleton skeleton-soft h-5 w-5/6" />
        <div className="mt-8 space-y-3">
          <div className="skeleton h-[60px] rounded-[20px]" />
          <div className="skeleton h-[60px] rounded-[20px]" />
          <div className="skeleton h-[60px] rounded-[20px]" />
        </div>
      </div>
    </div>
  )
}
