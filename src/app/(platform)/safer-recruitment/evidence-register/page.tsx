"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { EvidenceRegister } from "@/components/phase3/evidence-register";
import { formatFiltersAppliedLabel } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending Verification",
  viewed: "Viewed",
  verified: "Verified",
  rejected: "Rejected",
  superseded: "Superseded",
};

const TYPE_LABELS: Record<string, string> = {
  cv: "CV",
  application_form: "Application Form",
  dbs_certificate: "DBS Certificate",
  reference: "Reference",
  qualification_certificate: "Qualification",
  id_document: "ID Document",
};

export default function EvidenceRegisterPage() {
  const router = useRouter();
  const pathname = usePathname();
  const hasHydratedFromUrl = useRef(false);

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [candidateQuery, setCandidateQuery] = useState("");
  const [debouncedCandidateQuery, setDebouncedCandidateQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setStatusFilter(params.get("status") ?? "");
    setTypeFilter(params.get("type") ?? "");
    const initialCandidateQuery = params.get("q") ?? "";
    setCandidateQuery(initialCandidateQuery);
    setDebouncedCandidateQuery(initialCandidateQuery);

    hasHydratedFromUrl.current = true;
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedCandidateQuery(candidateQuery);
    }, 300);

    return () => window.clearTimeout(handle);
  }, [candidateQuery]);

  useEffect(() => {
    if (!hasHydratedFromUrl.current) {
      return;
    }

    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("type", typeFilter);
    if (debouncedCandidateQuery.trim()) params.set("q", debouncedCandidateQuery.trim());

    const nextQuery = params.toString();
    const currentQuery = window.location.search.replace(/^\?/, "");

    if (nextQuery === currentQuery) {
      return;
    }

    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [debouncedCandidateQuery, pathname, router, statusFilter, typeFilter]);

  const activeFilters = useMemo(
    () => [
      statusFilter
        ? { key: "status", label: `Status: ${STATUS_LABELS[statusFilter] ?? statusFilter}` }
        : null,
      typeFilter
        ? { key: "type", label: `Type: ${TYPE_LABELS[typeFilter] ?? typeFilter}` }
        : null,
      candidateQuery.trim()
        ? { key: "candidate", label: `Search: ${candidateQuery.trim()}` }
        : null,
    ].filter((item): item is { key: string; label: string } => item !== null),
    [statusFilter, typeFilter, candidateQuery]
  );

  function clearFilter(key: string) {
    if (key === "status") setStatusFilter("");
    if (key === "type") setTypeFilter("");
    if (key === "candidate") setCandidateQuery("");
  }

  function resetFilters() {
    setStatusFilter("");
    setTypeFilter("");
    setCandidateQuery("");
  }

  return (
    <PageShell
      title="Evidence Register"
      subtitle="Track all recruitment evidence uploads and verification status"
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="">All Status</option>
                <option value="pending">Pending Verification</option>
                <option value="viewed">Viewed</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="superseded">Superseded</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Evidence Type</label>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="">All Types</option>
                <option value="cv">CV</option>
                <option value="application_form">Application Form</option>
                <option value="dbs_certificate">DBS Certificate</option>
                <option value="reference">Reference</option>
                <option value="qualification_certificate">Qualification</option>
                <option value="id_document">ID Document</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Candidate</label>
              <input
                type="text"
                value={candidateQuery}
                onChange={(event) => setCandidateQuery(event.target.value)}
                placeholder="Search candidate ID or filename..."
                className="w-full rounded-md border px-3 py-2"
              />
            </div>

            <div className="flex items-end gap-2">
              {activeFilters.length > 0 && (
                <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-800">
                  {formatFiltersAppliedLabel(activeFilters.length)}
                </span>
              )}
              <Button variant="outline" className="flex-1" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {activeFilters.map((filter) => (
                <span
                  key={filter.key}
                  className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs text-teal-800"
                >
                  {filter.label}
                  <button
                    type="button"
                    className="font-semibold leading-none text-teal-700 hover:text-teal-900"
                    onClick={() => clearFilter(filter.key)}
                    aria-label={`Remove ${filter.label} filter`}
                  >
                    x
                  </button>
                </span>
              ))}
              <button
                type="button"
                className="text-xs text-gray-600 underline hover:text-gray-900"
                onClick={resetFilters}
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-white p-6">
          <EvidenceRegister
            filterStatus={statusFilter || undefined}
            filterEvidenceType={typeFilter || undefined}
            filterCandidateQuery={candidateQuery.trim() || undefined}
          />
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          Evidence counts are derived from live records in the register above.
        </div>
      </div>
    </PageShell>
  );
}
