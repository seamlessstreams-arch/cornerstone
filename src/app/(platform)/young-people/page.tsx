"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  AlertTriangle, User, Shield, Calendar, GraduationCap,
  ChevronRight, Clock,
} from "lucide-react";
import { useYoungPeople, type YPEnriched } from "@/hooks/use-young-people";
import { cn, formatDate } from "@/lib/utils";

type StatusTab = "current" | "former" | "all";

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 animate-pulse space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-3 w-24 bg-slate-100 rounded" />
        </div>
        <div className="h-6 w-16 bg-slate-100 rounded-full" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-5/6" />
      </div>
    </div>
  );
}

// ── YP Card ───────────────────────────────────────────────────────────────────

interface YPCardProps {
  yp: YPEnriched;
  onClick: () => void;
}

function YPCard({ yp, onClick }: YPCardProps) {
  const displayName = yp.preferred_name ?? yp.first_name;
  const hasRisk = yp.risk_flags.length > 0;

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all cursor-pointer group",
        hasRisk && "ring-1 ring-amber-200"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Avatar name={displayName} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold text-slate-900 truncate">
              {displayName} {yp.last_name}
            </div>
            <div className="text-xs text-slate-500">
              Age {yp.age} — {yp.local_authority}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge
              variant={yp.status === "current" ? "success" : "secondary"}
              className="rounded-full capitalize text-[10px]"
            >
              {yp.status}
            </Badge>
            {hasRisk && (
              <Badge variant="warning" className="rounded-full text-[9px] gap-0.5">
                <AlertTriangle className="h-2.5 w-2.5" />
                Risk
              </Badge>
            )}
          </div>
        </div>

        {/* Risk flags */}
        {hasRisk && (
          <div className="flex flex-wrap gap-1 mb-3">
            {yp.risk_flags.map((flag) => (
              <Badge key={flag} variant="warning" className="text-[9px] rounded-full gap-0.5 px-2 py-0.5">
                <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                {flag}
              </Badge>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="rounded-xl bg-slate-50 p-2.5 text-center">
            <div className={cn(
              "text-lg font-bold",
              yp.open_incidents > 0 ? "text-red-600" : "text-emerald-600"
            )}>
              {yp.open_incidents}
            </div>
            <div className="text-[10px] text-slate-500 leading-tight">Incidents</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5 text-center">
            <div className={cn(
              "text-lg font-bold",
              yp.active_tasks > 0 ? "text-amber-600" : "text-slate-900"
            )}>
              {yp.active_tasks}
            </div>
            <div className="text-[10px] text-slate-500 leading-tight">Tasks</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5 text-center">
            <div className="text-lg font-bold text-blue-600">{yp.active_medications}</div>
            <div className="text-[10px] text-slate-500 leading-tight">Meds</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-2.5 text-center">
            <div className={cn(
              "text-lg font-bold",
              yp.missing_episodes_total > 0 ? "text-violet-600" : "text-slate-900"
            )}>
              {yp.missing_episodes_total}
            </div>
            <div className="text-[10px] text-slate-500 leading-tight">Missing</div>
          </div>
        </div>

        {/* Key info */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>
              Key Worker:{" "}
              <strong>{yp.key_worker?.full_name ?? "Unassigned"}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Shield className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">SW: {yp.social_worker_name}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>Placed: {formatDate(yp.placement_start)}</span>
          </div>
          {yp.school_name && (
            <div className="flex items-center gap-2 text-slate-600">
              <GraduationCap className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{yp.school_name}</span>
            </div>
          )}
        </div>

        {/* Allergies */}
        {yp.allergies.length > 0 && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            <strong>Allergy:</strong> {yp.allergies.join(", ")}
          </div>
        )}

        {/* Last log */}
        {yp.last_log_date && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
            <Clock className="h-3 w-3" />
            Last log: {formatDate(yp.last_log_date)}
          </div>
        )}

        {/* View more cue */}
        <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-400 group-hover:text-slate-600 transition-colors">
          <ChevronRight className="h-3 w-3" />
          View full profile
        </div>
      </CardContent>
    </Card>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ status }: { status: StatusTab }) {
  return (
    <div className="col-span-3 flex flex-col items-center justify-center py-24 text-center">
      <User className="h-12 w-12 text-slate-200 mb-4" />
      <div className="text-slate-500 font-medium mb-1">
        {status === "former" ? "No former placements recorded" : "No young people found"}
      </div>
      <div className="text-sm text-slate-400">
        {status === "former"
          ? "Former placements will appear here when a placement ends."
          : "Try a different status filter."}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function YoungPeoplePage() {
  const [activeTab, setActiveTab] = useState<StatusTab>("current");
  const router = useRouter();

  const { data, isLoading, isError } = useYoungPeople(activeTab);

  const youngPeople = data?.data ?? [];
  const meta = data?.meta;

  const tabs: { key: StatusTab; label: string }[] = [
    { key: "current", label: `Current${meta ? ` (${meta.current})` : ""}` },
    { key: "former", label: `Former${meta ? ` (${meta.former})` : ""}` },
    { key: "all", label: `All${meta ? ` (${meta.total})` : ""}` },
  ];

  return (
    <PageShell
      title="Young People"
      subtitle={
        meta
          ? `${meta.current} current placement${meta.current !== 1 ? "s" : ""} · ${meta.high_risk} with risk flags`
          : "Loading..."
      }
      quickCreateContext={{ module: "young-people", defaultTaskCategory: "young_person_plans", defaultFormType: "welfare_check", preferredTab: "form" }}
    >
      <div className="space-y-6 animate-fade-in">

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
              }}
              className={cn(
                "px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px",
                activeTab === tab.key
                  ? "border-blue-600 text-blue-700 bg-blue-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error state */}
        {isError && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            Failed to load young people. Please refresh the page.
          </div>
        )}

        {/* Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {isLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : youngPeople.length === 0 ? (
            <EmptyState status={activeTab} />
          ) : (
            youngPeople.map((yp) => (
              <YPCard
                key={yp.id}
                yp={yp}
                onClick={() => router.push(`/young-people/${yp.id}`)}
              />
            ))
          )}
        </div>

      </div>

    </PageShell>
  );
}
