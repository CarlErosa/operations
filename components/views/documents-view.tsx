"use client"

import { useState } from "react"
import { Check, Flag, Plus, X } from "lucide-react"
import { useStore } from "@/lib/store"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/dates"
import {
  DOCUMENT_STAGES,
  DOCUMENT_TYPES,
  type DocumentItem,
  type DocumentStage,
  type DocumentType,
} from "@/lib/types"
import { cn } from "@/lib/utils"

export function DocumentsView() {
  const { documents, role, approveDocument } = useStore()
  const [formOpen, setFormOpen] = useState(false)

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Document pipeline grouped by stage, with the signatory chain for each item."
        actions={
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus />
            Add Document
          </Button>
        }
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

      {formOpen && <DocumentForm onClose={() => setFormOpen(false)} />}
    </div>
  )
}

function DocumentForm({ onClose }: { onClose: () => void }) {
  const { addDocument } = useStore()
  const [title, setTitle] = useState("")
  const [type, setType] = useState<DocumentType>(DOCUMENT_TYPES[0])
  const [stage, setStage] = useState<DocumentStage>("Draft")
  const [preparedBy, setPreparedBy] = useState("")
  const [error, setError] = useState("")

  function submit() {
    if (!title.trim()) {
      setError("A document title is required.")
      return
    }
    if (!preparedBy.trim()) {
      setError("A preparer is required.")
      return
    }
    addDocument({
      title: title.trim(),
      type,
      stage,
      preparedBy: preparedBy.trim(),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold">Add a document</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
              className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DocumentType)}
                className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Stage">
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as DocumentStage)}
                className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {DOCUMENT_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Prepared by">
            <input
              value={preparedBy}
              onChange={(e) => setPreparedBy(e.target.value)}
              placeholder="Officer name"
              className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </Field>

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit}>
            Add document
          </Button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
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
