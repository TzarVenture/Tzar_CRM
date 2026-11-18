export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6 p-2">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-border rounded-xl" />
          <div className="h-4 w-96 bg-muted rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-border rounded-xl" />
          <div className="h-10 w-28 bg-border rounded-xl" />
        </div>
      </div>

      {/* Grid Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-44 bg-border rounded-2xl border border-border" />
        <div className="h-44 bg-border rounded-2xl border border-border" />
        <div className="h-44 bg-border rounded-2xl border border-border" />
      </div>

      {/* Main Table Skeleton */}
      <div className="h-96 bg-muted rounded-2xl border border-border p-6 space-y-4">
        <div className="h-8 w-full bg-border rounded-xl" />
        <div className="h-8 w-full bg-border rounded-xl" />
        <div className="h-8 w-full bg-border rounded-xl" />
        <div className="h-8 w-full bg-border rounded-xl" />
        <div className="h-8 w-full bg-border rounded-xl" />
      </div>
    </div>
  );
}
