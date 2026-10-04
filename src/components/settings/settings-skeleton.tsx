function SkeletonBar(props: { className: string }) {
  return (
    <span className={`block animate-pulse rounded-sm bg-background-focus ${props.className}`} />
  );
}

function SkeletonGroup(props: { rows: number; titleWidth: string }) {
  return (
    <section className="flex flex-col gap-2.5" aria-hidden="true">
      <SkeletonBar className={`h-4 ${props.titleWidth}`} />
      <div className="flex flex-col gap-2">
        {Array.from({ length: props.rows }, (_, index) => (
          <div
            key={index}
            className="flex h-10 items-center justify-between rounded-sm bg-background-card px-2.5">
            <SkeletonBar className={`h-3.5 ${index % 2 === 0 ? "w-28" : "w-36"}`} />
            <SkeletonBar className="h-3 w-16" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function SettingsSkeleton() {
  return (
    <div
      className="flex w-full flex-col gap-7"
      role="status"
      aria-label="Loading settings">
      <span className="sr-only">Loading settings...</span>
      <div className="flex h-14 items-center gap-3 rounded-sm bg-background-card px-3">
        <SkeletonBar className="h-9 w-9 rounded-full" />
        <div className="flex flex-col gap-2">
          <SkeletonBar className="h-4 w-28" />
          <SkeletonBar className="h-3 w-40" />
        </div>
      </div>
      <SkeletonGroup rows={2} titleWidth="w-16" />
      <SkeletonGroup rows={3} titleWidth="w-28" />
      <SkeletonGroup rows={3} titleWidth="w-16" />
      <SkeletonGroup rows={2} titleWidth="w-20" />
    </div>
  );
}
