"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

type FollowButtonProps = {
  targetUserId: string;
  initialFollowing: boolean;
};

export default function FollowButton({
  targetUserId,
  initialFollowing,
}: FollowButtonProps) {
  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleFollow = async () => {
    if (!session?.user?.id) {
      return;
    }

    const previousFollowing = isFollowing;
    setIsUpdating(true);
    setIsFollowing((prev) => !prev);

    try {
      const response = await fetch("/api/user/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId }),
      });

      const data = (await response.json().catch(() => null)) as {
        following: boolean;
        followersCount?: number;
        error?: string;
      } | null;

      if (!response.ok) {
        console.error(
          "Failed to update follow status",
          response.status,
          data?.error
        );
        setIsFollowing(previousFollowing);
        return;
      }

      if (!data) return;
      setIsFollowing(data.following);
      if (typeof data.followersCount === "number") {
        window.dispatchEvent(
          new CustomEvent("follow:updated", {
            detail: { followersCount: data.followersCount },
          })
        );
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("notifications:refresh"));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!session?.user?.id) return null;

  return (
    <button
      type="button"
      onClick={handleFollow}
      disabled={isUpdating}
      className={`post-button w-full sm:w-auto cursor-pointer ${
        isFollowing
          ? "bg-transparent border border-[color:var(--panel-border)] text-[color:var(--ink)]"
          : "bg-[color:var(--accent)] text-[color:var(--accent-contrast)]"
      }`}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
