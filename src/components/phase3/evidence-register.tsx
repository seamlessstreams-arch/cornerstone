"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EvidenceVerifyModal } from "@/components/phase3/evidence-verify-modal";
import { EVIDENCE_TYPE_LABELS, VERIFICATION_STATUS_LABELS, VERIFICATION_STATUS_COLORS } from "@/lib/evidence/types";
import type { EvidenceUpload } from "@/lib/evidence/types";

interface EvidenceRegisterProps {
  formRecordId?: string;
  linkedCandidateId?: string;
  filterStatus?: string;
  filterEvidenceType?: string;
  filterCandidateQuery?: string;
}

export function EvidenceRegister({
  formRecordId,
  linkedCandidateId,
  filterStatus,
  filterEvidenceType,
  filterCandidateQuery,
}: EvidenceRegisterProps) {
  const [evidence, setEvidence] = useState<EvidenceUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schemaReady, setSchemaReady] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceUpload | null>(null);

  async function fetchEvidence() {
    try {
      setLoading(true);
      setError(null);
      const query = new URLSearchParams();
      if (formRecordId) query.append("formRecordId", formRecordId);
      if (linkedCandidateId) query.append("candidateId", linkedCandidateId);
      if (filterStatus) query.append("status", filterStatus);

      const response = await fetch(`/api/phase3/evidence?${query}`);
      if (!response.ok) {
        throw new Error("Failed to fetch evidence");
      }

      const data = await response.json();
      setSchemaReady(data.schemaReady !== false);
      setEvidence(data.evidence || []);
    } catch (err) {
      setSchemaReady(true);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvidence();
  }, [formRecordId, linkedCandidateId, filterStatus]);

  const normalizedCandidateQuery = (filterCandidateQuery ?? "").trim().toLowerCase();
  const filteredEvidence = evidence.filter((item) => {
    if (filterEvidenceType && item.evidenceType !== filterEvidenceType) {
      return false;
    }

    if (!normalizedCandidateQuery) {
      return true;
    }

    const candidateId = (item.linkedCandidateId ?? "").toLowerCase();
    const fileName = item.fileName.toLowerCase();

    return candidateId.includes(normalizedCandidateQuery) || fileName.includes(normalizedCandidateQuery);
  });

  if (loading) {
    return <div className="text-center py-4">Loading evidence...</div>;
  }

  if (error) {
    return <div className="text-red-600 py-4">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      {!schemaReady && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Phase 3 evidence tables are not available in this database yet. Apply the latest Supabase migrations to enable evidence history.
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Evidence Register</h3>
        <span className="text-sm text-gray-600">{filteredEvidence.length} files</span>
      </div>

      {filteredEvidence.length === 0 ? (
        <div className="text-gray-500 py-4">
          {evidence.length === 0 ? "No evidence uploads found" : "No evidence uploads match current filters"}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">File Name</th>
                <th className="px-4 py-2 text-left font-semibold">Type</th>
                <th className="px-4 py-2 text-left font-semibold">Uploaded By</th>
                <th className="px-4 py-2 text-left font-semibold">Uploaded At</th>
                <th className="px-4 py-2 text-left font-semibold">Viewed By</th>
                <th className="px-4 py-2 text-left font-semibold">Viewed On</th>
                <th className="px-4 py-2 text-left font-semibold">Verified By</th>
                <th className="px-4 py-2 text-left font-semibold">Verified On</th>
                <th className="px-4 py-2 text-left font-semibold">Status</th>
                <th className="px-4 py-2 text-left font-semibold">Verification Notes</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvidence.map((file) => {
                const latestVerification = file.verificationHistory?.[file.verificationHistory.length - 1];
                const latestViewed = [...(file.verificationHistory ?? [])]
                  .reverse()
                  .find((item) => item.action === "viewed");
                const latestVerified = [...(file.verificationHistory ?? [])]
                  .reverse()
                  .find((item) => item.action === "verified" || item.action === "rejected");
                const status = latestVerification?.verificationStatus || "pending";

                return (
                  <tr key={file.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <a href={file.filePath} className="text-blue-600 hover:underline">
                        {file.fileName}
                      </a>
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                        {EVIDENCE_TYPE_LABELS[file.evidenceType] || file.evidenceType}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs">{file.uploadedBy?.email}</td>
                    <td className="px-4 py-2 text-xs">{new Date(file.uploadedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-xs">{latestViewed?.takenBy?.email || "—"}</td>
                    <td className="px-4 py-2 text-xs">
                      {latestViewed?.takenAt ? new Date(latestViewed.takenAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-2 text-xs">{latestVerified?.takenBy?.email || "—"}</td>
                    <td className="px-4 py-2 text-xs">
                      {latestVerified?.takenAt ? new Date(latestVerified.takenAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-1 rounded ${VERIFICATION_STATUS_COLORS[status] || "bg-gray-100"}`}>
                        {VERIFICATION_STATUS_LABELS[status]}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs max-w-[220px] truncate" title={latestVerification?.verificationNotes || ""}>
                      {latestVerification?.verificationNotes || "—"}
                    </td>
                    <td className="px-4 py-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedEvidence(file)}>
                        Review
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedEvidence && (
        <EvidenceVerifyModal
          evidenceId={selectedEvidence.id}
          fileName={selectedEvidence.fileName}
          evidenceType={selectedEvidence.evidenceType}
          currentStatus={selectedEvidence.currentStatus}
          onClose={() => setSelectedEvidence(null)}
          onVerified={async () => {
            setSelectedEvidence(null);
            await fetchEvidence();
          }}
        />
      )}
    </div>
  );
}
