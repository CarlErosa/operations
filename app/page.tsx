"use client"

import { useState } from "react"
import { StoreProvider } from "@/lib/store"
import { AppSidebar, type ViewKey } from "@/components/app-sidebar"
import { DashboardView } from "@/components/views/dashboard-view"
import { TrackerView } from "@/components/views/tracker-view"
import { EventsView } from "@/components/views/events-view"
import { DocumentsView } from "@/components/views/documents-view"
import { DecisionsView } from "@/components/views/decisions-view"
import { EscalationsView } from "@/components/views/escalations-view"

export default function Page() {
  const [view, setView] = useState<ViewKey>("dashboard")

  return (
    <StoreProvider>
      <div className="flex h-dvh overflow-hidden bg-background text-foreground">
        <AppSidebar active={view} onNavigate={setView} />
        <main className="flex-1 overflow-y-auto">
          {view === "dashboard" && <DashboardView onNavigate={setView} />}
          {view === "tracker" && <TrackerView />}
          {view === "events" && <EventsView />}
          {view === "documents" && <DocumentsView />}
          {view === "decisions" && <DecisionsView />}
          {view === "escalations" && <EscalationsView />}
        </main>
      </div>
    </StoreProvider>
  )
}
