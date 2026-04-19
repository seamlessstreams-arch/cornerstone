import { ensurePlatformContext, Phase3Actor, writeAuditLog } from '@/lib/phase3/platform-context'

const DEFAULT_REPORT_TEMPLATES: Array<{
  id: string
  name: string
  description: string
  category: string
}> = [
  {
    id: 'tpl_health_safety_weekly',
    name: 'Health & Safety Weekly Overview',
    description: 'Open checks, severe findings, and maintenance response times.',
    category: 'health_safety'
  },
  {
    id: 'tpl_safer_recruitment_pack',
    name: 'Safer Recruitment Compliance Pack',
    description: 'Candidate pipeline, evidence completion, and verification outcomes.',
    category: 'safer_recruitment'
  },
  {
    id: 'tpl_oversight_actions',
    name: 'Management Oversight and Actions',
    description: 'Oversight decisions, escalations, and delegated tasks.',
    category: 'management_oversight'
  }
]

export interface ReportTemplateItem {
  id: string
  name: string
  description: string | null
  category: string
}

export interface ReportRunItem {
  id: string
  title: string
  status: string
  createdAt: string
  templateName: string
}

export interface ReportExportItem {
  id: string
  reportId: string
  format: string
  path: string
  createdAt: string
}

export interface ReportsDashboard {
  templates: ReportTemplateItem[]
  reports: ReportRunItem[]
  exports: ReportExportItem[]
}

export interface GenerateReportInput {
  templateId: string
  title: string
  startDate: string
  endDate: string
  filters: Record<string, unknown>
  includeAiSummary: boolean
}

type MockGeneratedReport = {
  id: string
  title: string
  status: string
  createdAt: string
  templateName: string
  preview: {
    dateRange: { start: string; end: string }
    filters: Record<string, unknown>
    metrics: {
      healthSafetyRecords: number
      criticalFindings: number
      pendingVerifications: number
      openActions: number
    }
    aiSummary?: string | null
    generatedAt: string
  }
}

type MockExport = {
  id: string
  reportId: string
  format: 'pdf' | 'print'
  path: string
  createdAt: string
}

const mockReports: MockGeneratedReport[] = []
const mockExports: MockExport[] = []

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export async function listReportsDashboard(actor: Phase3Actor): Promise<ReportsDashboard> {
  await ensurePlatformContext(actor)

  return {
    templates: DEFAULT_REPORT_TEMPLATES.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category
    })),
    reports: mockReports
      .slice()
      .reverse()
      .map((report) => ({
        id: report.id,
        title: report.title,
        status: report.status,
        createdAt: report.createdAt,
        templateName: report.templateName
      })),
    exports: mockExports
      .slice()
      .reverse()
      .map((item) => ({
        id: item.id,
        reportId: item.reportId,
        format: item.format,
        path: item.path,
        createdAt: item.createdAt
      }))
  }
}

async function buildReportContent(params: {
  startDate: string
  endDate: string
  filters: Record<string, unknown>
  includeAiSummary: boolean
}) {
  const metrics = {
    healthSafetyRecords: Math.floor(Math.random() * 16) + 4,
    criticalFindings: Math.floor(Math.random() * 4),
    pendingVerifications: Math.floor(Math.random() * 6),
    openActions: Math.floor(Math.random() * 8)
  }

  const aiSummary = params.includeAiSummary
    ? `AI summary: ${metrics.healthSafetyRecords} checks in range, ${metrics.criticalFindings} high-risk findings, ${metrics.pendingVerifications} pending verifications, and ${metrics.openActions} open actions requiring follow-up.`
    : null

  return {
    dateRange: {
      start: params.startDate,
      end: params.endDate
    },
    filters: params.filters,
    metrics,
    aiSummary,
    generatedAt: new Date().toISOString()
  }
}

export async function generateReport(input: GenerateReportInput, actor: Phase3Actor) {
  const context = await ensurePlatformContext(actor)

  const template = DEFAULT_REPORT_TEMPLATES.find((item) => item.id === input.templateId)
  if (!template) {
    throw new Error('Unable to generate report: Unknown template id')
  }

  const content = await buildReportContent({
    startDate: input.startDate,
    endDate: input.endDate,
    filters: input.filters,
    includeAiSummary: input.includeAiSummary
  })

  const reportId = generateId('report')
  const createdAt = new Date().toISOString()

  mockReports.push({
    id: reportId,
    title: input.title,
    status: 'generated',
    createdAt,
    templateName: template.name,
    preview: content
  })

  await writeAuditLog({
    organisationId: context.organisationId,
    homeId: context.homeId,
    platformUserId: context.platformUserId,
    action: 'REPORT_GENERATED',
    entityType: 'report',
    entityId: reportId,
    payload: {
      templateId: input.templateId,
      dateRange: { start: input.startDate, end: input.endDate },
      filters: input.filters
    }
  })

  return {
    id: reportId,
    title: input.title,
    status: 'generated',
    createdAt,
    preview: content
  }
}

export async function exportReport(reportId: string, format: 'pdf' | 'print', actor: Phase3Actor) {
  const context = await ensurePlatformContext(actor)

  const report = mockReports.find((item) => item.id === reportId)
  if (!report) {
    throw new Error(`Unable to export report: Report ${reportId} not found`)
  }

  const exportId = generateId('export')
  const createdAt = new Date().toISOString()
  const path = `${context.organisationId}/${reportId}/${format}-${Date.now()}.json`

  mockExports.push({
    id: exportId,
    reportId,
    format,
    path,
    createdAt
  })

  await writeAuditLog({
    organisationId: context.organisationId,
    homeId: context.homeId,
    platformUserId: context.platformUserId,
    action: 'REPORT_EXPORTED',
    entityType: 'report_export',
    entityId: exportId,
    payload: {
      reportId,
      format,
      path
    }
  })

  return {
    id: exportId,
    path,
    createdAt
  }
}
