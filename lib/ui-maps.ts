import type { BadgeTone } from "@/components/ui/badge"
import type { DecisionTier, Department, TrackerStatus } from "./types"
import type { Urgency } from "./dates"

export const statusTone: Record<TrackerStatus, BadgeTone> = {
  "Not Started": "neutral",
  "In Progress": "info",
  Blocked: "danger",
  Done: "success",
}

export const tierTone: Record<DecisionTier, BadgeTone> = {
  1: "neutral",
  2: "warning",
  3: "danger",
}

export const urgencyTone: Record<Urgency, BadgeTone> = {
  overdue: "danger",
  warning: "warning",
  ok: "neutral",
}

export const departmentColor: Record<Department, string> = {
  Membership: "bg-chart-2",
  Marketing: "bg-danger",
  Technology: "bg-brand",
  Operations: "bg-success",
  Graphics: "bg-warning",
}
