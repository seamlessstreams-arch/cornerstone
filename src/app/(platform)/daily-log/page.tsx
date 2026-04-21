"use client";

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Plus, Heart, Activity, Star, Smile, Meh, Frown,
  Moon, Utensils, Loader2, AlertCircle, X, Mic, MicOff,
} from "lucide-react";
import { useDictation } from "@/hooks/use-dictation";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { cn, formatDate } from "@/lib/utils";
import { useDailyLog, useCreateDailyLog } from "@/hooks/use-daily-log";
import { useYoungPeople } from "@/hooks/use-young-people";
import type { DailyLogEntry } from "@/types";

// ── Constants ────────────────────────────────────────────────────────────────

const ENTRY_TYPES: DailyLogEntry["entry_type"][] = [
  "general", "behaviour", "health", "education", "contact", "activity", "mood", "sleep", "food",
];

const ENTRY_TYPE_ICONS: Record<string, React.ElementType> = {
  general: BookOpen,
  behaviour: Activity,
  health: Heart,
  education: BookOpen,
  contact: Heart,
  activity: Star,
  mood: Smile,
  sleep: Moon,
  food: Utensils,
};

const ENTRY_TYPE_COLORS: Record<string, string> = {
  general: "bg-slate-100 text-slate-600",
  behaviour: "bg-orange-100 text-orange-700",
  health: "bg-red-100 text-red-700",
  education: "bg-blue-100 text-blue-700",
  contact: "bg-violet-100 text-violet-700",
  activity: "bg-emerald-100 text-emerald-700",
  mood: "bg-amber-100 text-amber-700",
  sleep: "bg-indigo-100 text-indigo-700",
  food: "bg-teal-100 text-teal-700",
};

type DateFilter = "today" | "yesterday" | "7days" | "all";

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7days": "Last 7 days",
  all: "All",
};

function moodColor(score: number): string {
  if (score >= 8) return "bg-emerald-100 text-emerald-700";
  if (score >= 6) return "bg-amber-100 text-amber-700";
  if (score >= 4) return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
}

function MoodIcon({ score }: { score: number }) {
  if (score >= 7) return <Smile className="h-3 w-3" />;
  if (score >= 4) return <Meh className="h-3 w-3" />;
  return <Frown className="h-3 w-3" />;
}

// ── New Entry Form ────────────────────────────────────────────────────────────

interface NewEntryFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

function NewEntryForm({ onClose, onSuccess }: NewEntryFormProps) {
  const ypQuery = useYoungPeople();
  const currentYP = ypQuery.data?.data ?? [];
  const createMutation = useCreateDailyLog();

  const [childId, setChildId] = useState(currentYP[0]?.id ?? "");
  const [entryType, setEntryType] = useState<DailyLogEntry["entry_type"]>("general");
  const [content, setContent] = useState("");
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [isSignificant, setIsSignificant] = useState(false);
  const [dictMode] = useState<"append" | "replace">("append");

  const dictation = useDictation((_next, chunk) => {
    setContent((prev) => dictMode === "replace" ? chunk : (prev ? `${prev} ${chunk}` : chunk));
  }, { mode: dictMode });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    await createMutation.mutateAsync({
      child_id: childId,
      entry_type: entryType,
      content: content.trim(),
      mood_score: moodScore,
      is_significant: isSignificant,
    });
    onSuccess();
  }

  return (
    <Card className="border-2 border-slate-900 rounded-2xl">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-slate-900">New Log Entry</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* YP selector */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Young Person</label>
              <select
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {currentYP.map((yp) => (
                  <option key={yp.id} value={yp.id}>{yp.preferred_name || yp.first_name}</option>
                ))}
              </select>
            </div>
            {/* Entry type selector */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Entry Type</label>
              <select
                value={entryType}
                onChange={(e) => setEntryType(e.target.value as DailyLogEntry["entry_type"])}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 capitalize"
              >
                {ENTRY_TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-500">Notes</label>
              <button
                type="button"
                onClick={dictation.isListening ? dictation.stop : dictation.start}
                title={dictation.isListening ? "Stop dictation" : "Dictate notes"}
                className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium transition-colors ${
                  dictation.isListening
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {dictation.isListening ? (
                  <><MicOff className="h-3 w-3" />Stop</>
                ) : (
                  <><Mic className="h-3 w-3" />Dictate</>
                )}
              </button>
            </div>
            {dictation.isListening && (
              <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-red-600">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />Listening — speak clearly
              </div>
            )}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Record what happened, how the young person was, any significant events or observations..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
            />
          </div>

          <div className="flex items-center gap-6">
            {/* Mood score */}
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                Mood Score (optional): {moodScore !== null ? `${moodScore}/10` : "—"}
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={moodScore ?? 5}
                onChange={(e) => setMoodScore(parseInt(e.target.value, 10))}
                onMouseDown={() => { if (moodScore === null) setMoodScore(5); }}
                className="w-full accent-slate-900"
              />
              {moodScore !== null && (
                <button
                  type="button"
                  onClick={() => setMoodScore(null)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 mt-0.5"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Significant toggle */}
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsSignificant(!isSignificant)}
                className={cn(
                  "h-5 w-9 rounded-full transition-colors",
                  isSignificant ? "bg-amber-500" : "bg-slate-200"
                )}
              >
                <span
                  className={cn(
                    "block h-4 w-4 rounded-full bg-white shadow transition-transform mx-0.5",
                    isSignificant ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
              <span className="text-xs text-slate-600">Significant</span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />Saving...</>
              ) : (
                "Save Entry"
              )}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onClose}>Cancel</Button>
          </div>

          {createMutation.isError && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              {createMutation.error?.message || "Failed to save"}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function DailyLogPage() {
  const [selectedYP, setSelectedYP] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("7days");
  const [typeFilter, setTypeFilter] = useState<DailyLogEntry["entry_type"] | "all">("all");
  const [showForm, setShowForm] = useState(false);

  const ypQuery = useYoungPeople();
  const currentYP = ypQuery.data?.data ?? [];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  // Build params for useDailyLog
  const queryParams = {
    ...(selectedYP !== "all" ? { child_id: selectedYP } : {}),
    ...(dateFilter === "today" ? { date: new Date().toISOString().slice(0, 10) } : {}),
    ...(dateFilter === "yesterday" ? { date: yesterdayDate.toISOString().slice(0, 10) } : {}),
    ...(dateFilter === "7days" ? { days: 7 } : {}),
    ...(typeFilter !== "all" ? { entry_type: typeFilter } : {}),
  };

  const { data, isLoading, isError, error } = useDailyLog(queryParams);

  const entries = data?.data ?? [];
  const typeCounts = data?.meta.by_type ?? {};

  // Group by date
  const grouped = entries.reduce<Record<string, typeof entries>>((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // YP entry counts
  const ypCounts: Record<string, number> = {};
  for (const e of entries) {
    ypCounts[e.child_id] = (ypCounts[e.child_id] || 0) + 1;
  }

  return (
    <PageShell
      title="Daily Log"
      subtitle="Individual daily observations, mood, health, education, and contact records"
      quickCreateContext={{
        module: "daily-log",
        defaultTaskCategory: "young_person_plans",
        defaultFormType: "daily_check",
        preferredTab: "form",
      }}
      actions={
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          {showForm ? "Cancel" : "New Entry"}
        </Button>
      }
    >
      <div className="space-y-5">
        {/* New entry form */}
        {showForm && (
          <NewEntryForm
            onClose={() => setShowForm(false)}
            onSuccess={() => setShowForm(false)}
          />
        )}

        {/* YP filter tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedYP("all")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all border",
              selectedYP === "all"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            <BookOpen className="h-3.5 w-3.5" />
            All young people
            <span className={cn("text-[10px] rounded-full px-1.5 py-0.5 ml-1 font-semibold",
              selectedYP === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
            )}>
              {entries.length}
            </span>
          </button>
          {currentYP.map((yp) => (
            <button
              key={yp.id}
              onClick={() => setSelectedYP(yp.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all border",
                selectedYP === yp.id
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Heart className="h-3.5 w-3.5" />
              {yp.preferred_name || yp.first_name}
              <span className={cn("text-[10px] rounded-full px-1.5 py-0.5 ml-1 font-semibold",
                selectedYP === yp.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              )}>
                {ypCounts[yp.id] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Date + Type filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(Object.keys(DATE_FILTER_LABELS) as DateFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setDateFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  dateFilter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {DATE_FILTER_LABELS[f]}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setTypeFilter("all")}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border",
                typeFilter === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              )}
            >
              All types
            </button>
            {ENTRY_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border capitalize",
                  typeFilter === t
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                )}
              >
                {t}
                {typeCounts[t] ? (
                  <span className="ml-1 opacity-70">({typeCounts[t]})</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span className="text-sm">Loading entries...</span>
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex items-center gap-3 text-red-600">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Failed to load log entries</p>
              <p className="text-xs mt-0.5">{error?.message}</p>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center text-slate-400">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-slate-200" />
            <div className="text-sm font-medium">No log entries found</div>
            <div className="text-xs mt-1">Try a different filter or add a new entry</div>
            <Button size="sm" className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />Add Entry
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {formatDate(date)}
                  </span>
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-[10px] text-slate-400">{grouped[date].length} entries</span>
                </div>
                <div className="space-y-3">
                  {grouped[date].map((entry) => {
                    const Icon = ENTRY_TYPE_ICONS[entry.entry_type] || BookOpen;
                    const ypName = getYPName(entry.child_id);
                    const staffFirst = getStaffName(entry.staff_id).split(" ")[0];

                    return (
                      <Card key={entry.id} className="rounded-2xl">
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-4">
                            <div
                              className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                                ENTRY_TYPE_COLORS[entry.entry_type] || "bg-slate-100 text-slate-600"
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  className={cn(
                                    "text-[9px] rounded-full capitalize",
                                    ENTRY_TYPE_COLORS[entry.entry_type]
                                  )}
                                >
                                  {entry.entry_type}
                                </Badge>
                                <span className="text-xs text-violet-600 flex items-center gap-1">
                                  <Heart className="h-2.5 w-2.5" />
                                  {ypName}
                                </span>
                                <span className="text-xs text-slate-400">{entry.time} · {staffFirst}</span>
                                {entry.is_significant && (
                                  <Badge className="text-[9px] rounded-full bg-amber-100 text-amber-700">
                                    <Star className="h-2.5 w-2.5 mr-0.5" />Significant
                                  </Badge>
                                )}
                                {entry.mood_score !== null && (
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5",
                                      moodColor(entry.mood_score)
                                    )}
                                  >
                                    <MoodIcon score={entry.mood_score} />
                                    {entry.mood_score}/10
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-700 mt-2 leading-relaxed">{entry.content}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
