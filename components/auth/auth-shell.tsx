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
    <main className="workspace-enter relative flex min-h-svh items-center justify-center bg-background/55 bg-[linear-gradient(135deg,oklch(0.08_0.03_270_/_0.7),oklch(0.16_0.06_300_/_0.58)),url('/11zon_resized.jpeg')] bg-cover bg-center bg-fixed p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3">
            <img
              src="/icpep_logo.jpg"
              alt="ICpEP logo"
              className="mx-auto h-10 w-10 rounded-md object-cover"
            />
          </div>
          <h1 className="auth-heading text-lg font-semibold text-balance">{title}</h1>
          <p className="auth-subtitle mt-1 text-sm text-pretty">{subtitle}</p>
        </div>
        <div className="auth-glass-card rounded-2xl border p-5 backdrop-blur-2xl">
          {children}
        </div>
      </div>
    </main>
  )
}
