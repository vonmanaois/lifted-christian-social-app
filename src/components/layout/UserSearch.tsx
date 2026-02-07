"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type UserResult = {
  id: string;
  username?: string | null;
  name?: string | null;
  image?: string | null;
};

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedQuery(query);
    }, 350);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const run = async () => {
      if (debouncedQuery.trim().length < 2) {
        setResults([]);
        return;
      }

      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(debouncedQuery)}`
      );
      if (!response.ok) return;
      const data = (await response.json()) as UserResult[];
      setResults(data);
    };

    run();
  }, [debouncedQuery]);

  return (
    <div className="relative">
      <input
        className="soft-input text-sm w-full"
        placeholder="Search people..."
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
      />

      {isOpen && results.length > 0 && (
        <div className="absolute z-20 mt-2 w-full panel p-3 flex flex-col gap-2">
          {results.map((user) => (
            <Link
              key={user.id}
              href={user.username ? `/profile/${user.username}` : "/profile"}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[color:var(--surface-strong)]"
            >
              <div className="h-7 w-7 rounded-full bg-slate-200 overflow-hidden">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="text-sm leading-tight">
                <p className="text-[color:var(--ink)] font-semibold text-sm">
                  {user.name ?? "User"}
                </p>
                {user.username && (
                  <p className="text-xs text-[color:var(--subtle)]">@{user.username}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
