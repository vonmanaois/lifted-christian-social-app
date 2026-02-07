"use client";

import { useRouter } from "next/navigation";

type PostBackHeaderProps = {
  label: string;
};

export default function PostBackHeader({ label }: PostBackHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-3 flex items-center justify-between px-2">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center justify-center h-11 w-11 rounded-full text-[color:var(--ink)] hover:text-[color:var(--accent)]"
        aria-label="Back"
      >
        <span className="text-xl font-semibold">⟵</span>
      </button>
      <span className="text-sm font-semibold text-[color:var(--ink)]">
        {label}
      </span>
      <span className="h-11 w-11" aria-hidden="true" />
    </div>
  );
}
