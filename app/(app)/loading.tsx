function AppLoadingCard({ height }: { height: string }) {
  return <div className={`skeleton rounded-[2rem] ${height}`} />
}

export default function AppLoading() {
  return (
    <div className="space-y-5">
      <AppLoadingCard height="h-28" />
      <div className="grid gap-5 md:grid-cols-2">
        <AppLoadingCard height="h-56" />
        <AppLoadingCard height="h-56" />
      </div>
      <AppLoadingCard height="h-64" />
    </div>
  )
}
