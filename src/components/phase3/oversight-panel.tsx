"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface OversightEntry {
  id: string;
  manager_user_id: string;
  narrative: string;
  analysis: string | null;
  what_went_well: string | null;
  concerns_identified: string | null;
  risk_implications: string | null;
  actions_required: string | null;
  action_timescale: string | null;
  safeguarding_escalation_needed: boolean;
  another_form_required: boolean;
  chronology_update_needed: boolean;
  supervision_follow_up_required: boolean;
  sign_off_status: "pending" | "approved" | "rejected";
  submitted_at: string | null;
  created_at: string;
}

interface OversightPanelProps {
  formRecordId: string;
  /** If true the add-oversight form is always shown (for manager dashboards). 
   * If false, it's toggled by a button. */
  alwaysShowForm?: boolean;
}

const SIGN_OFF_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export function OversightPanel({ formRecordId, alwaysShowForm = false }: OversightPanelProps) {
  const [entries, setEntries] = useState<OversightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [schemaReady, setSchemaReady] = useState(true);
  const [showForm, setShowForm] = useState(alwaysShowForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [narrative, setNarrative] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [whatWentWell, setWhatWentWell] = useState("");
  const [concernsIdentified, setConcernsIdentified] = useState("");
  const [actionsRequired, setActionsRequired] = useState("");
  const [actionTimescale, setActionTimescale] = useState("");
  const [flags, setFlags] = useState({
    safeguardingEscalationNeeded: false,
    anotherFormRequired: false,
    chronologyUpdateNeeded: false,
    supervisionFollowUpRequired: false,
  });

  useEffect(() => {
    const fetchOversight = async () => {
      try {
        const resp = await fetch(`/api/v1/oversight?formRecordId=${formRecordId}`);
        if (!resp.ok) throw new Error("Failed to fetch");
        const data = await resp.json();
        setSchemaReady(data.schemaReady !== false);
        setEntries(data.oversight ?? []);
      } catch {
        setSchemaReady(true);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOversight();
  }, [formRecordId]);

  const handleSubmit = async () => {
    if (!narrative.trim()) {
      setError("Narrative is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const resp = await fetch("/api/v1/oversight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formRecordId,
          narrative,
          analysis: analysis || undefined,
          whatWentWell: whatWentWell || undefined,
          concernsIdentified: concernsIdentified || undefined,
          actionsRequired: actionsRequired || undefined,
          actionTimescale: actionTimescale || undefined,
          ...flags,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || "Failed to save");
      }

      const data = await resp.json();
      setEntries((prev) => [data.oversight, ...prev]);
      setSuccess(true);
      setShowForm(false);
      // Reset form
      setNarrative("");
      setAnalysis("");
      setWhatWentWell("");
      setConcernsIdentified("");
      setActionsRequired("");
      setActionTimescale("");
      setFlags({ safeguardingEscalationNeeded: false, anotherFormRequired: false, chronologyUpdateNeeded: false, supervisionFollowUpRequired: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border">
      {!schemaReady && (
        <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
          Phase 3 oversight tables are not available in this database yet. Apply the latest Supabase migrations to enable management oversight history.
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b">
        <div>
          <h3 className="font-semibold text-gray-900">Management Oversight</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {entries.length === 0
              ? "No oversight entries yet"
              : `${entries.length} oversight entr${entries.length === 1 ? "y" : "ies"}`}
          </p>
        </div>
        {!alwaysShowForm && (
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "+ Add Oversight"}
          </Button>
        )}
      </div>

      {/* Existing entries */}
      {!loading && entries.length > 0 && (
        <div className="divide-y">
          {entries.map((entry) => (
            <div key={entry.id} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-400">
                  {entry.submitted_at
                    ? new Date(entry.submitted_at).toLocaleString("en-GB")
                    : new Date(entry.created_at).toLocaleString("en-GB")}
                </p>
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${SIGN_OFF_BADGE[entry.sign_off_status]}`}>
                  {entry.sign_off_status.charAt(0).toUpperCase() + entry.sign_off_status.slice(1)}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Narrative</p>
                  <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{entry.narrative}</p>
                </div>

                {entry.analysis && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Analysis</p>
                    <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{entry.analysis}</p>
                  </div>
                )}

                {entry.concerns_identified && (
                  <div className="bg-red-50 rounded p-3">
                    <p className="text-xs font-medium text-red-700 uppercase tracking-wide">Concerns Identified</p>
                    <p className="text-sm text-red-800 mt-1 whitespace-pre-wrap">{entry.concerns_identified}</p>
                  </div>
                )}

                {entry.actions_required && (
                  <div className="bg-amber-50 rounded p-3">
                    <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">Actions Required</p>
                    <p className="text-sm text-amber-800 mt-1 whitespace-pre-wrap">{entry.actions_required}</p>
                    {entry.action_timescale && (
                      <p className="text-xs text-amber-600 mt-2">Timescale: {entry.action_timescale}</p>
                    )}
                  </div>
                )}

                {/* Flags */}
                {(entry.safeguarding_escalation_needed ||
                  entry.another_form_required ||
                  entry.chronology_update_needed ||
                  entry.supervision_follow_up_required) && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {entry.safeguarding_escalation_needed && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                        🚨 Safeguarding Escalation
                      </span>
                    )}
                    {entry.another_form_required && (
                      <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                        📋 Another Form Required
                      </span>
                    )}
                    {entry.chronology_update_needed && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                        📖 Chronology Update
                      </span>
                    )}
                    {entry.supervision_follow_up_required && (
                      <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                        👥 Supervision Follow-up
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="p-5 text-sm text-gray-400">Loading oversight…</div>
      )}

      {success && !showForm && (
        <div className="px-5 py-3 bg-green-50 text-sm text-green-700 border-t">
          ✓ Oversight submitted successfully
        </div>
      )}

      {/* Add oversight form */}
      {showForm && (
        <div className="p-5 border-t bg-gray-50 space-y-4">
          <h4 className="font-medium text-gray-800 text-sm">Add Management Oversight</h4>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">
              Narrative <span className="text-red-500">*</span>
            </label>
            <textarea
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              rows={4}
              placeholder="Your management oversight narrative…"
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Analysis (optional)</label>
            <textarea
              value={analysis}
              onChange={(e) => setAnalysis(e.target.value)}
              rows={2}
              placeholder="Pattern analysis, context…"
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">What Went Well</label>
              <textarea
                value={whatWentWell}
                onChange={(e) => setWhatWentWell(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Concerns Identified</label>
              <textarea
                value={concernsIdentified}
                onChange={(e) => setConcernsIdentified(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Actions Required</label>
              <textarea
                value={actionsRequired}
                onChange={(e) => setActionsRequired(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Action Timescale</label>
              <input
                type="text"
                value={actionTimescale}
                onChange={(e) => setActionTimescale(e.target.value)}
                placeholder="e.g. Within 7 days"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Flags */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700">Flags</p>
            {(
              [
                ["safeguardingEscalationNeeded", "🚨 Safeguarding escalation needed"],
                ["anotherFormRequired", "📋 Another form required"],
                ["chronologyUpdateNeeded", "📖 Chronology update needed"],
                ["supervisionFollowUpRequired", "👥 Supervision follow-up required"],
              ] as [keyof typeof flags, string][]
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={flags[key]}
                  onChange={(e) => setFlags((prev) => ({ ...prev, [key]: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                {label}
              </label>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            {!alwaysShowForm && (
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                Cancel
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-teal-600 hover:bg-teal-700">
              {submitting ? "Submitting…" : "Submit Oversight"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
