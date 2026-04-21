"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bell, Search, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AcaciaLogo } from "@/components/branding/acacia-logo";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAria, setShowAria] = useState(false);

  const todayStr = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-6 py-3">
        {/* Left: Brand and title */}
        <div className="flex min-w-0 items-center gap-3">
          <AcaciaLogo showText={false} size={30} className="shrink-0" />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-slate-900">{title}</h1>
            <p className="text-xs text-slate-500">{subtitle || todayStr}</p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Global search */}
          {searchOpen ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search everything..."
                className="w-72 pl-9 pr-8 rounded-xl"
                autoFocus
              />
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button variant="ghost" size="icon-sm" onClick={() => setSearchOpen(true)} title="Search">
              <Search className="h-4 w-4" />
            </Button>
          )}

          {/* Custom actions */}
          {actions}

          {/* Notifications */}
          <Link href="/dashboard/staff">
            <Button variant="ghost" size="icon-sm" className="relative" title="View notifications on Staff Dashboard">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                3
              </span>
            </Button>
          </Link>

          {/* AI Assistant */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={() => setShowAria((v) => !v)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {showAria ? "Close Aria" : "ARIA"}
          </Button>
        </div>
      </div>
    </header>

    {/* Global Aria panel — slides in below the header */}
    {showAria && (
      <div className="sticky top-[57px] z-20 border-b border-blue-200 bg-blue-50/80 backdrop-blur-sm px-6 py-4">
        <AriaPanel
          pageContext={`Page: ${title}. ${subtitle ?? ""}. User is a Registered Manager at Oak House, a children's residential care home.`}
          userRole="registered_manager"
          mode="assist"
          className="max-w-[1440px] mx-auto"
        />
      </div>
    )}
    </>
  );
}
