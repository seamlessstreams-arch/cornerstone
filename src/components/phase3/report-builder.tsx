"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { REPORT_TEMPLATES } from "@/lib/reports/templates";
import type { ReportTemplateConfig, ReportSection } from "@/lib/reports/templates";
import { PrintableReport } from "@/components/phase3/printable-report";
import type { ReportCategory } from "@/lib/reports/templates";
import { useToast } from "@/components/ui/toast";

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  YoungPerson: "Young People",
  HealthSafety: "Health & Safety",
  Recruitment: "Recruitment",
  Compliance: "Compliance",
};

interface ReportBuilderProps {
  onReportGenerated?: (reportId: string, html: string) => void;
}

export function ReportBuilder({ onReportGenerated }: ReportBuilderProps) {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [step, setStep] = useState(1); // 1: template, 2: filters, 3: preview
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplateConfig | null>(null);
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [selectedSections, setSelectedSections] = useState<ReportSection[]>([]);
  const [childId, setChildId] = useState("");
  const [homeId, setHomeId] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [generatedAt, setGeneratedAt] = useState<string>("");

  // Group templates by category
  const templatesByCategory = Object.values(REPORT_TEMPLATES).reduce<Record<string, ReportTemplateConfig[]>>(
    (acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    },
    {}
  );

  const handleTemplateSelect = (template: ReportTemplateConfig) => {
    setSelectedTemplate(template);
    setSelectedSections(template.defaultSections);
    setStep(2);
  };

  useEffect(() => {
    const requestedTemplate = searchParams.get("template");
    if (!requestedTemplate) {
      return;
    }

    const template = Object.values(REPORT_TEMPLATES).find((item) => item.code === requestedTemplate);
    if (!template) {
      return;
    }

    setSelectedTemplate((current) => {
      if (current?.code === template.code) {
        return current;
      }
      setSelectedSections(template.defaultSections);
      setStep(2);
      return template;
    });
  }, [searchParams]);

  const handleSectionToggle = (section: ReportSection) => {
    setSelectedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]));
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate) return;

    setLoading(true);
    try {
      const response = await fetch("/api/phase3/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateCode: selectedTemplate.code,
          options: {
            dateRangeStart,
            dateRangeEnd,
            includedSections: selectedSections,
            childId: childId || undefined,
            homeId: homeId || undefined,
            candidateId: candidateId || undefined,
            includeAttachments: selectedSections.includes("attachments"),
            includeOversight: selectedSections.includes("oversight"),
            includeChronology: selectedSections.includes("chronology"),
            includeAISummary: selectedTemplate.supportsAISummary && selectedSections.includes("summary"),
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to generate report");

      const data = await response.json();
      setPreviewHtml(data.html);
      setGeneratedAt(new Date().toISOString());
      setStep(3);

      if (onReportGenerated) {
        onReportGenerated(data.reportId, data.html);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast("Failed to generate report. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Step 1: Select Template — grouped by category
  if (step === 1) {
    return (
      <div className="space-y-8">
        <h2 className="text-2xl font-bold">Select Report Type</h2>

        {(Object.keys(CATEGORY_LABELS) as ReportCategory[]).map((cat) => {
          const templates = templatesByCategory[cat];
          if (!templates?.length) return null;
          return (
            <div key={cat}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {CATEGORY_LABELS[cat]}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="p-4 border rounded-lg hover:border-teal-500 hover:bg-teal-50 transition text-left"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{template.icon}</span>
                      <div>
                        <h3 className="font-semibold text-sm">{template.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {template.supportsPDFExport && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">PDF</span>
                          )}
                          {template.supportsAISummary && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">AI Summary</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Step 2: Configure Filters
  if (step === 2 && selectedTemplate) {
    return (
      <div className="space-y-6">
        <div>
          <Button variant="outline" onClick={() => setStep(1)}>
            ← Back
          </Button>
        </div>

        <h2 className="text-2xl font-bold">{selectedTemplate.name}</h2>

        {/* Date Range */}
        <div className="space-y-2">
          <label className="font-semibold">Date Range</label>
          <div className="flex gap-4">
            <input
              type="date"
              value={dateRangeStart}
              onChange={(e) => setDateRangeStart(e.target.value)}
              className="px-3 py-2 border rounded"
            />
            <input
              type="date"
              value={dateRangeEnd}
              onChange={(e) => setDateRangeEnd(e.target.value)}
              className="px-3 py-2 border rounded"
            />
          </div>
        </div>

        {/* Context Filters */}
        {selectedTemplate.filterOptions.includes("child") && (
          <div className="space-y-2">
            <label className="font-semibold">Young Person</label>
            <input
              type="text"
              placeholder="Child ID or name"
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        )}

        {selectedTemplate.filterOptions.includes("home") && (
          <div className="space-y-2">
            <label className="font-semibold">Home</label>
            <input
              type="text"
              placeholder="Home ID or name"
              value={homeId}
              onChange={(e) => setHomeId(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        )}

        {selectedTemplate.filterOptions.includes("candidateId") && (
          <div className="space-y-2">
            <label className="font-semibold">Candidate</label>
            <input
              type="text"
              placeholder="Candidate ID or name"
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        )}

        {/* Sections */}
        <div className="space-y-2">
          <label className="font-semibold">Include Sections</label>
          <div className="space-y-2">
            {selectedTemplate.availableSections.map((section) => (
              <label key={section} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedSections.includes(section)}
                  onChange={() => handleSectionToggle(section)}
                  className="w-4 h-4"
                />
                <span className="capitalize">{section.replace("_", " ")}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setStep(1)}>
            Back
          </Button>
          <Button onClick={handleGenerateReport} disabled={loading} className="flex-1">
            {loading ? "Generating..." : "Generate Report"}
          </Button>
        </div>
      </div>
    );
  }

  // Step 3: Preview & Export — branded printable layout
  if (step === 3 && previewHtml && selectedTemplate) {
    return (
      <PrintableReport
        title={selectedTemplate.name}
        subtitle={selectedTemplate.description}
        generatedAt={generatedAt}
        dateRangeStart={dateRangeStart || undefined}
        dateRangeEnd={dateRangeEnd || undefined}
        htmlContent={previewHtml}
        onClose={() => setStep(2)}
      />
    );
  }

  return <div>Loading...</div>;
}
