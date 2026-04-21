"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { AcaciaLogo } from "@/components/branding/acacia-logo";

interface PrintableReportProps {
  title: string;
  subtitle?: string;
  generatedBy?: string;
  generatedAt?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  htmlContent?: string;
  children?: React.ReactNode;
  onClose?: () => void;
}

export function PrintableReport({
  title,
  subtitle,
  generatedBy,
  generatedAt,
  dateRangeStart,
  dateRangeEnd,
  htmlContent,
  children,
  onClose,
}: PrintableReportProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = generatedAt
    ? new Date(generatedAt).toLocaleString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const dateRange =
    dateRangeStart && dateRangeEnd
      ? `${new Date(dateRangeStart).toLocaleDateString("en-GB")} – ${new Date(dateRangeEnd).toLocaleDateString("en-GB")}`
      : null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 overflow-y-auto">
      {/* Toolbar (hidden on print) */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b shadow-sm px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              ← Back
            </Button>
          )}
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handlePrint} className="bg-teal-600 hover:bg-teal-700">
            🖨 Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Report content */}
      <div
        ref={printRef}
        className="max-w-4xl mx-auto my-6 print:my-0 bg-white shadow-md print:shadow-none print:max-w-none"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        {/* Print global styles injected via a style tag */}
        <style>{`
          @media print {
            @page {
              margin: 20mm 15mm;
              size: A4;
            }
            .print\\:hidden { display: none !important; }
            body { background: white !important; }
            .report-page { box-shadow: none !important; }
          }
        `}</style>

        <div className="report-page p-10 print:p-0">
          {/* Branded header */}
          <header className="mb-8 pb-6 border-b-2 border-teal-600">
            <div className="flex items-start justify-between">
              <AcaciaLogo size={52} showText />
              <div className="text-right text-sm text-gray-500">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Confidential</p>
                <p>{formattedDate}</p>
                {generatedBy && <p className="text-xs">Prepared by: {generatedBy}</p>}
              </div>
            </div>
            <div className="mt-6">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
              {dateRange && (
                <p className="text-sm text-teal-700 mt-2 font-medium">Period: {dateRange}</p>
              )}
            </div>
          </header>

          {/* Main content */}
          <main>
            {htmlContent ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            ) : (
              children
            )}
          </main>

          {/* Footer */}
          <footer className="mt-16 pt-6 border-t border-gray-200 text-xs text-gray-400 flex justify-between">
            <div>
              <p className="font-medium text-gray-500">Acacia Therapy Homes</p>
              <p>Cornerstone Operating System — Confidential</p>
            </div>
            <div className="text-right">
              <p>This document is confidential and intended for authorised personnel only.</p>
              <p>Do not share, copy or distribute without prior approval.</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
