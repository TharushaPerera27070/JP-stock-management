type SkeletonProps = {
  label?: string;
  compact?: boolean;
};

const Block = ({ className }: { className: string }) => (
  <div className={`rounded bg-gray-200 ${className}`} />
);

export function DataPageSkeleton({
  label = "Loading data",
  compact = false,
}: SkeletonProps) {
  return (
    <div
      className={`mx-auto w-full animate-pulse space-y-6 ${compact ? "max-w-5xl" : "max-w-7xl"}`}
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <Block className="h-7 w-48" />
          <Block className="h-4 w-72 max-w-full bg-gray-100" />
        </div>
        <Block className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <Block className="h-4 w-24" />
              <Block className="h-9 w-9 rounded-lg bg-gray-100" />
            </div>
            <Block className="mt-4 h-7 w-32" />
            <Block className="mt-2 h-3 w-24 bg-gray-100" />
          </div>
        ))}
      </div>
      <TableSkeleton label={label} />
      <span className="sr-only">{label}...</span>
    </div>
  );
}

export function TableSkeleton({ label = "Loading records" }: SkeletonProps) {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <div className="flex items-center justify-between border-b border-gray-200 p-5">
        <Block className="h-5 w-40" />
        <Block className="h-9 w-28 bg-gray-100" />
      </div>
      <div className="space-y-1 p-5">
        <Block className="mb-3 h-9 w-full bg-gray-100" />
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="grid grid-cols-6 gap-3 py-3">
            <Block className="h-4" />
            <Block className="col-span-2 h-4 bg-gray-100" />
            <Block className="h-4" />
            <Block className="h-4 bg-gray-100" />
            <Block className="h-4" />
          </div>
        ))}
      </div>
      <span className="sr-only">{label}...</span>
    </div>
  );
}

export function FormPageSkeleton({ label = "Loading document" }: SkeletonProps) {
  return (
    <div
      className="w-full animate-pulse py-2"
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <Block className="h-7 w-52" />
            <Block className="h-4 w-64 bg-gray-100" />
          </div>
          <Block className="h-10 w-32" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="space-y-2">
                  <Block className="h-3 w-24" />
                  <Block className="h-11 w-full bg-gray-100" />
                </div>
              ))}
            </div>
            <Block className="h-10 w-full" />
            {[0, 1, 2].map((item) => (
              <div key={item} className="grid grid-cols-5 gap-3">
                <Block className="col-span-2 h-11 bg-gray-100" />
                <Block className="h-11 bg-gray-100" />
                <Block className="h-11 bg-gray-100" />
                <Block className="h-11 bg-gray-100" />
              </div>
            ))}
          </div>
          <div className="h-80 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <Block className="h-5 w-28" />
            <Block className="mt-6 h-48 w-full bg-gray-100" />
          </div>
        </div>
      </div>
      <span className="sr-only">{label}...</span>
    </div>
  );
}
