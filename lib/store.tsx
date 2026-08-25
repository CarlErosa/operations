"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  seedActivity,
  seedDecisions,
  seedDocuments,
  seedEvents,
  seedTracker,
} from "./seed-data"
import { TODAY } from "./dates"
import type {
  ActivityEntry,
  Decision,
  DecisionTier,
  DocumentItem,
  DocumentStage,
  DocumentType,
  EscalationReason,
  EventItem,
  EventStage,
  Role,
  TrackerItem,
  TrackerStatus,
} from "./types"
import { EVENT_STAGES } from "./types"

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

function nowStamp() {
  // Anchor new activity to the demo "today" with current wall-clock time-of-day.
  const d = new Date(TODAY)
  const real = new Date()
  d.setHours(real.getHours(), real.getMinutes(), 0, 0)
  return d.toISOString()
}

interface StoreValue {
  role: Role
  setRole: (r: Role) => void

  tracker: TrackerItem[]
  events: EventItem[]
  documents: DocumentItem[]
  decisions: Decision[]
  activity: ActivityEntry[]

  updateTrackerStatus: (id: string, status: TrackerStatus) => void
  advanceEventStage: (id: string) => void
  approveDocument: (id: string) => void
  addDocument: (input: {
    title: string
    type: DocumentType
    stage: DocumentStage
    preparedBy: string
  }) => void
  addDecision: (input: {
    description: string
    tier: DecisionTier
    decidedBy: string
    reason: string
    escalationReasons: EscalationReason[]
  }) => void
  resolveEscalation: (escalationId: string) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("President")
  const [tracker, setTracker] = useState<TrackerItem[]>(seedTracker)
  const [events, setEvents] = useState<EventItem[]>(seedEvents)
  const [documents, setDocuments] = useState<DocumentItem[]>(seedDocuments)
  const [decisions, setDecisions] = useState<Decision[]>(seedDecisions)
  const [activity, setActivity] = useState<ActivityEntry[]>(seedActivity)

  function log(message: string, kind: ActivityEntry["kind"], actor: string) {
    setActivity((prev) => [
      { id: uid("a"), timestamp: nowStamp(), actor, message, kind },
      ...prev,
    ])
  }

  const value = useMemo<StoreValue>(() => {
    return {
      role,
      setRole,
      tracker,
      events,
      documents,
      decisions,
      activity,
      updateTrackerStatus: (id, status) => {
        setTracker((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status } : t)),
        )
        const item = tracker.find((t) => t.id === id)
        if (item)
          log(`set "${item.deliverable}" to ${status}`, "status", role)
      },
      advanceEventStage: (id) => {
        setEvents((prev) =>
          prev.map((e) => {
            if (e.id !== id) return e
            const idx = EVENT_STAGES.indexOf(e.stage)
            const next = EVENT_STAGES[Math.min(idx + 1, EVENT_STAGES.length - 1)]
            if (next !== e.stage)
              log(`moved ${e.name} to ${next}`, "stage", role)
            return { ...e, stage: next as EventStage }
          }),
        )
      },
      approveDocument: (id) => {
        setDocuments((prev) =>
          prev.map((d) => {
            if (d.id !== id) return d
            log(`approved ${d.title}`, "stage", role)
            return { ...d, stage: "Archived", approvedBy: "President" }
          }),
        )
      },
      addDocument: ({ title, type, stage, preparedBy }) => {
        const newDoc: DocumentItem = {
          id: uid("doc"),
          title,
          type,
          stage,
          preparedBy,
          versionDate: TODAY.toISOString().slice(0, 10),
          escalations: [],
        }
        setDocuments((prev) => [newDoc, ...prev])
        log(`added document "${title}" (${stage})`, "stage", role)
      },
      addDecision: ({ description, tier, decidedBy, reason, escalationReasons }) => {
        const newDecision: Decision = {
          id: uid("dec"),
          description,
          tier,
          decidedBy,
          date: TODAY.toISOString().slice(0, 10),
          reason,
          escalations: escalationReasons.map((r) => ({
            id: uid("esc"),
            reason: r,
            resolved: false,
          })),
        }
        setDecisions((prev) => [newDecision, ...prev])
        log(`logged a Tier ${tier} decision: ${description}`, "decision", decidedBy)
        escalationReasons.forEach((r) =>
          log(`flagged decision "${description}": ${r}`, "escalation", "System"),
        )
      },
      resolveEscalation: (escalationId) => {
        const resolve = <T extends { escalations: { id: string; resolved: boolean }[] }>(
          arr: T[],
        ) =>
          arr.map((item) => ({
            ...item,
            escalations: item.escalations.map((e) =>
              e.id === escalationId ? { ...e, resolved: true } : e,
            ),
          }))
        setEvents((prev) => resolve(prev) as EventItem[])
        setDocuments((prev) => resolve(prev) as DocumentItem[])
        setDecisions((prev) => resolve(prev) as Decision[])
        log(`resolved an escalation flag`, "escalation", role)
      },
    }
  }, [role, tracker, events, documents, decisions, activity])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
