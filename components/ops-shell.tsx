"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { NAV } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { StoreProvider } from "@/lib/store"
import { AppSidebar, type ViewKey } from "@/components/app-sidebar"
import { DashboardView } from "@/components/views/dashboard-view"
import { TrackerView } from "@/components/views/tracker-view"
import { EventsView } from "@/components/views/events-view"
import { DocumentsView } from "@/components/views/documents-view"
import { DecisionsView } from "@/components/views/decisions-view"
import { EscalationsView } from "@/components/views/escalations-view"
import type { Role } from "@/lib/types"

export function OpsShell({
  role,
  currentUserName,
}: {
  role: Role
  currentUserName: string
}) {
  const [view, setView] = useState<ViewKey>("dashboard")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  function navigate(next: ViewKey) {
    setView(next)
    setMobileNavOpen(false)
  }

  return (
    <StoreProvider role={role} currentUserName={currentUserName}>
      <div className="flex h-dvh overflow-hidden bg-background text-foreground">
        <AppSidebar active={view} onNavigate={navigate} />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden">
            <div className="flex min-w-0 items-center gap-2">
              <img src="/icpep_logo.jpg" alt="ICpEP logo" className="size-7 rounded-md object-cover" />
              <span className="truncate text-sm font-semibold">ICPEP.SE SOP</span>
            </div>
            <Button variant="outline" size="icon" aria-label="Open navigation" onClick={() => setMobileNavOpen((open) => !open)}>
              <Menu />
            </Button>
          </div>
          {mobileNavOpen && (
            <nav className="sticky top-[57px] z-10 grid grid-cols-2 gap-1 border-b border-border bg-sidebar p-2 md:hidden">
              {NAV.map(({ key, label, icon: Icon }) => (
                <button key={key} type="button" onClick={() => navigate(key)} className={cn("flex min-h-11 items-center gap-2 rounded-md px-3 text-left text-sm", view === key ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60")} aria-current={view === key ? "page" : undefined}>
                  <Icon />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          )}
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

export function LoadingShell() {
  return (
    <div className="flex h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
      Loading operations workspace…
    </div>
  )
}
