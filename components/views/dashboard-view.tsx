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
import { useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import type { EventItem, TrackerItem } from "@/lib/types"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { isThisWeek } from "@/lib/dates"
import { cn } from "@/lib/utils"
import type { ViewKey } from "@/components/app-sidebar"
import { TetrisGame } from "@/components/tetris-game"

function calendarKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function parseCalendarDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function DashboardCalendar({ tracker, events }: { tracker: TrackerItem[]; events: EventItem[] }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selected, setSelected] = useState(calendarKey(new Date()))
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay()
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const todayKey = calendarKey(new Date())
  const entries = useMemo(() => [
    ...tracker.map((item) => ({ id: `tracker-${item.id}`, date: item.targetDate, title: item.deliverable, meta: item.status, type: "Tracker" as const })),
    ...events.map((item) => ({ id: `event-${item.id}`, date: item.targetDate, title: item.name, meta: item.stage, type: "Event" as const })),
  ], [tracker, events])
  const byDate = useMemo(() => entries.reduce<Record<string, typeof entries>>((acc, entry) => {
    const key = entry.date
    ;(acc[key] ??= []).push(entry)
    return acc
  }, {}), [entries])
  const selectedEntries = byDate[selected] ?? []
  const monthLabel = month.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, index) => index < firstDay ? null : index - firstDay + 1)

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Operations calendar</h2>
          <p className="text-xs text-muted-foreground">Tracker deadlines and event milestones</p>
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <button type="button" className="rounded-md border border-border p-2 hover:bg-accent" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="size-4" /></button>
          <span className="min-w-32 text-center text-sm font-medium">{monthLabel}</span>
          <button type="button" className="rounded-md border border-border p-2 hover:bg-accent" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight className="size-4" /></button>
        </div>
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day} className="py-1">{day}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} className="min-h-16 rounded-md bg-muted/20 sm:min-h-20" />
              const key = calendarKey(new Date(month.getFullYear(), month.getMonth(), day))
              const dayEntries = byDate[key] ?? []
              return <button key={key} type="button" onClick={() => setSelected(key)} className={cn("flex min-h-16 min-w-0 flex-col items-start gap-1 rounded-md border p-1.5 text-left transition-colors sm:min-h-20 sm:p-2", selected === key ? "border-brand bg-brand/10" : "border-border hover:bg-accent/50", key === todayKey && "ring-1 ring-info")}>
                <span className={cn("text-xs font-medium", key === todayKey && "text-info")}>{day}</span>
                <span className="flex w-full min-w-0 flex-col gap-0.5">
                  {dayEntries.slice(0, 2).map((entry) => <span key={entry.id} className={cn("truncate rounded px-1 text-[9px] leading-4 sm:text-[10px]", entry.type === "Event" ? "bg-brand/15 text-brand" : entry.meta === "Blocked" ? "bg-danger/15 text-danger" : "bg-info/15 text-info")}>{entry.title}</span>)}
                  {dayEntries.length > 2 && <span className="text-[9px] text-muted-foreground">+{dayEntries.length - 2} more</span>}
                </span>
              </button>
            })}
          </div>
        </div>
        <div className="rounded-md border border-border bg-background/40 p-3">
          <h3 className="text-sm font-semibold">{parseCalendarDate(selected).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</h3>
          <div className="mt-3 flex flex-col gap-2">
            {selectedEntries.length ? selectedEntries.map((entry) => <div key={entry.id} className="rounded-md border border-border p-2"><div className="flex items-center justify-between gap-2"><span className={cn("text-[10px] font-medium uppercase", entry.type === "Event" ? "text-brand" : "text-info")}>{entry.type}</span><span className="truncate text-[10px] text-muted-foreground">{entry.meta}</span></div><p className="mt-1 text-sm leading-snug">{entry.title}</p></div>) : <p className="py-4 text-center text-xs text-muted-foreground">No trackers or events scheduled.</p>}
          </div>
        </div>
      </div>
    </section>
  )
}

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
        title={<span className="flex items-center gap-2">Dashboard <TetrisGame /></span>}
        description="Operational snapshot for the ICpEP.SE executive team."
      />
      <div className="space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-4">
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

        <DashboardCalendar tracker={tracker} events={events} />

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
