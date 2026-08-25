"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import {
  mapActivity,
  mapDecision,
  mapDocument,
  mapEvent,
  mapTracker,
  type EscalationRow,
} from "./mappers"
import type {
  ActivityEntry,
  Decision,
  DecisionTier,
  Department,
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

const supabase = createClient()

function today() {
  return new Date().toISOString().slice(0, 10)
}

interface BoardData {
  tracker: TrackerItem[]
  events: EventItem[]
  documents: DocumentItem[]
  decisions: Decision[]
  activity: ActivityEntry[]
}

async function fetchBoard(): Promise<BoardData> {
  const [tracker, events, documents, decisions, activity, escalations] =
    await Promise.all([
      supabase.from("tracker_items").select("*").order("target_date"),
      supabase.from("events").select("*").order("created_at"),
      supabase.from("documents").select("*").order("created_at", { ascending: false }),
      supabase.from("decisions").select("*").order("created_at", { ascending: false }),
      supabase.from("activity").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("escalations").select("*"),
    ])

  const esc = (escalations.data ?? []) as EscalationRow[]
  return {
    tracker: (tracker.data ?? []).map(mapTracker),
    events: (events.data ?? []).map((r) => mapEvent(r, esc)),
    documents: (documents.data ?? []).map((r) => mapDocument(r, esc)),
    decisions: (decisions.data ?? []).map((r) => mapDecision(r, esc)),
    activity: (activity.data ?? []).map(mapActivity),
  }
}

interface StoreValue {
  role: Role
  currentUserName: string
  loading: boolean

  tracker: TrackerItem[]
  events: EventItem[]
  documents: DocumentItem[]
  decisions: Decision[]
  activity: ActivityEntry[]

  updateTrackerStatus: (id: string, status: TrackerStatus) => void
  addTrackerItem: (input: {
    deliverable: string
    owner: string
    reviewer: string
    targetDate: string
    status: TrackerStatus
    blockers?: string
  }) => void
  advanceEventStage: (id: string) => void
  setEventStage: (id: string, stage: EventStage) => void
  sendForReview: (id: string) => void
  reviewDocument: (id: string, signedFileName: string) => void
  passDocument: (id: string) => void
  failDocument: (id: string, reason: string) => void
  approveDocument: (id: string, signedFileName: string) => void
  addDocument: (input: {
    title: string
    type: DocumentType
    stage: DocumentStage
    preparedBy: string
  }) => void
  addEvent: (input: {
    name: string
    department: Department
    owner: string
    targetDate: string
    notes: string
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

export function StoreProvider({
  role,
  currentUserName,
  children,
}: {
  role: Role
  currentUserName: string
  children: ReactNode
}) {
  const { data, isLoading, mutate } = useSWR("board", fetchBoard, {
    revalidateOnFocus: false,
  })

  const tracker = data?.tracker ?? []
  const events = data?.events ?? []
  const documents = data?.documents ?? []
  const decisions = data?.decisions ?? []
  const activity = data?.activity ?? []

  const log = useCallback(
    async (message: string, kind: ActivityEntry["kind"], actor: string) => {
      await supabase.from("activity").insert({ actor, message, kind })
    },
    [],
  )

  const refresh = useCallback(() => mutate(), [mutate])

  const value = useMemo<StoreValue>(() => {
    return {
      role,
      currentUserName,
      loading: isLoading,
      tracker,
      events,
      documents,
      decisions,
      activity,

      updateTrackerStatus: async (id, status) => {
        const item = tracker.find((t) => t.id === id)
        await supabase.from("tracker_items").update({ status }).eq("id", id)
        if (item)
          await log(`set "${item.deliverable}" to ${status}`, "status", currentUserName)
        refresh()
      },

      addTrackerItem: async ({ deliverable, owner, reviewer, targetDate, status, blockers }) => {
        await supabase.from("tracker_items").insert({
          deliverable,
          owner,
          reviewer,
          target_date: targetDate,
          status,
          blockers: blockers || null,
        })
        await log(`added deliverable "${deliverable}"`, "status", currentUserName)
        refresh()
      },

      advanceEventStage: async (id) => {
        const e = events.find((x) => x.id === id)
        if (!e) return
        const idx = EVENT_STAGES.indexOf(e.stage)
        const next = EVENT_STAGES[Math.min(idx + 1, EVENT_STAGES.length - 1)]
        if (next === e.stage) return
        await supabase.from("events").update({ stage: next }).eq("id", id)
        await log(`moved ${e.name} to ${next}`, "stage", currentUserName)
        refresh()
      },

      setEventStage: async (id, stage) => {
        const e = events.find((x) => x.id === id)
        if (!e || e.stage === stage) return
        await supabase.from("events").update({ stage }).eq("id", id)
        await log(`moved ${e.name} to ${stage}`, "stage", currentUserName)
        refresh()
      },

      sendForReview: async (id) => {
        const d = documents.find((x) => x.id === id)
        if (!d || d.stage !== "Draft") return
        await supabase
          .from("documents")
          .update({ stage: "Reviewing", fail_reason: null })
          .eq("id", id)
        await log(`sent ${d.title} for review`, "stage", currentUserName)
        refresh()
      },

      reviewDocument: async (id, signedFileName) => {
        const d = documents.find((x) => x.id === id)
        if (!d || d.stage !== "Reviewing") return
        await supabase
          .from("documents")
          .update({
            stage: "Reviewed",
            reviewed_by: currentUserName,
            reviewed_file_name: signedFileName,
          })
          .eq("id", id)
        await log(`reviewed & e-signed ${d.title}`, "stage", currentUserName)
        refresh()
      },

      passDocument: async (id) => {
        const d = documents.find((x) => x.id === id)
        if (!d || d.stage !== "Reviewed") return
        await supabase
          .from("documents")
          .update({ stage: "Up for Approval" })
          .eq("id", id)
        await log(`passed ${d.title} — up for approval`, "stage", currentUserName)
        refresh()
      },

      failDocument: async (id, reason) => {
        const d = documents.find((x) => x.id === id)
        if (!d || d.stage !== "Reviewed") return
        await supabase
          .from("documents")
          .update({
            stage: "Draft",
            reviewed_by: null,
            reviewed_file_name: null,
            fail_reason: reason,
          })
          .eq("id", id)
        await log(`failed review for ${d.title}: ${reason}`, "stage", currentUserName)
        refresh()
      },

      approveDocument: async (id, signedFileName) => {
        const d = documents.find((x) => x.id === id)
        if (!d || d.stage !== "Up for Approval") return
        await supabase
          .from("documents")
          .update({
            stage: "Approved",
            approved_by: currentUserName,
            signed_file_name: signedFileName,
          })
          .eq("id", id)
        await log(`approved & e-signed ${d.title}`, "stage", currentUserName)
        refresh()
      },

      addDocument: async ({ title, type, stage, preparedBy }) => {
        await supabase.from("documents").insert({
          title,
          type,
          stage,
          prepared_by: preparedBy,
          version_date: today(),
        })
        await log(`added document "${title}" (${stage})`, "stage", currentUserName)
        refresh()
      },

      addEvent: async ({ name, department, owner, targetDate, notes }) => {
        await supabase.from("events").insert({
          name,
          department,
          stage: "Concept",
          owner,
          target_date: targetDate,
          notes,
        })
        await log(`added event "${name}" to Concept`, "stage", currentUserName)
        refresh()
      },

      addDecision: async ({ description, tier, decidedBy, reason, escalationReasons }) => {
        const { data: inserted } = await supabase
          .from("decisions")
          .insert({ description, tier, decided_by: decidedBy, reason, date: today() })
          .select("id")
          .single()

        if (inserted && escalationReasons.length > 0) {
          await supabase.from("escalations").insert(
            escalationReasons.map((r) => ({
              reason: r,
              decision_id: inserted.id,
            })),
          )
        }
        await log(`logged a Tier ${tier} decision: ${description}`, "decision", decidedBy)
        for (const r of escalationReasons) {
          await log(`flagged decision "${description}": ${r}`, "escalation", "System")
        }
        refresh()
      },

      resolveEscalation: async (escalationId) => {
        await supabase
          .from("escalations")
          .update({ resolved: true })
          .eq("id", escalationId)
        await log(`resolved an escalation flag`, "escalation", currentUserName)
        refresh()
      },
    }
  }, [
    role,
    currentUserName,
    isLoading,
    tracker,
    events,
    documents,
    decisions,
    activity,
    log,
    refresh,
  ])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
