import type { ReactNode } from "react"

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="sticky top-0 z-10 flex flex-col items-start justify-between gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:px-6 sm:py-4">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-balance">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">{actions}</div>}
    </header>
  )
}
