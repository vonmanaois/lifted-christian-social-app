"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { signIn, signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import {
  BellSimple,
  GoogleLogo,
  House,
  MagnifyingGlass,
  Plus,
  SlidersHorizontal,
  User,
} from "@phosphor-icons/react";
import Modal from "@/components/layout/Modal";
import ThemeToggle from "@/components/layout/ThemeToggle";
import UserSearch from "@/components/layout/UserSearch";

export default function Sidebar() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [showThemes, setShowThemes] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const prefsRef = useRef<HTMLDivElement | null>(null);
  const prefsButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobilePrefsButtonRef = useRef<HTMLButtonElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const openNotifications = () => {
    if (!isAuthenticated) {
      setShowSignIn(true);
      return;
    }
    router.push("/notifications");
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated) return;
      try {
        const response = await fetch("/api/user/profile", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { username?: string | null };
        if (typeof data.username === "string") {
          setProfileUsername(data.username);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadProfile();
  }, [isAuthenticated]);

  useEffect(() => {
    const handleOpenSignIn = () => setShowSignIn(true);
    window.addEventListener("open-signin", handleOpenSignIn);
    return () => window.removeEventListener("open-signin", handleOpenSignIn);
  }, []);

  useEffect(() => {
    if (!showThemes) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!prefsRef.current) return;
      if (
        prefsButtonRef.current?.contains(event.target as Node) ||
        mobilePrefsButtonRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      if (!prefsRef.current.contains(event.target as Node)) {
        setShowThemes(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showThemes]);

  return (
    <>
      <div className="lg:hidden sticky top-0 z-40 bg-[color:var(--panel)]/95 backdrop-blur">
        <div className="relative flex items-center justify-center px-4 py-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#2d6cdf] to-[#9b6cff]" />
            <span className="text-base font-semibold text-[color:var(--ink)]">
              Lifted
            </span>
          </button>
          <button
            type="button"
            ref={mobilePrefsButtonRef}
            onClick={() => setShowThemes((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl bg-[color:var(--panel)] text-[color:var(--ink)] hover:text-[color:var(--accent)]"
            aria-label="Preferences"
          >
            <SlidersHorizontal size={20} weight="regular" />
          </button>
        </div>
        {showThemes && (
          <div ref={prefsRef} className="px-4 pb-4">
            <div className="panel p-4 flex flex-col gap-4">
              <ThemeToggle />
              <div className="mt-2 border-t border-slate-200 pt-4">
                {isAuthenticated ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--ink)]">
                        {session.user?.name ?? "Signed in"}
                      </p>
                      <p className="text-xs text-[color:var(--subtle)]">
                        {session.user?.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => signOut()}
                      className="pill-button border border-slate-200 text-[color:var(--ink)] cursor-pointer"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => signIn("google")}
                    className="pill-button bg-slate-900 text-white cursor-pointer inline-flex items-center gap-2"
                  >
                    <GoogleLogo size={16} weight="regular" />
                    Sign in
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <aside className="hidden lg:flex p-5 flex-col gap-5 h-fit items-center text-center lg:items-start lg:text-left bg-transparent border-none shadow-none">
      <button
        type="button"
        onClick={() => router.push("/")}
        className="flex items-center gap-3 text-left cursor-pointer"
      >
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#2d6cdf] to-[#9b6cff]" />
        <div className="hidden md:block">
          <p className="text-sm font-semibold text-[color:var(--ink)]">Lifted</p>
          <p className="text-xs text-[color:var(--subtle)]">Prayer Wall</p>
        </div>
      </button>

      <div className="hidden lg:block w-full">
        <UserSearch />
      </div>

      <button
        type="button"
        onClick={() => router.push("/search")}
        className="lg:hidden h-10 w-10 rounded-2xl bg-[color:var(--panel)] flex items-center justify-center text-[color:var(--ink)] hover:text-[color:var(--accent)] cursor-pointer"
        aria-label="Search people"
      >
        <MagnifyingGlass size={22} weight="regular" />
      </button>

      <div className="flex flex-col gap-3 text-base text-[color:var(--ink)]">
        <button
          type="button"
          className="flex items-center gap-3 cursor-pointer text-[color:var(--ink)] hover:text-[color:var(--accent)]"
          onClick={() => {
            if (pathname !== "/") {
              router.push("/");
            }
            queryClient.invalidateQueries({ queryKey: ["prayers"] });
            queryClient.invalidateQueries({ queryKey: ["words"] });
          }}
        >
          <span className="h-10 w-10 rounded-2xl bg-[color:var(--panel)] flex items-center justify-center">
            <House size={22} weight="regular" />
          </span>
          <span className="hidden lg:inline">Home</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-3 cursor-pointer text-[color:var(--ink)] hover:text-[color:var(--accent)]"
          onClick={() => {
            if (isAuthenticated) {
              if (profileUsername) {
                router.push(`/profile/${profileUsername}`);
              } else {
                router.push("/profile");
              }
            } else {
              setShowSignIn(true);
            }
          }}
        >
          <span className="h-10 w-10 rounded-2xl bg-[color:var(--panel)] flex items-center justify-center">
            <User size={22} weight="regular" />
          </span>
          <span className="hidden lg:inline">Profile</span>
        </button>
      <button
        type="button"
        onClick={() => {
          if (!isAuthenticated) {
            setShowSignIn(true);
            return;
          }
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("open-prayer-composer"));
          }
        }}
        className="flex items-center gap-3 cursor-pointer text-[color:var(--ink)] hover:text-[color:var(--accent)]"
      >
          <span className="h-10 w-10 rounded-2xl bg-[color:var(--accent)] text-[color:var(--accent-contrast)] flex items-center justify-center">
            <Plus size={22} weight="regular" />
          </span>
          <span className="hidden lg:inline">Add a Prayer</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-3 cursor-pointer text-[color:var(--ink)] hover:text-[color:var(--accent)]"
          aria-label="Notifications"
          onClick={openNotifications}
        >
          <span className="h-10 w-10 rounded-2xl bg-[color:var(--panel)] flex items-center justify-center">
            <BellSimple size={22} weight="regular" />
          </span>
          <span className="hidden lg:inline">Notifications</span>
        </button>
        <button
          type="button"
          ref={prefsButtonRef}
          className="flex items-center gap-3 cursor-pointer text-[color:var(--ink)] hover:text-[color:var(--accent)]"
          onClick={() => {
            if (showThemes) {
              setShowThemes(false);
              return;
            }
            setShowThemes(true);
          }}
        >
          <span className="h-10 w-10 rounded-2xl bg-[color:var(--panel)] flex items-center justify-center">
            <SlidersHorizontal size={22} weight="regular" />
          </span>
          <span className="hidden lg:inline">Preferences</span>
        </button>
      </div>

      {showThemes && (
        <div
          ref={prefsRef}
          className="hidden lg:block mt-2 pref-animate"
        >
        <div className="panel p-4 flex flex-col gap-4 ml-6">
          <ThemeToggle />
          <div className="mt-2 border-t border-slate-200 pt-4">
            {isAuthenticated ? (
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--ink)]">
                    {session.user?.name ?? "Signed in"}
                  </p>
                  <p className="text-xs text-[color:var(--subtle)]">
                    {session.user?.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="pill-button border border-slate-200 text-[color:var(--ink)] cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => signIn("google")}
                className="pill-button bg-slate-900 text-white cursor-pointer inline-flex items-center gap-2"
              >
                <GoogleLogo size={16} weight="regular" />
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
      )}

      <Modal
        title="Sign in"
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
      >
        <p className="text-sm text-[color:var(--subtle)]">
          Sign in with Google to create a profile and post prayers.
        </p>
        <button
          type="button"
        onClick={() => signIn("google")}
        className="mt-4 pill-button bg-slate-900 text-white cursor-pointer inline-flex items-center gap-2"
      >
        <GoogleLogo size={16} weight="regular" />
        Continue with Google
      </button>
      </Modal>

      </aside>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[color:var(--panel-border)] bg-[color:var(--panel)]/95 backdrop-blur">
        <div className="flex items-center justify-around px-5 py-4 text-[color:var(--ink)]">
          <button
            type="button"
            className="flex flex-col items-center gap-1 text-[color:var(--ink)] hover:text-[color:var(--accent)]"
            onClick={() => router.push("/")}
          >
            <House size={24} weight="regular" />
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-1 text-[color:var(--ink)] hover:text-[color:var(--accent)]"
            onClick={() => {
              if (isAuthenticated) {
                if (profileUsername) {
                  router.push(`/profile/${profileUsername}`);
                } else {
                  router.push("/profile");
                }
              } else {
                setShowSignIn(true);
              }
            }}
          >
            <User size={24} weight="regular" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("open-prayer-composer"));
              }
            }}
            className="flex flex-col items-center gap-1 text-[color:var(--accent)]"
            aria-label="Add a prayer"
          >
            <Plus size={24} weight="regular" />
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-1 text-[color:var(--ink)] hover:text-[color:var(--accent)]"
            onClick={openNotifications}
          >
            <BellSimple size={24} weight="regular" />
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-1 text-[color:var(--ink)] hover:text-[color:var(--accent)]"
            onClick={() => router.push("/search")}
            aria-label="Search people"
          >
            <MagnifyingGlass size={24} weight="regular" />
          </button>
        </div>
      </nav>
    </>
  );
}
