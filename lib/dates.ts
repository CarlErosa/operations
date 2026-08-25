import { STAGE_LEAD_WEEKS, type EventStage } from "./types"

// Fixed "today" so seed data reads consistently in the demo.
export const TODAY = new Date("2026-08-25T00:00:00")

export function parseDate(iso: string): Date {
  if (!iso) return TODAY
  const d = new Date(iso + "T00:00:00")
  return isNaN(d.getTime()) ? TODAY : d
}

export function formatDate(iso: string): string {
  return parseDate(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function formatShort(iso: string): string {
  return parseDate(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export function daysUntil(iso: string): number {
  const target = parseDate(iso)
  const diff = target.getTime() - TODAY.getTime()
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

export function isThisWeek(iso: string): boolean {
  const d = daysUntil(iso)
  return d >= 0 && d <= 7
}

export function isOverdue(iso: string): boolean {
  return daysUntil(iso) < 0
}

// Lead-time deadline = targetDate minus stage-specific weeks.
export function leadTimeDeadline(targetDate: string, stage: EventStage): string {
  const weeks = STAGE_LEAD_WEEKS[stage]
  if (!targetDate) return TODAY.toISOString().slice(0, 10)

  let d = parseDate(targetDate)
  if (isNaN(d.getTime())) {
    // try a fallback parse (accept full ISO or other formats)
    const alt = new Date(targetDate)
    if (!isNaN(alt.getTime())) d = alt
    else return TODAY.toISOString().slice(0, 10)
  }

  d.setDate(d.getDate() - weeks * 7)
  return d.toISOString().slice(0, 10)
}

export type Urgency = "overdue" | "warning" | "ok"

export function urgencyOf(iso: string): Urgency {
  const d = daysUntil(iso)
  if (d < 0) return "overdue"
  if (d <= 3) return "warning"
  return "ok"
}

export function relativeLabel(iso: string): string {
  const d = daysUntil(iso)
  if (d === 0) return "Today"
  if (d < 0) return `${Math.abs(d)}d overdue`
  if (d === 1) return "Tomorrow"
  return `in ${d}d`
}
