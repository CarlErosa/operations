"use client"

import { Check, Flag } from "lucide-react"
import { useStore } from "@/lib/store"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/dates"
import { DOCUMENT_STAGES, type DocumentItem } from "@/lib/types"
import { cn } from "@/lib/utils"

export function DocumentsView() {
  const { documents, role, approveDocument } = useStore()

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Document pipeline grouped by stage, with the signatory chain for each item."
      />
      <div className="space-y-6 p-6">
        {DOCUMENT_STAGES.map((stage) => {
          const items = documents.filter((d) => d.stage === stage)
          if (items.length === 0) return null
          return (
            <section key={stage}>
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {stage}
                </h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {items.length}
                </span>
              </div>
              <div className="overflow-hidden rounded-lg border border-border">
                <ul className="divide-y divide-border">
                  {items.map((doc) => (
                    <DocumentRow
                      key={doc.id}
                      doc={doc}
                      canApprove={role === "President" && doc.stage === "Approval"}
                      onApprove={() => approveDocument(doc.id)}
                    />
                  ))}
                </ul>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function DocumentRow({
  doc,
  canApprove,
  onApprove,
}: {
  doc: DocumentItem
  canApprove: boolean
  onApprove: () => void
}) {
  const unresolved = doc.escalations.filter((e) => !e.resolved).length
  return (
    <li className="flex flex-col gap-3 bg-card px-4 py-3 md:flex-row md:items-center md:gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{doc.title}</span>
          {unresolved > 0 && <Flag className="size-3.5 shrink-0 text-danger" />}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Badge tone="outline">{doc.type}</Badge>
          <span className="tabular-nums">v. {formatDate(doc.versionDate)}</span>
        </div>
      </div>

      <SignatoryChain doc={doc} />

      <div className="md:w-28 md:text-right">
        {canApprove ? (
          <Button size="sm" onClick={onApprove}>
            <Check />
            Approve
          </Button>
        ) : doc.stage === "Approval" ? (
          <span className="text-xs text-muted-foreground">President only</span>
        ) : null}
      </div>
    </li>
  )
}

function SignatoryChain({ doc }: { doc: DocumentItem }) {
  const steps = [
    { label: "Prepared", name: doc.preparedBy },
    { label: "Reviewed", name: doc.reviewedBy },
    { label: "Approved", name: doc.approvedBy },
  ]
  return (
    <ol className="flex items-center gap-1">
      {steps.map((step, i) => {
        const done = Boolean(step.name)
        return (
          <li key={step.label} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-1" title={step.name ?? "Pending"}>
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-medium ring-1 ring-inset",
                  done
                    ? "bg-success/10 text-success ring-success/30"
                    : "bg-muted text-muted-foreground/60 ring-border",
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className="w-16 truncate text-center text-[10px] leading-tight text-muted-foreground">
                {step.name ?? step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "mb-4 h-px w-4",
                  done ? "bg-success/40" : "bg-border",
                )}
                aria-hidden
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
