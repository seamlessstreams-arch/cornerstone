"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  VERIFICATION_STATUS,
  VERIFICATION_STATUS_LABELS,
  VERIFICATION_STATUS_COLORS,
} from "@/lib/evidence/types";

interface EvidenceVerifyModalProps {
  evidenceId: string;
  fileName: string;
  evidenceType: string;
  currentStatus: string;
  onClose: () => void;
  onVerified: (newStatus: string) => void;
}

export function EvidenceVerifyModal({
  evidenceId,
  fileName,
  evidenceType,
  currentStatus,
  onClose,
  onVerified,
}: EvidenceVerifyModalProps) {
  const [action, setAction] = useState<"viewed" | "verified" | "rejected" | "superseded">("viewed");
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusMap: Record<typeof action, string> = {
    viewed: VERIFICATION_STATUS.VIEWED,
    verified: VERIFICATION_STATUS.VERIFIED,
    rejected: VERIFICATION_STATUS.REJECTED,
    superseded: VERIFICATION_STATUS.SUPERSEDED,
  };

  const handleSubmit = async () => {
    if (action === "rejected" && !rejectionReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/phase3/evidence/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidenceId,
          action,
          verificationStatus: statusMap[action],
          verificationNotes: notes || undefined,
          rejectionReason: action === "rejected" ? rejectionReason : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save verification");
      }

      onVerified(statusMap[action]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-semibold text-gray-900">Verify Evidence</h2>
            <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xs">{fileName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Current status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Current status:</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${VERIFICATION_STATUS_COLORS[currentStatus] || "bg-gray-100 text-gray-700"}`}>
              {VERIFICATION_STATUS_LABELS[currentStatus] || currentStatus}
            </span>
          </div>

          {/* Evidence type */}
          <div className="text-sm text-gray-600">
            <span className="font-medium">Type:</span> {evidenceType.replace(/_/g, " ")}
          </div>

          {/* Action selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Action</label>
            <div className="grid grid-cols-2 gap-2">
              {(["viewed", "verified", "rejected", "superseded"] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => setAction(a)}
                  className={`px-3 py-2 text-sm rounded-lg border text-left capitalize transition-colors ${
                    action === a
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  {a === "viewed" && "👁 "}
                  {a === "verified" && "✓ "}
                  {a === "rejected" && "✗ "}
                  {a === "superseded" && "↩ "}
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Rejection reason (conditional) */}
          {action === "rejected" && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                placeholder="State why this evidence has been rejected…"
                className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Verification notes */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional notes about this verification…"
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t bg-gray-50 rounded-b-xl">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className={`flex-1 ${action === "rejected" ? "bg-red-600 hover:bg-red-700" : action === "verified" ? "bg-green-600 hover:bg-green-700" : ""}`}
          >
            {submitting ? "Saving…" : `Record as ${action.charAt(0).toUpperCase() + action.slice(1)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
