export default function PollDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 bg-background/95 border-b border-border">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="w-16 h-4 bg-muted rounded animate-pulse" />
          <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="h-48 w-full bg-muted animate-pulse" />
      <div className="px-4 -mt-16 relative z-10 space-y-3">
        <div className="w-16 h-6 bg-muted rounded animate-pulse" />
        <div className="w-3/4 h-6 bg-muted rounded animate-pulse" />
        <div className="w-1/2 h-4 bg-muted rounded animate-pulse" />
      </div>

      {/* Content skeleton */}
      <div className="px-4 mt-8 space-y-4">
        <div className="h-32 bg-muted rounded-xl animate-pulse" />
        <div className="h-24 bg-muted rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
