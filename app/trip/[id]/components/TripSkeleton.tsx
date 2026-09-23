const bar = "animate-pulse rounded-full bg-surface-2";

export function TripSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-24 pt-12" aria-busy="true" aria-label="Loading your trip">
      <div className={`${bar} h-3 w-56`} />
      <div className={`${bar} mt-5 h-12 w-full max-w-xl`} />
      <div className={`${bar} mt-3 h-4 w-full max-w-lg`} />
      <div className="mt-8 flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${bar} h-10 w-32`} />
        ))}
      </div>
      <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-hairline bg-surface/60 p-5">
              <div className="flex items-center gap-4">
                <div className="size-12 animate-pulse rounded-2xl bg-surface-2" />
                <div className="flex-1 space-y-2">
                  <div className={`${bar} h-3 w-32`} />
                  <div className={`${bar} h-5 w-64 max-w-full`} />
                </div>
              </div>
              {i === 0 &&
                [0, 1, 2].map((j) => (
                  <div key={j} className="mt-5 flex gap-4 pl-2">
                    <div className={`${bar} h-4 w-10`} />
                    <div className="size-8 animate-pulse rounded-full bg-surface-2" />
                    <div className="h-20 flex-1 animate-pulse rounded-2xl bg-surface-2/60" />
                  </div>
                ))}
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <div className="h-80 animate-pulse rounded-3xl bg-surface-2/60" />
          <div className="h-64 animate-pulse rounded-3xl bg-surface-2/60" />
        </div>
      </div>
    </div>
  );
}
