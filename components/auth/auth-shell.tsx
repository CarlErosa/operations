import type { ReactNode } from "react"

export const inputClass =
  "h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-md bg-brand text-sm font-bold text-brand-foreground">
            SE
          </div>
          <h1 className="text-lg font-semibold text-foreground text-balance">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">{subtitle}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          {children}
        </div>
      </div>
    </main>
  )
}
