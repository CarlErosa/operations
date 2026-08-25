export type Role = "President" | "Officer" | "Reviewer"

export type Department =
  | "Membership"
  | "Marketing"
  | "Technology"
  | "Operations"
  | "Graphics"

export const DEPARTMENTS: Department[] = [
  "Membership",
  "Marketing",
  "Technology",
  "Operations",
  "Graphics",
]

export type TrackerStatus = "Not Started" | "In Progress" | "Blocked" | "Done"

export const TRACKER_STATUSES: TrackerStatus[] = [
  "Not Started",
  "In Progress",
  "Blocked",
  "Done",
]

export interface TrackerItem {
  id: string
  deliverable: string
  owner: string
  reviewer: string
  targetDate: string
  status: TrackerStatus
  blockers?: string
}

export type EventStage =
  | "Concept"
  | "Logistics/GPOA"
  | "Marketing Plan"
  | "Internal Review"
  | "Final Approval"
  | "Execution"
  | "Post-Event Report"

export const EVENT_STAGES: EventStage[] = [
  "Concept",
  "Logistics/GPOA",
  "Marketing Plan",
  "Internal Review",
  "Final Approval",
  "Execution",
  "Post-Event Report",
]

// Stage-specific lead time in weeks before the target date.
export const STAGE_LEAD_WEEKS: Record<EventStage, number> = {
  Concept: 10,
  "Logistics/GPOA": 8,
  "Marketing Plan": 6,
  "Internal Review": 4,
  "Final Approval": 3,
  Execution: 0,
  "Post-Event Report": -1,
}

export interface EventItem {
  id: string
  name: string
  department: Department
  stage: EventStage
  owner: string
  targetDate: string
  notes: string
  escalations: Escalation[]
}

export type DocumentType =
  | "Event"
  | "Meeting"
  | "External Matters"
  | "Internal Matters"
  | "Others"

export const DOCUMENT_TYPES: DocumentType[] = [
  "Event",
  "Meeting",
  "External Matters",
  "Internal Matters",
  "Others",
]

export type DocumentStage =
  | "Draft"
  | "Reviewing"
  | "Reviewed"
  | "Up for Approval"
  | "Approved"

export const DOCUMENT_STAGES: DocumentStage[] = [
  "Draft",
  "Reviewing",
  "Reviewed",
  "Up for Approval",
  "Approved",
]

export interface DocumentItem {
  id: string
  title: string
  type: DocumentType
  stage: DocumentStage
  preparedBy: string
  reviewedBy?: string
  approvedBy?: string
  versionDate: string
  failReason?: string
  escalations: Escalation[]
}

export type DecisionTier = 1 | 2 | 3

export interface Decision {
  id: string
  description: string
  tier: DecisionTier
  decidedBy: string
  date: string
  reason: string
  escalations: Escalation[]
}

export type EscalationReason =
  | "Costs money not budgeted"
  | "Involves outside party"
  | "Departments disagree"
  | "Deadline at risk"
  | "Touches CBL/public image"

export const ESCALATION_REASONS: EscalationReason[] = [
  "Costs money not budgeted",
  "Involves outside party",
  "Departments disagree",
  "Deadline at risk",
  "Touches CBL/public image",
]

export interface Escalation {
  id: string
  reason: EscalationReason
  resolved: boolean
}

export type EntityKind = "Event" | "Document" | "Decision"

export interface ActivityEntry {
  id: string
  timestamp: string
  actor: string
  message: string
  kind: "stage" | "decision" | "escalation" | "status"
}
