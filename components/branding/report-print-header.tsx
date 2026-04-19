import { AcaciaLogo } from '@/components/branding/acacia-logo'

export function ReportPrintHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6 border-b border-slate-300 pb-4 print:mb-4">
      <div className="flex items-start justify-between gap-4">
        <AcaciaLogo />
        <div className="text-right">
          <p className="text-lg font-semibold text-slate-900">{title}</p>
          {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
          <p className="text-xs text-slate-500">Generated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </header>
  )
}
