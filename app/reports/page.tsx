'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { ProtectedPageBanner } from '@/components/protected-page-banner'
import { PageShell, ShellTable } from '@/components/shell/page-shell'

interface TemplateItem {
  id: string
  name: string
  description: string | null
  category: string
}

interface ReportItem {
  id: string
  title: string
  status: string
  createdAt: string
  templateName: string
}

interface ExportItem {
  id: string
  reportId: string
  format: string
  path: string
  createdAt: string
}

interface DashboardResponse {
  templates: TemplateItem[]
  reports: ReportItem[]
  exports: ExportItem[]
}

interface ApiError {
  error?: string
  requestId?: string
}

interface GeneratedReportResponse {
  id: string
  title: string
  status: string
  createdAt: string
  preview: {
    dateRange: { start: string; end: string }
    metrics: {
      healthSafetyRecords: number
      criticalFindings: number
      pendingVerifications: number
      openActions: number
    }
    aiSummary?: string | null
  }
}

export default function ReportsPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [requestId, setRequestId] = useState('')
  const [preview, setPreview] = useState<GeneratedReportResponse | null>(null)

  const [templateId, setTemplateId] = useState('')
  const [title, setTitle] = useState('Weekly Compliance Summary')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [includeAiSummary, setIncludeAiSummary] = useState(true)
  const [exportReportId, setExportReportId] = useState('')

  const templateOptions = useMemo(() => dashboard?.templates ?? [], [dashboard])

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
    setAuthError('')

    try {
      const response = await fetch('/api/reports')
      const data = (await response.json()) as DashboardResponse | ApiError

      if (!response.ok) {
        const message = 'error' in data && data.error ? data.error : 'Unable to load reports dashboard.'
        setRequestId('requestId' in data && data.requestId ? data.requestId : '')
        if (response.status === 401) {
          setAuthError(message)
        } else {
          setErrorMessage(message)
        }
        setDashboard(null)
        return
      }

      const payload = data as DashboardResponse
      setDashboard(payload)
      if (!templateId && payload.templates.length > 0) {
        setTemplateId(payload.templates[0].id)
      }
      setRequestId('')
    } catch {
      setDashboard(null)
      setErrorMessage('Unexpected error while loading reports dashboard.')
    } finally {
      setIsLoading(false)
    }
  }, [templateId])

  useEffect(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    setStartDate(weekAgo.toISOString().slice(0, 10))
    setEndDate(now.toISOString().slice(0, 10))
    void loadDashboard()
  }, [loadDashboard])

  async function handleGenerateReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')
    setStatusMessage('Generating report...')

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          templateId,
          title,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(`${endDate}T23:59:59.999Z`).toISOString(),
          includeAiSummary,
          filters: { module: 'phase3' }
        })
      })

      const data = (await response.json()) as GeneratedReportResponse | ApiError

      if (!response.ok) {
        setRequestId('requestId' in data && data.requestId ? data.requestId : '')
        setStatusMessage('')
        setErrorMessage('error' in data && data.error ? data.error : 'Unable to generate report.')
        return
      }

      setPreview(data as GeneratedReportResponse)
      setExportReportId((data as GeneratedReportResponse).id)
      setStatusMessage('Report generated successfully. Preview updated below.')
      await loadDashboard()
    } catch {
      setStatusMessage('')
      setErrorMessage('Unexpected error while generating report.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleExport(format: 'pdf' | 'print') {
    if (!exportReportId) {
      setErrorMessage('Enter or generate a report ID before exporting.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setStatusMessage(`Exporting ${format.toUpperCase()}...`)

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export',
          reportId: exportReportId,
          format
        })
      })

      const data = (await response.json()) as { path?: string; error?: string; requestId?: string }

      if (!response.ok) {
        setRequestId(data.requestId ?? '')
        setStatusMessage('')
        setErrorMessage(data.error ?? 'Unable to export report.')
        return
      }

      setStatusMessage(`Export created at ${data.path ?? 'reports bucket'}.`)
      await loadDashboard()
    } catch {
      setStatusMessage('')
      setErrorMessage('Unexpected error while exporting report.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageShell
      title="Reports"
      description="Template-based report builder with filters, AI summary preview, export history, and audit-backed generation."
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Generate Report</h2>
          <form className="mt-4 space-y-3" onSubmit={handleGenerateReport}>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Template</span>
              <select
                value={templateId}
                onChange={(event) => setTemplateId(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              >
                {templateOptions.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium text-slate-700">Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Start Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  required
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">End Date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  required
                />
              </label>
            </div>

            <label className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={includeAiSummary}
                onChange={(event) => setIncludeAiSummary(event.target.checked)}
                className="h-4 w-4"
              />
              Include AI narrative summary
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:bg-slate-400"
            >
              {isSubmitting ? 'Generating...' : 'Generate Report'}
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-700">Export</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                className="min-w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="Report ID"
                value={exportReportId}
                onChange={(event) => setExportReportId(event.target.value)}
              />
              <button
                type="button"
                onClick={() => void handleExport('pdf')}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-900 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-900 hover:text-white disabled:opacity-50"
              >
                Export PDF
              </button>
              <button
                type="button"
                onClick={() => void handleExport('print')}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-900 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-900 hover:text-white disabled:opacity-50"
              >
                Export Print
              </button>
            </div>
          </div>

          <ProtectedPageBanner
            authError={authError}
            error={errorMessage}
            status={statusMessage}
            requestId={requestId}
            signInHref="/auth/sign-in?next=/reports"
          />
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Preview</h2>
            {!preview && <p className="mt-2 text-sm text-slate-600">Generate a report to preview metrics and AI summary.</p>}
            {preview && (
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Report:</span> {preview.title}
                </p>
                <p>
                  <span className="font-semibold">Range:</span>{' '}
                  {new Date(preview.preview.dateRange.start).toLocaleDateString()} -{' '}
                  {new Date(preview.preview.dateRange.end).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-semibold">Metrics:</span> {preview.preview.metrics.healthSafetyRecords} checks,{' '}
                  {preview.preview.metrics.criticalFindings} high/critical, {preview.preview.metrics.pendingVerifications} pending verifications,{' '}
                  {preview.preview.metrics.openActions} open actions.
                </p>
                {preview.preview.aiSummary && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">{preview.preview.aiSummary}</p>
                )}
              </div>
            )}
          </div>

          {isLoading && <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600">Loading reports data...</div>}
        </section>
      </div>

      <ShellTable
        headers={['Report', 'Template', 'Status', 'Created']}
        rows={(dashboard?.reports ?? []).map((report) => [
          `${report.title} (${report.id})`,
          report.templateName,
          report.status,
          new Date(report.createdAt).toLocaleString()
        ])}
      />

      <ShellTable
        headers={['Export ID', 'Report ID', 'Format', 'Storage Path', 'Created']}
        rows={(dashboard?.exports ?? []).map((item) => [
          item.id,
          item.reportId,
          item.format,
          item.path,
          new Date(item.createdAt).toLocaleString()
        ])}
      />
    </PageShell>
  )
}
