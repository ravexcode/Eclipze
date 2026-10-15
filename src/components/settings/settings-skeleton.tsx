function SkeletonBar(props: { className: string }) {
  return (
    <span className={`block animate-pulse rounded-md bg-background-focus ${props.className}`} />
  );
}

function SkeletonRow(props: { titleWidth: string }) {
  return (
    <div className="flex min-h-13 items-center gap-3 rounded-lg border border-background-focus bg-background-card px-3 py-2.5">
      <SkeletonBar className="h-8 w-8" />
      <div className="flex flex-1 flex-col gap-1.5">
        <SkeletonBar className={`h-3 ${props.titleWidth}`} />
        <SkeletonBar className="h-2.5 w-44" />
      </div>
      <SkeletonBar className="h-3 w-16" />
    </div>
  );
}

function SkeletonGroup(props: { rows: number; titleWidth: string }) {
  return (
    <section className="flex flex-col gap-3" aria-hidden="true">
      <div className="flex flex-col gap-1.5">
        <SkeletonBar className={`h-4 ${props.titleWidth}`} />
        <SkeletonBar className="h-3 w-64" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: props.rows }, (_, index) => (
          <SkeletonRow
            key={index}
            titleWidth={index % 2 === 0 ? "w-24" : "w-32"} />
        ))}
      </div>
    </section>
  );
}

export default function SettingsSkeleton() {
  return (
    <div
      className="flex w-full flex-col gap-10"
      role="status"
      aria-label="Loading settings">
      <span className="sr-only">Loading settings...</span>
      <section className="flex flex-col gap-3" aria-hidden="true">
        <div className="flex flex-col gap-1.5">
          <SkeletonBar className="h-4 w-16" />
          <SkeletonBar className="h-3 w-48" />
        </div>
        <div className="flex min-h-16 items-center gap-3 rounded-lg border border-background-focus bg-background-card px-3 py-2.5">
          <SkeletonBar className="h-10 w-10 rounded-full" />
          <div className="flex flex-col gap-2">
            <SkeletonBar className="h-3.5 w-28" />
            <SkeletonBar className="h-3 w-40" />
          </div>
        </div>
      </section>
      <SkeletonGroup rows={2} titleWidth="w-16" />
      <SkeletonGroup rows={4} titleWidth="w-28" />
      <SkeletonGroup rows={2} titleWidth="w-20" />
      <SkeletonGroup rows={2} titleWidth="w-24" />
    </div>
  );
}
