"use client"

import { Check, ShieldAlert, TriangleAlert } from "lucide-react"
import { useStore } from "@/lib/store"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { EntityKind } from "@/lib/types"

interface FlagRow {
  escalationId: string
  reason: string
  sourceKind: EntityKind
  sourceName: string
  resolved: boolean
}

export function EscalationsView() {
  const { events, documents, decisions, role, resolveEscalation } = useStore()

  const rows: FlagRow[] = [
    ...events.flatMap((e) =>
      e.escalations.map((esc) => ({
        escalationId: esc.id,
        reason: esc.reason,
        sourceKind: "Event" as EntityKind,
        sourceName: e.name,
        resolved: esc.resolved,
      })),
    ),
    ...documents.flatMap((d) =>
      d.escalations.map((esc) => ({
        escalationId: esc.id,
        reason: esc.reason,
        sourceKind: "Document" as EntityKind,
        sourceName: d.title,
        resolved: esc.resolved,
      })),
    ),
    ...decisions.flatMap((d) =>
      d.escalations.map((esc) => ({
        escalationId: esc.id,
        reason: esc.reason,
        sourceKind: "Decision" as EntityKind,
        sourceName: d.description,
        resolved: esc.resolved,
      })),
    ),
  ]

  const unresolved = rows.filter((r) => !r.resolved)
  const isPresident = role === "President"

  return (
    <div>
      <PageHeader
        title="Escalations"
        description="Flags raised across events, documents, and decisions that need President resolution."
      />
      <div className="space-y-4 p-6">
        {!isPresident && (
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-muted-foreground">
              Escalations are resolved by the President. You are viewing as{" "}
              <span className="font-medium text-foreground">{role}</span>, so the
              Resolve action is disabled.
            </p>
          </div>
        )}

        {unresolved.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
            <Check className="size-6 text-success" />
            <p className="text-sm font-medium">No unresolved escalations</p>
            <p className="text-sm text-muted-foreground">
              Everything is currently within normal SOP bounds.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {unresolved.map((r) => (
              <li
                key={r.escalationId}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-danger/10">
                  <TriangleAlert className="size-4 text-danger" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge tone="outline">{r.sourceKind}</Badge>
                    <span className="truncate text-sm font-medium">
                      {r.sourceName}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-danger">{r.reason}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!isPresident}
                  onClick={() => resolveEscalation(r.escalationId)}
                >
                  <Check />
                  Resolve
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
