"use client";

import { useEffect, useState } from "react";

type ProfileStatsProps = {
  initialPrayedCount: number;
  initialFollowersCount: number;
  initialFollowingCount: number;
  usernameParam?: string | null;
};

type ProfilePayload = {
  followersCount?: number;
  followingCount?: number;
};

export default function ProfileStats({
  initialPrayedCount,
  initialFollowersCount,
  initialFollowingCount,
  usernameParam,
}: ProfileStatsProps) {
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [followingCount, setFollowingCount] = useState(initialFollowingCount);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const query = usernameParam ? `?username=${usernameParam}` : "";
        const response = await fetch(`/api/user/profile${query}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as ProfilePayload;
        if (typeof data.followersCount === "number") {
          setFollowersCount(data.followersCount);
        }
        if (typeof data.followingCount === "number") {
          setFollowingCount(data.followingCount);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    const listener = (event: Event) => {
      const detail = (event as CustomEvent<{ followersCount?: number }>).detail;
      if (typeof detail?.followersCount === "number") {
        setFollowersCount(detail.followersCount);
      }
    };

    window.addEventListener("follow:updated", listener);
    loadStats();

    return () => window.removeEventListener("follow:updated", listener);
  }, [usernameParam]);

  return (
    <div className="mt-6 flex flex-wrap gap-6 text-sm text-[color:var(--subtle)]">
      <div className="flex flex-col">
        <span>Prayers lifted</span>
        <span className="text-lg font-semibold text-[color:var(--ink)]">
          {initialPrayedCount}
        </span>
      </div>
      <div className="flex flex-col">
        <span>Followers</span>
        {isLoading ? (
          <span className="mt-2 h-4 w-10 bg-slate-200 rounded-full animate-pulse" />
        ) : (
          <span className="text-lg font-semibold text-[color:var(--ink)]">
            {followersCount}
          </span>
        )}
      </div>
      <div className="flex flex-col">
        <span>Following</span>
        {isLoading ? (
          <span className="mt-2 h-4 w-10 bg-slate-200 rounded-full animate-pulse" />
        ) : (
          <span className="text-lg font-semibold text-[color:var(--ink)]">
            {followingCount}
          </span>
        )}
      </div>
    </div>
  );
}
