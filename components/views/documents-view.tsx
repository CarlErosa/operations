"use client"

import { useState } from "react"
import {
  Check,
  Eye,
  FileCheck,
  Flag,
  Plus,
  RotateCcw,
  Send,
  ThumbsUp,
  Upload,
  X,
} from "lucide-react"
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
  const {
    documents,
    role,
    sendForReview,
    reviewDocument,
    passDocument,
    failDocument,
    approveDocument,
  } = useStore()
  const [formOpen, setFormOpen] = useState(false)
  const [viewId, setViewId] = useState<string | null>(null)
  const [failId, setFailId] = useState<string | null>(null)
  const [reviewId, setReviewId] = useState<string | null>(null)
  const [approveId, setApproveId] = useState<string | null>(null)
  const viewedDoc = documents.find((d) => d.id === viewId) ?? null
  const reviewDoc = documents.find((d) => d.id === reviewId) ?? null
  const approveDoc = documents.find((d) => d.id === approveId) ?? null
  const canReview = role === "President" || role === "Reviewer"
  const canApprove = role === "President"

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
                      canReview={canReview}
                      canApprove={canApprove}
                      onSend={() => sendForReview(doc.id)}
                      onReview={() => setReviewId(doc.id)}
                      onPass={() => passDocument(doc.id)}
                      onFail={() => setFailId(doc.id)}
                      onApprove={() => setApproveId(doc.id)}
                      onView={() => setViewId(doc.id)}
                    />
                  ))}
                </ul>
              </div>
            </section>
          )
        })}
      </div>

      {formOpen && <DocumentForm onClose={() => setFormOpen(false)} />}
      {viewedDoc && (
        <DocumentDetail doc={viewedDoc} onClose={() => setViewId(null)} />
      )}
      {failId && (
        <FailForm
          onSubmit={(reason) => {
            failDocument(failId, reason)
            setFailId(null)
          }}
          onClose={() => setFailId(null)}
        />
      )}
      {reviewDoc && (
        <SignForm
          doc={reviewDoc}
          title="Mark reviewed & e-sign"
          description="containing your reviewer e-signature to complete the review."
          submitLabel="Reviewed & Sign"
          onSubmit={(fileName) => {
            reviewDocument(reviewDoc.id, fileName)
            setReviewId(null)
          }}
          onClose={() => setReviewId(null)}
        />
      )}
      {approveDoc && (
        <SignForm
          doc={approveDoc}
          title="Approve & e-sign"
          description="containing your e-signature to finalize approval."
          submitLabel="Approve & Sign"
          onSubmit={(fileName) => {
            approveDocument(approveDoc.id, fileName)
            setApproveId(null)
          }}
          onClose={() => setApproveId(null)}
        />
      )}
    </div>
  )
}

function SignForm({
  doc,
  title,
  description,
  submitLabel,
  onSubmit,
  onClose,
}: {
  doc: DocumentItem
  title: string
  description: string
  submitLabel: string
  onSubmit: (fileName: string) => void
  onClose: () => void
}) {
  const [fileName, setFileName] = useState("")
  const [error, setError] = useState("")

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF file.")
      setFileName("")
      return
    }
    setError("")
    setFileName(file.name)
  }

  function submit() {
    if (!fileName) {
      setError("Upload the signed PDF before continuing.")
      return
    }
    onSubmit(fileName)
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </div>
        <div className="space-y-3 p-5">
          <p className="text-sm text-muted-foreground">
            Re-upload{" "}
            <span className="font-medium text-foreground">{doc.title}</span> as a
            signed PDF {description}
          </p>
          <Field label="Signed PDF">
            <label
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-background px-4 py-6 text-center transition-colors hover:border-ring",
                fileName && "border-success/50 bg-success/5",
              )}
            >
              {fileName ? (
                <>
                  <FileCheck className="size-6 text-success" />
                  <span className="text-sm font-medium text-foreground">{fileName}</span>
                  <span className="text-xs text-muted-foreground">Click to replace</span>
                </>
              ) : (
                <>
                  <Upload className="size-6 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Upload signed PDF
                  </span>
                  <span className="text-xs text-muted-foreground">PDF only</span>
                </>
              )}
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={onFile}
              />
            </label>
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={!fileName}>
            <Check />
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

function FailForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (reason: string) => void
  onClose: () => void
}) {
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  function submit() {
    if (!reason.trim()) {
      setError("A reason is required to return this document.")
      return
    }
    onSubmit(reason.trim())
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold">Return for revision</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </div>
        <div className="space-y-3 p-5">
          <Field label="Reason for failing the review">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Explain what needs to change before this can pass review…"
              className="w-full resize-none rounded-md border border-border bg-background px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            The document returns to Draft with this note attached.
          </p>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" variant="destructive" onClick={submit}>
            <RotateCcw />
            Return to Draft
          </Button>
        </div>
      </div>
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
  canReview,
  canApprove,
  onSend,
  onReview,
  onPass,
  onFail,
  onApprove,
  onView,
}: {
  doc: DocumentItem
  canReview: boolean
  canApprove: boolean
  onSend: () => void
  onReview: () => void
  onPass: () => void
  onFail: () => void
  onApprove: () => void
  onView: () => void
}) {
  const unresolved = doc.escalations.filter((e) => !e.resolved).length
  return (
    <li className="flex flex-col gap-3 bg-card px-4 py-3 md:flex-row md:items-center md:gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{doc.title}</span>
          {unresolved > 0 && <Flag className="size-3.5 shrink-0 text-danger" />}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge tone="outline">{doc.type}</Badge>
          <span className="tabular-nums">v. {formatDate(doc.versionDate)}</span>
          {doc.stage === "Draft" && doc.failReason && (
            <span className="flex items-center gap-1 text-danger">
              <RotateCcw className="size-3" />
              Returned: {doc.failReason}
            </span>
          )}
        </div>
      </div>

      <SignatoryChain doc={doc} />

      <div className="flex items-center gap-2 md:justify-end">
        <Button variant="outline" size="sm" onClick={onView}>
          <Eye />
          View
        </Button>
        <StageActions
          doc={doc}
          canReview={canReview}
          canApprove={canApprove}
          onSend={onSend}
          onReview={onReview}
          onPass={onPass}
          onFail={onFail}
          onApprove={onApprove}
        />
      </div>
    </li>
  )
}

function StageActions({
  doc,
  canReview,
  canApprove,
  onSend,
  onReview,
  onPass,
  onFail,
  onApprove,
}: {
  doc: DocumentItem
  canReview: boolean
  canApprove: boolean
  onSend: () => void
  onReview: () => void
  onPass: () => void
  onFail: () => void
  onApprove: () => void
}) {
  switch (doc.stage) {
    case "Draft":
      return (
        <Button size="sm" onClick={onSend}>
          <Send />
          Send for Review
        </Button>
      )
    case "Reviewing":
      return canReview ? (
        <Button size="sm" onClick={onReview}>
          <Check />
          Reviewed
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">Reviewer only</span>
      )
    case "Reviewed":
      return canReview ? (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="destructive" onClick={onFail}>
            <RotateCcw />
            Fail
          </Button>
          <Button size="sm" onClick={onPass}>
            <ThumbsUp />
            Pass
          </Button>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">Reviewer only</span>
      )
    case "Up for Approval":
      return canApprove ? (
        <Button size="sm" onClick={onApprove}>
          <Check />
          Approve
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">President only</span>
      )
    default:
      return null
  }
}

function DocumentDetail({
  doc,
  onClose,
}: {
  doc: DocumentItem
  onClose: () => void
}) {
  const unresolved = doc.escalations.filter((e) => !e.resolved)
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{doc.title}</h2>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge tone="outline">{doc.type}</Badge>
              <Badge tone="neutral">{doc.stage}</Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Detail label="Prepared by" value={doc.preparedBy} />
            <Detail label="Version date" value={formatDate(doc.versionDate)} />
            <Detail label="Reviewed by" value={doc.reviewedBy ?? "Pending"} />
            <Detail label="Approved by" value={doc.approvedBy ?? "Pending"} />
          </div>

          <div>
            <h3 className="mb-2 text-xs font-medium text-foreground">Signatory chain</h3>
            <SignatoryChain doc={doc} />
          </div>

          {(doc.reviewedFileName || doc.signedFileName) && (
            <div className="space-y-2">
              {doc.reviewedFileName && (
                <SignedFile label="Reviewer signed PDF" fileName={doc.reviewedFileName} />
              )}
              {doc.signedFileName && (
                <SignedFile label="Approver signed PDF" fileName={doc.signedFileName} />
              )}
            </div>
          )}

          {doc.stage === "Draft" && doc.failReason && (
            <div className="rounded-md border border-danger/30 bg-danger/5 p-3">
              <h3 className="mb-1 flex items-center gap-1.5 text-xs font-medium text-danger">
                <RotateCcw className="size-3.5" />
                Returned for revision
              </h3>
              <p className="text-sm text-muted-foreground">{doc.failReason}</p>
            </div>
          )}

          {unresolved.length > 0 && (
            <div>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-danger">
                <Flag className="size-3.5" />
                Open escalations
              </h3>
              <ul className="space-y-1">
                {unresolved.map((e) => (
                  <li key={e.id} className="text-sm text-muted-foreground">
                    {e.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

function SignedFile({ label, fileName }: { label: string; fileName: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/5 p-3">
      <FileCheck className="size-5 shrink-0 text-success" />
      <div className="min-w-0">
        <h3 className="text-xs font-medium text-foreground">{label}</h3>
        <p className="truncate text-sm text-muted-foreground">{fileName}</p>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
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
