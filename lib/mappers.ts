import type {
  ActivityEntry,
  Decision,
  DocumentItem,
  Escalation,
  EventItem,
  TrackerItem,
} from "./types"

// DB rows use snake_case; the app model uses camelCase with escalations nested
// under their parent event/document/decision.

export interface EscalationRow {
  id: string
  reason: string
  resolved: boolean
  event_id: string | null
  document_id: string | null
  decision_id: string | null
}

function escFor(rows: EscalationRow[], key: keyof EscalationRow, id: string): Escalation[] {
  return rows
    .filter((r) => r[key] === id)
    .map((r) => ({ id: r.id, reason: r.reason, resolved: r.resolved }))
}

export function mapTracker(row: any): TrackerItem {
  return {
    id: row.id,
    deliverable: row.deliverable,
    owner: row.owner,
    reviewer: row.reviewer,
    targetDate: row.target_date,
    status: row.status,
    blockers: row.blockers ?? undefined,
  }
}

export function mapEvent(row: any, esc: EscalationRow[]): EventItem {
  return {
    id: row.id,
    name: row.name,
    department: row.department,
    stage: row.stage,
    owner: row.owner,
    targetDate: row.target_date,
    notes: row.notes,
    escalations: escFor(esc, "event_id", row.id),
  }
}

export function mapDocument(row: any, esc: EscalationRow[]): DocumentItem {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    stage: row.stage,
    preparedBy: row.prepared_by,
    reviewedBy: row.reviewed_by ?? undefined,
    approvedBy: row.approved_by ?? undefined,
    versionDate: row.version_date,
    failReason: row.fail_reason ?? undefined,
    reviewedFileName: row.reviewed_file_name ?? undefined,
    signedFileName: row.signed_file_name ?? undefined,
    escalations: escFor(esc, "document_id", row.id),
  }
}

export function mapDecision(row: any, esc: EscalationRow[]): Decision {
  return {
    id: row.id,
    description: row.description,
    tier: row.tier,
    decidedBy: row.decided_by,
    date: row.date,
    reason: row.reason,
    escalations: escFor(esc, "decision_id", row.id),
  }
}

export function mapActivity(row: any): ActivityEntry {
  return {
    id: row.id,
    timestamp: row.created_at,
    actor: row.actor,
    message: row.message,
    kind: row.kind,
  }
}
