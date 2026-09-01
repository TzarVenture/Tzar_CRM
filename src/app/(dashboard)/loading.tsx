export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6 p-2">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-slate-200 rounded-xl" />
          <div className="h-4 w-96 bg-slate-100 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-slate-200 rounded-xl" />
          <div className="h-10 w-28 bg-slate-200 rounded-xl" />
        </div>
      </div>

      {/* Grid Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-44 bg-slate-200/80 rounded-2xl border border-slate-200" />
        <div className="h-44 bg-slate-200/80 rounded-2xl border border-slate-200" />
        <div className="h-44 bg-slate-200/80 rounded-2xl border border-slate-200" />
      </div>

      {/* Main Table Skeleton */}
      <div className="h-96 bg-slate-100 rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="h-8 w-full bg-slate-200/70 rounded-xl" />
        <div className="h-8 w-full bg-slate-200/50 rounded-xl" />
        <div className="h-8 w-full bg-slate-200/50 rounded-xl" />
        <div className="h-8 w-full bg-slate-200/50 rounded-xl" />
        <div className="h-8 w-full bg-slate-200/50 rounded-xl" />
      </div>
    </div>
  );
}
