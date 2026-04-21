import { AcaciaLogo } from "@/components/branding/acacia-logo";

interface ReportPrintHeaderProps {
  title: string;
  subtitle?: string;
}

export function ReportPrintHeader({ title, subtitle }: ReportPrintHeaderProps) {
  return (
    <header className="mb-6 border-b border-slate-300 pb-4 print:mb-4">
      <div className="flex items-center justify-between gap-4">
        <AcaciaLogo showText />
        <div className="text-right">
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
    </header>
  );
}
