"use client"

import { useCallback, useState } from "react"
import { ArrowRight, Clock, Flag, Plus, X } from "lucide-react"
import { useStore } from "@/lib/store"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  formatDate,
  formatShort,
  leadTimeDeadline,
  relativeLabel,
  urgencyOf,
} from "@/lib/dates"
import { departmentColor, urgencyTone } from "@/lib/ui-maps"
import { DEPARTMENTS, EVENT_STAGES, type Department, type EventItem, type EventStage } from "@/lib/types"
import { cn } from "@/lib/utils"

export function EventsView() {
  const { events, setEventStage } = useStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [dragOverStage, setDragOverStage] = useState<EventStage | null>(null)
  const selected = events.find((e) => e.id === selectedId) ?? null

  const onDragOver = useCallback((e: React.DragEvent, stage: EventStage) => {
    e.preventDefault()
    setDragOverStage(stage)
  }, [])

  const onDragLeave = useCallback(() => setDragOverStage(null), [])

  const onDrop = useCallback(
    (e: React.DragEvent, stage: EventStage) => {
      e.preventDefault()
      setDragOverStage(null)
      const id = e.dataTransfer.getData("text/plain")
      if (id) setEventStage(id, stage)
    },
    [setEventStage],
  )

  return (
    <div>
      <PageHeader
        title="Events"
        description="Event pipeline across the 7 SOP stages. Cards warn when the lead-time deadline is near."
        actions={
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus />
            Add Event
          </Button>
        }
      />
      <div className="overflow-x-auto p-6">
        <div className="flex min-w-max gap-3">
          {EVENT_STAGES.map((stage) => {
            const items = events.filter((e) => e.stage === stage)
            const isApproval = stage === "Final Approval"
            return (
              <div key={stage} className="flex w-64 shrink-0 flex-col">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {isApproval && <Flag className="size-3 text-brand" />}
                    {stage}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {items.length}
                  </span>
                </div>
                <div
                  onDragOver={(e) => onDragOver(e, stage)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, stage)}
                  className={cn(
                    "flex min-h-24 flex-1 flex-col gap-2 rounded-lg border border-dashed border-border p-2 transition-colors",
                    isApproval && "border-brand/40 bg-brand/5",
                    dragOverStage === stage && "border-ring bg-accent/50",
                  )}
                >
                  {items.map((e) => (
                    <EventCard
                      key={e.id}
                      event={e}
                      onClick={() => setSelectedId(e.id)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selected && (
        <EventDetail event={selected} onClose={() => setSelectedId(null)} />
      )}
      {formOpen && <EventForm onClose={() => setFormOpen(false)} />}
    </div>
  )
}

function EventForm({ onClose }: { onClose: () => void }) {
  const { addEvent } = useStore()
  const [name, setName] = useState("")
  const [department, setDepartment] = useState<Department>("Operations")
  const [owner, setOwner] = useState("")
  const [targetDate, setTargetDate] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")

  function submit() {
    if (!name.trim()) {
      setError("An event name is required.")
      return
    }
    if (!owner.trim()) {
      setError("An owner is required.")
      return
    }
    if (!targetDate) {
      setError("A target date is required.")
      return
    }
    addEvent({
      name: name.trim(),
      department,
      owner: owner.trim(),
      targetDate,
      notes: notes.trim(),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold">Add an event</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <Field label="Event name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. TechSummit 2027"
              className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Department">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Target date">
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </Field>
          </div>

          <Field label="Owner">
            <input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Officer name"
              className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Brief description or scope…"
              className="w-full resize-none rounded-md border border-border bg-background px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </Field>

          <p className="text-xs text-muted-foreground">
            New events start in the <span className="font-medium">Concept</span> stage.
          </p>

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit}>
            Add event
          </Button>
        </div>
      </div>
    </div>
  )
}

function EventCard({
  event,
  onClick,
}: {
  event: EventItem
  onClick: () => void
}) {
  const deadline = leadTimeDeadline(event.targetDate, event.stage)
  const urgency = urgencyOf(deadline)
  const unresolved = event.escalations.filter((e) => !e.resolved).length

  return (
    <button
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", event.id)}
      onClick={onClick}
      className="flex flex-col gap-2 rounded-md border border-border bg-card p-2.5 text-left shadow-sm transition-colors hover:border-ring cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-snug text-pretty">
          {event.name}
        </span>
        {unresolved > 0 && (
          <Flag className="mt-0.5 size-3.5 shrink-0 text-danger" />
        )}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span
          className={cn("size-2 rounded-full", departmentColor[event.department])}
          aria-hidden
        />
        {event.department}
        <span className="text-muted-foreground/40">·</span>
        {event.owner}
      </div>
      <div className="flex items-center gap-1 text-xs">
        <Clock
          className={cn(
            "size-3",
            urgency === "ok" ? "text-muted-foreground" : "text-warning-foreground",
          )}
        />
        <span className="text-muted-foreground">Lead-time</span>
        <Badge tone={urgencyTone[urgency]} className="ml-auto">
          {urgency === "ok" ? formatShort(deadline) : relativeLabel(deadline)}
        </Badge>
      </div>
    </button>
  )
}

function EventDetail({
  event,
  onClose,
}: {
  event: EventItem
  onClose: () => void
}) {
  const { advanceEventStage } = useStore()
  const stageIdx = EVENT_STAGES.indexOf(event.stage)
  const nextStage = EVENT_STAGES[stageIdx + 1]
  const deadline = leadTimeDeadline(event.targetDate, event.stage)
  const urgency = urgencyOf(deadline)
  const flaggedForPresident = event.stage === "Final Approval"

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div
        className="absolute inset-0 bg-foreground/20"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative flex h-dvh w-full max-w-md flex-col border-l border-border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span
                className={cn("size-2.5 rounded-full", departmentColor[event.department])}
                aria-hidden
              />
              <span className="text-xs text-muted-foreground">
                {event.department}
              </span>
            </div>
            <h2 className="text-base font-semibold text-balance">{event.name}</h2>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {flaggedForPresident && (
            <div className="flex items-start gap-2 rounded-md border border-brand/30 bg-brand/5 p-3 text-sm">
              <Flag className="mt-0.5 size-4 shrink-0 text-brand" />
              <p className="text-foreground">
                Flagged for <span className="font-semibold">President</span>{" "}
                approval before it can proceed to Execution.
              </p>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Current stage</dt>
              <dd className="mt-0.5 font-medium">{event.stage}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Owner</dt>
              <dd className="mt-0.5 font-medium">{event.owner}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Target date</dt>
              <dd className="mt-0.5 font-medium tabular-nums">
                {formatDate(event.targetDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Lead-time deadline</dt>
              <dd className="mt-0.5">
                <Badge tone={urgencyTone[urgency]}>
                  {formatDate(deadline)}
                </Badge>
              </dd>
            </div>
          </dl>

          {event.escalations.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Escalation flags
              </h3>
              <ul className="space-y-1.5">
                {event.escalations.map((esc) => (
                  <li key={esc.id} className="flex items-center gap-2 text-sm">
                    <Flag
                      className={cn(
                        "size-3.5",
                        esc.resolved ? "text-success" : "text-danger",
                      )}
                    />
                    <span className={esc.resolved ? "text-muted-foreground line-through" : ""}>
                      {esc.reason}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Notes
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {event.notes}
            </p>
          </div>
        </div>

        <div className="border-t border-border p-5">
          {nextStage ? (
            <Button
              className="w-full"
              onClick={() => {
                advanceEventStage(event.id)
                onClose()
              }}
            >
              Move to {nextStage}
              <ArrowRight />
            </Button>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Final stage reached.
            </p>
          )}
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
