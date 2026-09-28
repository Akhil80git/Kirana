import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/80 shadow-sm flex flex-col p-4 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-start justify-between gap-3 pb-3">
        <div className="flex items-start gap-2.5 flex-1">
          {/* Checkbox Skeleton */}
          <div className="w-5 h-5 rounded-md bg-zinc-800 shrink-0 mt-0.5" />

          <div className="space-y-2 flex-1">
            {/* Tag & Date row skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-14 bg-zinc-800 rounded" />
              <div className="h-3 w-20 bg-zinc-800/80 rounded" />
            </div>
            {/* Title skeleton */}
            <div className="h-4 w-3/4 bg-zinc-800 rounded" />
          </div>
        </div>

        {/* Menu button skeleton */}
        <div className="w-5 h-5 rounded bg-zinc-800 shrink-0" />
      </div>

      {/* Progress bar skeleton */}
      <div className="w-full bg-zinc-800/60 rounded-full h-1 my-2" />

      {/* Items list skeleton */}
      <div className="space-y-2 py-2 flex-1">
        <div className="h-9 bg-zinc-950/80 border border-zinc-800/60 rounded-xl flex items-center justify-between px-3">
          <div className="flex items-center gap-2 w-1/2">
            <div className="w-4 h-4 rounded bg-zinc-800 shrink-0" />
            <div className="h-3 w-full bg-zinc-800 rounded" />
          </div>
          <div className="h-3 w-12 bg-zinc-800 rounded" />
        </div>

        <div className="h-9 bg-zinc-950/80 border border-zinc-800/60 rounded-xl flex items-center justify-between px-3">
          <div className="flex items-center gap-2 w-2/3">
            <div className="w-4 h-4 rounded bg-zinc-800 shrink-0" />
            <div className="h-3 w-full bg-zinc-800 rounded" />
          </div>
          <div className="h-3 w-10 bg-zinc-800 rounded" />
        </div>

        <div className="h-9 bg-zinc-950/80 border border-zinc-800/60 rounded-xl flex items-center justify-between px-3">
          <div className="flex items-center gap-2 w-1/3">
            <div className="w-4 h-4 rounded bg-zinc-800 shrink-0" />
            <div className="h-3 w-full bg-zinc-800 rounded" />
          </div>
          <div className="h-3 w-14 bg-zinc-800 rounded" />
        </div>
      </div>

      {/* Bottom bar skeleton */}
      <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between">
        <div className="h-3.5 w-24 bg-zinc-800 rounded" />
        <div className="h-4 w-16 bg-zinc-800 rounded" />
      </div>
    </div>
  );
};
