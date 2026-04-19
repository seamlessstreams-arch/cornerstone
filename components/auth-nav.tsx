"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AppRole = "STAFF" | "MANAGER" | "ADMIN";

interface ActorContext {
  role: AppRole;
  userId: string;
  homeId: string | null;
  email: string | null;
}

export function AuthNav() {
  const [actor, setActor] = useState<ActorContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadActor = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          if (!cancelled) {
            setActor(null);
          }
          return;
        }

        const data = (await response.json()) as ActorContext;
        if (!cancelled) {
          setActor(data);
        }
      } catch {
        if (!cancelled) {
          setActor(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadActor();

    const handleWindowFocus = () => {
      void loadActor();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadActor();
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    const refreshTimer = window.setInterval(() => {
      void loadActor();
    }, 60_000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(refreshTimer);
    };
  }, []);

  if (loading) {
    return <span className="rounded bg-slate-100 px-3 py-2 text-xs text-slate-500">Checking auth...</span>;
  }

  if (!actor) {
    return (
      <Link href="/auth/sign-in" className="rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800">
        Sign In
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
        {actor.role}
      </span>
      <span className="hidden rounded bg-slate-100 px-2 py-1 text-xs text-slate-600 sm:inline">
        {actor.email ?? actor.userId.slice(0, 8)}
      </span>
      <Link href="/auth/sign-out" className="rounded bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800">
        Sign Out
      </Link>
    </div>
  );
}
