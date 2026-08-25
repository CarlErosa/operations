"use client"

import {
  AlertCircle,
  CalendarClock,
  CircleSlash,
  FileClock,
  Gavel,
  GitBranch,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"
import { useStore } from "@/lib/store"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { isThisWeek } from "@/lib/dates"
import { cn } from "@/lib/utils"
import type { ViewKey } from "@/components/app-sidebar"

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const mins = Math.round((now - then) / 60000)
  if (mins < 60) return `${Math.max(mins, 1)}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return `${days}d ago`
}

const activityMeta: Record<
  string,
  { icon: LucideIcon; tone: string }
> = {
  stage: { icon: GitBranch, tone: "text-info" },
  decision: { icon: Gavel, tone: "text-brand" },
  escalation: { icon: TriangleAlert, tone: "text-danger" },
  status: { icon: CircleSlash, tone: "text-muted-foreground" },
}

export function DashboardView({
  onNavigate,
}: {
  onNavigate: (v: ViewKey) => void
}) {
  const { tracker, events, documents, decisions, activity } = useStore()

  const dueThisWeek = tracker.filter(
    (t) => t.status !== "Done" && isThisWeek(t.targetDate),
  ).length
  const blocked = tracker.filter((t) => t.status === "Blocked").length
  const unresolvedFlags = [...events, ...documents, ...decisions].reduce(
    (acc, i) => acc + i.escalations.filter((e) => !e.resolved).length,
    0,
  )
  const pendingApprovals =
    events.filter((e) => e.stage === "Final Approval").length +
    documents.filter((d) => d.stage === "Up for Approval").length

  const cards: {
    label: string
    value: number
    icon: LucideIcon
    tone: string
    to: ViewKey
  }[] = [
    {
      label: "Tracker items",
      value: tracker.length,
      icon: CalendarClock,
      tone: "text-info",
      to: "tracker",
    },
    {
      label: "Events",
      value: events.length,
      icon: GitBranch,
      tone: "text-brand",
      to: "events",
    },
    {
      label: "Documents",
      value: documents.length,
      icon: FileClock,
      tone: "text-warning-foreground",
      to: "documents",
    },
    {
      label: "Decisions",
      value: decisions.length,
      icon: Gavel,
      tone: "text-success",
      to: "decisions",
    },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Operational snapshot for the ICpEP.SE executive team."
      />
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {cards.map((c) => (
            <button
              key={c.label}
              onClick={() => onNavigate(c.to)}
              className="group flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-ring hover:bg-accent/40"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-sm text-muted-foreground">{c.label}</span>
                <c.icon className={cn("size-4", c.tone)} />
              </div>
              <span className="font-mono text-3xl font-semibold tabular-nums">
                {c.value}
              </span>
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Recent activity</h2>
              <span className="text-xs text-muted-foreground">
                {activity.length} entries
              </span>
            </div>
            <ul className="divide-y divide-border">
              {activity.slice(0, 8).map((a) => {
                const meta = activityMeta[a.kind]
                const Icon = meta.icon
                return (
                  <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                    <Icon className={cn("mt-0.5 size-4 shrink-0", meta.tone)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug">
                        <span className="font-medium">{a.actor}</span>{" "}
                        <span className="text-muted-foreground">{a.message}</span>
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {timeAgo(a.timestamp)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">Needs attention</h2>
            </div>
            <ul className="divide-y divide-border">
              {events
                .filter((e) => e.stage === "Final Approval")
                .map((e) => (
                  <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                    <AlertCircle className="size-4 shrink-0 text-brand" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Awaiting President approval
                      </p>
                    </div>
                  </li>
                ))}
              {tracker
                .filter((t) => t.status === "Blocked")
                .map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <CircleSlash className="size-4 shrink-0 text-danger" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {t.deliverable}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.blockers}
                      </p>
                    </div>
                    <Badge tone="danger">Blocked</Badge>
                  </li>
                ))}
              {pendingApprovals === 0 && blocked === 0 && (
                <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Nothing needs attention right now.
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
