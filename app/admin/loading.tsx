function AdminLoadingCard({ height }: { height: string }) {
  return <div className={`skeleton rounded-[2rem] ${height}`} />
}

export default function AdminLoading() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminLoadingCard height="h-32" />
        <AdminLoadingCard height="h-32" />
        <AdminLoadingCard height="h-32" />
        <AdminLoadingCard height="h-32" />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <AdminLoadingCard height="h-72" />
        <AdminLoadingCard height="h-72" />
      </div>
    </div>
  )
}
