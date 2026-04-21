"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — FORM TEMPLATE LIBRARY
// Browse all 43 form templates by category, search, and preview fields.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, BookOpen, ChevronRight, X, FileText, Layers,
  CheckCircle2, AlertCircle, Users, Heart, Shield,
  ClipboardList, Building2, Stethoscope, GraduationCap,
} from "lucide-react";
import { TEMPLATE_LIBRARY, TEMPLATES_BY_CATEGORY } from "@/lib/forms/templates";
import { cn } from "@/lib/utils";
import type { FormTemplate, FormField } from "@/lib/forms/types";

// ── Category icon map ─────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Young People":   Heart,
  "Staff & HR":     Users,
  "Incidents":      AlertCircle,
  "Compliance":     Shield,
  "Health & Safety": Stethoscope,
  "Training":       GraduationCap,
  "Buildings":      Building2,
  "General":        ClipboardList,
};

const CATEGORY_COLOURS: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  "Young People":    { bg: "bg-violet-50",  text: "text-violet-700",  border: "border-violet-200", iconBg: "bg-violet-100" },
  "Staff & HR":      { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",   iconBg: "bg-blue-100"   },
  "Incidents":       { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",    iconBg: "bg-red-100"    },
  "Compliance":      { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",  iconBg: "bg-amber-100"  },
  "Health & Safety": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200",iconBg: "bg-emerald-100"},
  "Training":        { bg: "bg-sky-50",     text: "text-sky-700",     border: "border-sky-200",    iconBg: "bg-sky-100"    },
  "Buildings":       { bg: "bg-slate-50",   text: "text-slate-700",   border: "border-slate-200",  iconBg: "bg-slate-100"  },
  "General":         { bg: "bg-gray-50",    text: "text-gray-700",    border: "border-gray-200",   iconBg: "bg-gray-100"   },
};

function getCategoryColour(cat: string) {
  return CATEGORY_COLOURS[cat] ?? { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", iconBg: "bg-slate-100" };
}

// ── Field type labels ─────────────────────────────────────────────────────────

const FIELD_TYPE_LABELS: Record<string, string> = {
  short_text:                   "Short Text",
  long_text:                    "Long Text",
  number:                       "Number",
  date:                         "Date",
  time:                         "Time",
  yes_no:                       "Yes / No",
  single_select:                "Single Select",
  multi_select:                 "Multi Select",
  checklist:                    "Checklist",
  staff_selector:               "Staff Selector",
  young_person_selector:        "YP Selector",
  signature:                    "Signature",
  risk_rating:                  "Risk Rating",
  ai_assisted_narrative:        "AI Narrative",
  live_voice_transcript:        "Voice Transcript",
  management_oversight_narrative:"Manager Oversight",
  evidence_verification:        "Evidence",
  action_list:                  "Action List",
  repeating_group:              "Repeating Group",
};

// ── Template Card ─────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onClick,
}: {
  template: FormTemplate;
  onClick: () => void;
}) {
  const colours = getCategoryColour(template.category);
  const Icon = CATEGORY_ICONS[template.category] ?? FileText;
  const fieldCount = template.latest_version?.schema?.sections?.reduce(
    (n, s) => n + (s.fields?.length ?? 0), 0
  ) ?? 0;
  const sectionCount = template.latest_version?.schema?.sections?.length ?? 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-2xl border bg-white p-5 transition-all",
        "hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5",
        "focus:outline-none focus:ring-2 focus:ring-slate-400"
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("flex-shrink-0 rounded-xl p-2.5", colours.iconBg)}>
          <Icon className={cn("h-5 w-5", colours.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-slate-700 truncate">
              {template.name}
            </h3>
            <ChevronRight className="flex-shrink-0 h-4 w-4 text-slate-400 group-hover:text-slate-600 mt-0.5" />
          </div>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{template.description}</p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border", colours.bg, colours.text, colours.border)}>
              {template.category}
            </span>
            <span className="text-xs text-slate-400">
              {sectionCount} section{sectionCount !== 1 ? "s" : ""} · {fieldCount} field{fieldCount !== 1 ? "s" : ""}
            </span>
            {template.status === "approved" && (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Preview Modal ─────────────────────────────────────────────────────────────

function PreviewModal({
  template,
  onClose,
  onUse,
}: {
  template: FormTemplate;
  onClose: () => void;
  onUse: () => void;
}) {
  const colours = getCategoryColour(template.category);
  const Icon = CATEGORY_ICONS[template.category] ?? FileText;
  const sections = template.latest_version?.schema?.sections ?? [];
  const allFields: FormField[] = sections.flatMap((s) => s.fields ?? []);
  const totalFields = allFields.length;

  const fieldTypeCounts = allFields.reduce<Record<string, number>>((acc, f) => {
    acc[f.field_type] = (acc[f.field_type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={cn("rounded-t-3xl p-6 border-b", colours.bg)}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn("rounded-xl p-2.5", colours.iconBg)}>
                <Icon className={cn("h-6 w-6", colours.text)} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{template.name}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{template.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-white/60 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-4 text-xs text-slate-600">
            <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 font-medium border", colours.bg, colours.text, colours.border)}>
              {template.category}
            </span>
            <span><strong>{sections.length}</strong> sections</span>
            <span><strong>{totalFields}</strong> fields</span>
            <span>v{template.latest_version?.version_number ?? 1}</span>
            {template.status === "approved" && (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Approved
              </span>
            )}
          </div>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Field type breakdown */}
          {Object.keys(fieldTypeCounts).length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Field Types</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(fieldTypeCounts).map(([type, count]) => (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                  >
                    {FIELD_TYPE_LABELS[type] ?? type}
                    <span className="font-semibold">×{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sections */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Sections</h3>
            <div className="space-y-3">
              {sections.map((section, si) => (
                <div key={section.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex-shrink-0 h-5 w-5 rounded-full bg-slate-200 text-slate-600 text-xs flex items-center justify-center font-semibold">
                      {si + 1}
                    </span>
                    <span className="font-medium text-sm text-slate-800">{section.title}</span>
                    <span className="ml-auto text-xs text-slate-400">{section.fields?.length ?? 0} fields</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(section.fields ?? []).map((field) => (
                      <span
                        key={field.id}
                        className={cn(
                          "inline-flex items-center rounded-md px-2 py-0.5 text-xs border",
                          field.required
                            ? "bg-white border-slate-300 text-slate-700"
                            : "bg-white border-slate-200 text-slate-400"
                        )}
                      >
                        {field.label}
                        {field.required && <span className="ml-1 text-red-400">*</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="rounded-b-3xl border-t bg-slate-50 px-6 py-4 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400">Code: <code className="font-mono">{template.code}</code></span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
            <Button size="sm" onClick={onUse} className="bg-slate-900 text-white hover:bg-slate-800">
              Use Template →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────

function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border bg-white px-5 py-3 text-center min-w-[80px]">
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">{label}</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TemplateLibraryPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [preview, setPreview] = useState<FormTemplate | null>(null);

  const categories = useMemo(
    () => Object.keys(TEMPLATES_BY_CATEGORY).sort(),
    []
  );

  const filtered = useMemo(() => {
    let list = TEMPLATE_LIBRARY;
    if (filterCategory) list = list.filter((t) => t.category === filterCategory);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, filterCategory]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, FormTemplate[]>>((acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    }, {});
  }, [filtered]);

  const groupedCategories = Object.keys(grouped).sort();

  const totalFields = TEMPLATE_LIBRARY.reduce(
    (n, t) =>
      n + (t.latest_version?.schema?.sections ?? []).reduce((m, s) => m + (s.fields?.length ?? 0), 0),
    0
  );

  function handleUseTemplate(template: FormTemplate) {
    router.push(`/forms/new?template=${template.code}`);
  }

  return (
    <>
      <PageShell
        title="Template Library"
        subtitle={`${TEMPLATE_LIBRARY.length} form templates across ${categories.length} categories`}
        actions={
          <Button
            onClick={() => router.push("/forms/new")}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            <FileText className="mr-2 h-4 w-4" />
            New Form
          </Button>
        }
      >
        {/* Stats row */}
        <div className="flex flex-wrap gap-3 mb-6">
          <StatPill label="Templates" value={TEMPLATE_LIBRARY.length} />
          <StatPill label="Categories" value={categories.length} />
          <StatPill label="Total Fields" value={totalFields} />
          <StatPill label="Showing" value={filtered.length} />
        </div>

        {/* Search + category filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search templates by name, category, or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterCategory(null)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium border transition-colors",
              filterCategory === null
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
            )}
          >
            All ({TEMPLATE_LIBRARY.length})
          </button>
          {categories.map((cat) => {
            const colours = getCategoryColour(cat);
            const count = (TEMPLATES_BY_CATEGORY[cat] ?? []).length;
            const active = filterCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(active ? null : cat)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium border transition-colors",
                  active
                    ? cn(colours.bg, colours.text, colours.border, "ring-1 ring-current")
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                )}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border bg-white p-12 text-center">
            <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-600">No templates found</p>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your search or category filter</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => { setSearch(""); setFilterCategory(null); }}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedCategories.map((cat) => {
              const colours = getCategoryColour(cat);
              const Icon = CATEGORY_ICONS[cat] ?? FileText;
              const catTemplates = grouped[cat];
              return (
                <div key={cat}>
                  {/* Category heading */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn("rounded-lg p-1.5", colours.iconBg)}>
                      <Icon className={cn("h-4 w-4", colours.text)} />
                    </div>
                    <h2 className="font-semibold text-slate-800">{cat}</h2>
                    <span className="text-sm text-slate-400">({catTemplates.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {catTemplates.map((t) => (
                      <TemplateCard
                        key={t.id}
                        template={t}
                        onClick={() => setPreview(t)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageShell>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50" onClick={() => setPreview(null)}>
          <PreviewModal
            template={preview}
            onClose={() => setPreview(null)}
            onUse={() => {
              handleUseTemplate(preview);
              setPreview(null);
            }}
          />
        </div>
      )}
    </>
  );
}
