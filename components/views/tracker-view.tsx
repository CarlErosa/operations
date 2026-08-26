"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Plus, X } from "lucide-react"
import { useStore } from "@/lib/store"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate, relativeLabel, urgencyOf } from "@/lib/dates"
import { statusTone } from "@/lib/ui-maps"
import { TRACKER_STATUSES, type TrackerStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

export function TrackerView() {
  const { tracker, updateTrackerStatus } = useStore()
  const [ownerFilter, setOwnerFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<TrackerStatus | "all">("all")
  const [formOpen, setFormOpen] = useState(false)

  const owners = useMemo(
    () => Array.from(new Set(tracker.map((t) => t.owner))).sort(),
    [tracker],
  )

  const rows = tracker.filter(
    (t) =>
      (ownerFilter === "all" || t.owner === ownerFilter) &&
      (statusFilter === "all" || t.status === statusFilter),
  )

  return (
    <div>
      <PageHeader
        title="Tracker"
        description="All executive deliverables and their current status."
        actions={
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus />
            Add Item
          </Button>
        }
      />
      <div className="p-4 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <FilterSelect
            value={ownerFilter}
            onChange={setOwnerFilter}
            options={[{ label: "All owners", value: "all" }, ...owners.map((o) => ({ label: o, value: o }))]}
          />
          <FilterSelect
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as TrackerStatus | "all")}
            options={[
              { label: "All statuses", value: "all" },
              ...TRACKER_STATUSES.map((s) => ({ label: s, value: s })),
            ]}
          />
          <span className="ml-auto text-xs text-muted-foreground">
            {rows.length} of {tracker.length} items
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-[760px] w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                <th className="px-3 py-2 font-medium">Deliverable</th>
                <th className="px-3 py-2 font-medium">Owner</th>
                <th className="px-3 py-2 font-medium">Reviewer</th>
                <th className="px-3 py-2 font-medium">Target Date</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Blockers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((t) => {
                const urgency = urgencyOf(t.targetDate)
                const showUrgent = t.status !== "Done" && urgency !== "ok"
                return (
                  <tr key={t.id} className="bg-card hover:bg-accent/30">
                    <td className="px-3 py-2.5 font-medium">{t.deliverable}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{t.owner}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{t.reviewer}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col">
                        <span className="tabular-nums">{formatDate(t.targetDate)}</span>
                        {showUrgent && (
                          <span
                            className={cn(
                              "text-xs",
                              urgency === "overdue" ? "text-danger" : "text-warning-foreground",
                            )}
                          >
                            {relativeLabel(t.targetDate)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusEditor
                        status={t.status}
                        onChange={(s) => updateTrackerStatus(t.id, s)}
                      />
                    </td>
                    <td className="max-w-xs px-3 py-2.5 text-muted-foreground">
                      {t.blockers ? (
                        <span className="text-danger">{t.blockers}</span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="bg-card px-3 py-10 text-center text-muted-foreground">
                    No items match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {formOpen && <TrackerItemForm onClose={() => setFormOpen(false)} />}
    </div>
  )
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string }[]
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 appearance-none rounded-md border border-border bg-background pl-2.5 pr-7 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

function StatusEditor({
  status,
  onChange,
}: {
  status: TrackerStatus
  onChange: (s: TrackerStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Click to change status"
      >
        <Badge tone={statusTone[status]} className="gap-1">
          {status}
          <ChevronDown className="size-3 opacity-60" />
        </Badge>
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-30 mt-1 w-40 rounded-md border border-border bg-popover shadow-md"
        >
          {TRACKER_STATUSES.map((s) => (
            <button
              key={s}
              role="option"
              aria-selected={s === status}
              onClick={() => {
                onChange(s)
                setOpen(false)
              }}
              className="flex w-full items-center justify-between px-2.5 py-1.5 text-sm hover:bg-accent"
            >
              <Badge tone={statusTone[s]}>{s}</Badge>
              {s === status && <Check className="size-3.5 text-brand" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function TrackerItemForm({ onClose }: { onClose: () => void }) {
  const { addTrackerItem } = useStore()
  const [deliverable, setDeliverable] = useState("")
  const [owner, setOwner] = useState("")
  const [reviewer, setReviewer] = useState("")
  const [targetDate, setTargetDate] = useState("")
  const [status, setStatus] = useState<TrackerStatus>("Not Started")
  const [blockers, setBlockers] = useState("")
  const [error, setError] = useState("")

  function submit() {
    if (!deliverable.trim()) {
      setError("A deliverable name is required.")
      return
    }
    if (!owner.trim()) {
      setError("An owner is required.")
      return
    }
    if (!reviewer.trim()) {
      setError("A reviewer is required.")
      return
    }
    if (!targetDate) {
      setError("A target date is required.")
      return
    }
    addTrackerItem({
      deliverable: deliverable.trim(),
      owner: owner.trim(),
      reviewer: reviewer.trim(),
      targetDate,
      status,
      blockers: blockers.trim() || undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold">Add a deliverable</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <Field label="Deliverable">
            <input
              value={deliverable}
              onChange={(e) => setDeliverable(e.target.value)}
              placeholder="e.g. Sponsorship deck"
              className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Owner">
              <input
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Officer name"
                className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </Field>
            <Field label="Reviewer">
              <input
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
                placeholder="Officer name"
                className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Target date">
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </Field>
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TrackerStatus)}
                className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {TRACKER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Blockers (optional)">
            <textarea
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              rows={2}
              placeholder="Any blockers or dependencies…"
              className="w-full resize-none rounded-md border border-border bg-background px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </Field>

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit}>
            Add item
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
