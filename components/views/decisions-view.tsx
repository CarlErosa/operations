"use client"

import { useState } from "react"
import { Flag, Plus, X } from "lucide-react"
import { useStore } from "@/lib/store"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/dates"
import { tierTone } from "@/lib/ui-maps"
import {
  ESCALATION_REASONS,
  type DecisionTier,
  type EscalationReason,
} from "@/lib/types"
import { cn } from "@/lib/utils"

export function DecisionsView() {
  const { decisions } = useStore()
  const [formOpen, setFormOpen] = useState(false)

  const sorted = [...decisions].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <PageHeader
        title="Decisions Log"
        description="Chronological record of executive decisions and their tier."
        actions={
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus />
            Log Decision
          </Button>
        }
      />
      <div className="p-6">
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Decision</th>
                <th className="px-3 py-2 font-medium">Tier</th>
                <th className="px-3 py-2 font-medium">Decided By</th>
                <th className="px-3 py-2 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((d) => (
                <tr key={d.id} className="bg-card align-top hover:bg-accent/30">
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-muted-foreground">
                    {formatDate(d.date)}
                  </td>
                  <td className="px-3 py-2.5 font-medium">
                    <div className="flex items-center gap-1.5">
                      {d.description}
                      {d.escalations.some((e) => !e.resolved) && (
                        <Flag className="size-3.5 shrink-0 text-danger" />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge tone={tierTone[d.tier]}>Tier {d.tier}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                    {d.decidedBy}
                  </td>
                  <td className="max-w-md px-3 py-2.5 text-muted-foreground">
                    {d.reason || <span className="text-muted-foreground/50">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && <DecisionForm onClose={() => setFormOpen(false)} />}
    </div>
  )
}

function DecisionForm({ onClose }: { onClose: () => void }) {
  const { addDecision, role } = useStore()
  const [description, setDescription] = useState("")
  const [tier, setTier] = useState<DecisionTier>(1)
  const [decidedBy, setDecidedBy] = useState(role)
  const [reason, setReason] = useState("")
  const [flags, setFlags] = useState<EscalationReason[]>([])
  const [error, setError] = useState("")

  const reasonRequired = tier >= 2

  function toggleFlag(r: EscalationReason) {
    setFlags((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
    )
  }

  function submit() {
    if (!description.trim()) {
      setError("A decision description is required.")
      return
    }
    if (reasonRequired && !reason.trim()) {
      setError("Tier 2 and Tier 3 decisions require a documented reason.")
      return
    }
    addDecision({
      description: description.trim(),
      tier,
      decidedBy: decidedBy.trim() || role,
      reason: reason.trim(),
      escalationReasons: flags,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold">Log a decision</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <Field label="Decision">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What was decided?"
              className="w-full resize-none rounded-md border border-border bg-background px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tier">
              <div className="flex gap-1.5">
                {([1, 2, 3] as DecisionTier[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTier(t)}
                    className={cn(
                      "flex-1 rounded-md border px-2 py-1.5 text-sm font-medium transition-colors",
                      tier === t
                        ? "border-ring bg-accent"
                        : "border-border hover:bg-accent/50",
                    )}
                  >
                    <Badge tone={tierTone[t]}>Tier {t}</Badge>
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Decided by">
              <input
                value={decidedBy}
                onChange={(e) => setDecidedBy(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </Field>
          </div>

          <Field
            label={
              reasonRequired ? "Reason (required for Tier 2/3)" : "Reason (optional)"
            }
          >
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Why was this decided?"
              className={cn(
                "w-full resize-none rounded-md border bg-background px-2.5 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                reasonRequired && !reason.trim()
                  ? "border-warning/50"
                  : "border-border focus-visible:border-ring",
              )}
            />
          </Field>

          <Field label="Escalation checklist">
            <p className="mb-2 text-xs text-muted-foreground">
              Checking any box auto-creates an escalation flag for the President.
            </p>
            <div className="space-y-1.5">
              {ESCALATION_REASONS.map((r) => (
                <label
                  key={r}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-accent/50"
                >
                  <input
                    type="checkbox"
                    checked={flags.includes(r)}
                    onChange={() => toggleFlag(r)}
                    className="size-4 accent-brand"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </Field>

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit}>
            Log decision
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
