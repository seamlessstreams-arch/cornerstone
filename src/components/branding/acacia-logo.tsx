import { cn } from "@/lib/utils";

interface AcaciaLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function AcaciaLogo({ className, size = 40, showText = true }: AcaciaLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className="relative shrink-0 overflow-hidden rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-100"
        style={{ width: size, height: size }}
      >
        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-teal-800">A</div>
      </div>
      {showText && (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">Acacia Therapy Homes</p>
          <p className="truncate text-xs text-teal-700">Cornerstone Platform</p>
        </div>
      )}
    </div>
  );
}
