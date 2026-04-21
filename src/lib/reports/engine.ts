/**
 * Report Generation Engine for Phase 3
 * Handles report compilation, filtering, and formatting
 */

import type { ReportTemplateConfig, ReportSection } from "@/lib/reports/templates";

export interface ReportBuilderOptions {
  reportTemplateId: string;
  childId?: string;
  homeId?: string;
  candidateId?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  includedSections: ReportSection[];
  includeAttachments: boolean;
  includeOversight: boolean;
  includeChronology: boolean;
  includeAISummary: boolean;
  status?: string;
  riskType?: string;
}

export interface ReportEntry {
  id: string;
  timestamp: string;
  title: string;
  content: string;
  category: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  attachments?: ReportAttachment[];
}

export interface ReportAttachment {
  id: string;
  fileName: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
}

export interface ReportOversightEntry {
  id: string;
  timestamp: string;
  reviewer: string;
  status: "approved" | "returned" | "escalated";
  narrative: string;
  analysis?: string;
}

export interface ReportData {
  title: string;
  subtitle?: string;
  generatedBy: {
    id: string;
    name: string;
    email: string;
  };
  generatedAt: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  child?: {
    id: string;
    firstName: string;
    lastName: string;
    dob?: string;
  };
  home?: {
    id: string;
    name: string;
  };
  candidate?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  summary?: {
    text: string;
    aiGenerated?: boolean;
    generatedAt?: string;
  };
  entries: ReportEntry[];
  attachments?: ReportAttachment[];
  oversightEntries?: ReportOversightEntry[];
  chronologyEvents?: ReportEntry[];
  actions?: ReportAction[];
  signOffRequired?: boolean;
  signedBy?: string;
  signedAt?: string;
}

export interface ReportAction {
  id: string;
  description: string;
  dueDate: string;
  owner: string;
  status: "open" | "in_progress" | "completed" | "overdue";
  createdAt: string;
}

export interface ReportGenerationRequest {
  template: ReportTemplateConfig;
  options: ReportBuilderOptions;
  userId: string;
  userName: string;
  userEmail: string;
}

/**
 * Report generation functions
 */

export function createReportDataStructure(request: ReportGenerationRequest): ReportData {
  const { template, options, userId, userName, userEmail } = request;

  return {
    title: template.name,
    subtitle: template.description,
    generatedBy: {
      id: userId,
      name: userName,
      email: userEmail,
    },
    generatedAt: new Date().toISOString(),
    dateRangeStart: options.dateRangeStart,
    dateRangeEnd: options.dateRangeEnd,
    entries: [],
    actions: [],
  };
}

export function validateReportOptions(template: ReportTemplateConfig, options: ReportBuilderOptions): string[] {
  const errors: string[] = [];

  // Check required sections exist
  if (!options.includedSections || options.includedSections.length === 0) {
    errors.push("At least one section must be included");
  }

  // Validate sections are available for this template
  const invalidSections = options.includedSections.filter((s) => !template.availableSections.includes(s));
  if (invalidSections.length > 0) {
    errors.push(`Invalid sections: ${invalidSections.join(", ")}`);
  }

  // Check date range validity
  if (options.dateRangeStart && options.dateRangeEnd) {
    if (new Date(options.dateRangeStart) > new Date(options.dateRangeEnd)) {
      errors.push("Date range start must be before end date");
    }
  }

  // Template-specific validation
  if (template.category === "Recruitment" && !options.candidateId) {
    errors.push("Candidate ID required for recruitment reports");
  }

  if (template.category === "HealthSafety" && !options.homeId) {
    errors.push("Home ID required for Health & Safety reports");
  }

  return errors;
}

export function generateReportHTML(reportData: ReportData): string {
  const { title, subtitle, generatedBy, generatedAt, entries, summary } = reportData;

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          border-bottom: 3px solid #1F2937;
          padding-bottom: 20px;
          margin-bottom: 20px;
        }
        .title {
          font-size: 28px;
          font-weight: bold;
          color: #1F2937;
        }
        .subtitle {
          font-size: 14px;
          color: #666;
          margin-top: 5px;
        }
        .metadata {
          font-size: 12px;
          color: #999;
          margin-top: 15px;
          line-height: 1.6;
        }
        .summary-section {
          background-color: #F3F4F6;
          padding: 15px;
          border-left: 4px solid #3B82F6;
          margin: 20px 0;
          border-radius: 4px;
        }
        .summary-title {
          font-weight: bold;
          color: #1F2937;
          margin-bottom: 10px;
        }
        .entry {
          margin: 20px 0;
          padding: 15px;
          border: 1px solid #E5E7EB;
          border-radius: 4px;
          page-break-inside: avoid;
        }
        .entry-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          border-bottom: 1px solid #E5E7EB;
          padding-bottom: 10px;
        }
        .entry-title {
          font-weight: bold;
          color: #1F2937;
        }
        .entry-date {
          color: #666;
          font-size: 12px;
        }
        .entry-content {
          line-height: 1.6;
          color: #333;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #E5E7EB;
          font-size: 12px;
          color: #999;
        }
        @media print {
          body {
            margin: 0;
          }
          .entry {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${title}</div>
        <div class="subtitle">${subtitle || ""}</div>
        <div class="metadata">
          <div><strong>Generated:</strong> ${new Date(generatedAt).toLocaleString()}</div>
          <div><strong>Generated by:</strong> ${generatedBy.name} (${generatedBy.email})</div>
        </div>
      </div>
  `;

  if (summary) {
    html += `
      <div class="summary-section">
        <div class="summary-title">Summary</div>
        <div>${summary.text}</div>
        ${summary.aiGenerated ? '<div style="font-size: 11px; color: #666; margin-top: 5px;">AI-generated summary</div>' : ""}
      </div>
    `;
  }

  for (const entry of entries) {
    html += `
      <div class="entry">
        <div class="entry-header">
          <div class="entry-title">${entry.title}</div>
          <div class="entry-date">${new Date(entry.timestamp).toLocaleString()}</div>
        </div>
        <div class="entry-content">${entry.content}</div>
        <div style="font-size: 11px; color: #999; margin-top: 10px;">
          By: ${entry.author.name}
        </div>
      </div>
    `;
  }

  html += `
    <div class="footer">
      <p>This is a confidential document. Do not share without authorization.</p>
      <p>Report generated by Cornerstone Operating System</p>
    </div>
  </body>
  </html>
  `;

  return html;
}

export function formatReportForPDF(reportData: ReportData): string {
  // In real implementation, would use a library like jsPDF or puppeteer
  return generateReportHTML(reportData);
}

export function generateReportTitle(template: ReportTemplateConfig, reportData: ReportData): string {
  let title = template.name;

  if (reportData.child) {
    title += ` - ${reportData.child.firstName} ${reportData.child.lastName}`;
  }

  if (reportData.home) {
    title += ` - ${reportData.home.name}`;
  }

  if (reportData.dateRangeStart && reportData.dateRangeEnd) {
    const start = new Date(reportData.dateRangeStart).toLocaleDateString();
    const end = new Date(reportData.dateRangeEnd).toLocaleDateString();
    title += ` (${start} to ${end})`;
  }

  return title;
}

export interface ReportPreview {
  title: string;
  entriesCount: number;
  dateRange: string;
  sections: string[];
  fileSize: string;
}

export function createReportPreview(template: ReportTemplateConfig, reportData: ReportData): ReportPreview {
  const dateRange =
    reportData.dateRangeStart && reportData.dateRangeEnd
      ? `${new Date(reportData.dateRangeStart).toLocaleDateString()} - ${new Date(reportData.dateRangeEnd).toLocaleDateString()}`
      : "No date range";

  const html = generateReportHTML(reportData);
  const fileSizeKB = Math.round(html.length / 1024);

  return {
    title: generateReportTitle(template, reportData),
    entriesCount: reportData.entries.length,
    dateRange,
    sections: ["Summary", "Entries", "Overview"],
    fileSize: `${fileSizeKB} KB`,
  };
}
