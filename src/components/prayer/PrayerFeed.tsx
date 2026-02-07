"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import PrayerCard, { type Prayer } from "@/components/prayer/PrayerCard";

type PrayerFeedProps = {
  refreshKey: number;
  userId?: string;
};

export default function PrayerFeed({ refreshKey, userId }: PrayerFeedProps) {
  const {
    data,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["prayers", userId, refreshKey],
    queryFn: async ({ pageParam }: { pageParam?: string | null }) => {
      const params = new URLSearchParams();
      if (userId) params.set("userId", userId);
      if (pageParam) params.set("cursor", pageParam);
      params.set("limit", "20");

      const response = await fetch(`/api/prayers?${params.toString()}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Failed to load prayers");
      }
      const data = (await response.json()) as {
        items: Prayer[];
        nextCursor?: string | null;
      };
      const items = data.items.map((prayer) => ({
        ...prayer,
        _id:
          typeof prayer._id === "string"
            ? prayer._id
            : String((prayer._id as { $oid?: string })?.$oid ?? prayer._id),
        prayedBy: Array.isArray(prayer.prayedBy)
          ? prayer.prayedBy.map((id) => String(id))
          : [],
        userId: prayer.userId ? String(prayer.userId) : null,
      }));
      return { items, nextCursor: data.nextCursor ?? null };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null,
    staleTime: 10000,
    refetchOnWindowFocus: true,
  });

  const prayers = data?.pages.flatMap((page) => page.items) ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="wall-card">
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-full bg-slate-200 animate-pulse" />
              <div className="flex-1">
                <div className="h-3 w-32 bg-slate-200 rounded-full animate-pulse" />
                <div className="mt-2 h-3 w-24 bg-slate-200 rounded-full animate-pulse" />
                <div className="mt-4 h-3 w-full bg-slate-200 rounded-full animate-pulse" />
                <div className="mt-2 h-3 w-5/6 bg-slate-200 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (prayers.length === 0) {
    return (
      <div className="panel p-6 text-sm text-[color:var(--subtle)]">
        <p className="text-[color:var(--ink)] font-semibold">
          No prayers yet.
        </p>
        <p className="mt-1">Be the first to share something uplifting.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {isFetching && (
        <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-[color:var(--surface-strong)]">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-[color:var(--accent)]/70" />
        </div>
      )}
      {prayers.map((prayer) => (
        <PrayerCard key={prayer._id} prayer={prayer} />
      ))}
      {hasNextPage && (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mt-4 post-button bg-transparent border border-[color:var(--panel-border)] text-[color:var(--ink)]"
        >
          {isFetchingNextPage ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
