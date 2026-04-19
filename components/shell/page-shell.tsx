import { ReactNode } from 'react'

interface PageShellProps {
  title: string
  description: string
  children: ReactNode
}

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Acacia Therapy Homes</p>
        <h1 className="mt-1 text-2xl font-semibold leading-tight text-slate-900 sm:text-[1.7rem]">{title}</h1>
        <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-700">{description}</p>
      </div>
      {children}
    </section>
  )
}

export function ShellCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <div className="mt-3 text-sm text-slate-700">{children}</div>
    </article>
  )
}

export function ShellTable({
  headers,
  rows,
  emptyMessage = 'No records available yet.'
}: {
  headers: string[]
  rows: Array<Array<ReactNode>>
  emptyMessage?: string
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 text-left font-semibold text-slate-700">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-8 text-center text-sm text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={`${index}-${cellIndex}`} className="px-4 py-3 text-slate-700">
                    {cell ?? '-'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </div>
  )
}

export function LoadingState({ message }: { message: string }) {
  return <div className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">{message}</div>
}

export function ErrorState({ message }: { message: string }) {
  return <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</div>
}
