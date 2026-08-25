"use client"

import { useStore } from "@/lib/store"
import { createClient } from "@/lib/supabase/client"
import type { Role } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
    Check,
    ChevronsUpDown,
    Columns3,
    FileText,
    Gavel,
    LayoutDashboard,
    ListTodo,
    TriangleAlert,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

export type ViewKey =
  | "dashboard"
  | "tracker"
  | "events"
  | "documents"
  | "decisions"
  | "escalations"

const NAV: { key: ViewKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "tracker", label: "Tracker", icon: ListTodo },
  { key: "events", label: "Events", icon: Columns3 },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "decisions", label: "Decisions", icon: Gavel },
  { key: "escalations", label: "Escalations", icon: TriangleAlert },
]

export function AppSidebar({
  active,
  onNavigate,
}: {
  active: ViewKey
  onNavigate: (v: ViewKey) => void
}) {
  const { role, events, documents, decisions, currentUserName } = useStore()
  const supabase = createClient()
  const router = useRouter()

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("[v0] Sign out failed:", error)
      return
    }
    router.replace("/auth/login")
    router.refresh()
  }

  const unresolved = [...events, ...documents, ...decisions].reduce(
    (acc, item) => acc + item.escalations.filter((e) => !e.resolved).length,
    0,
  )

  return (
    <aside className="flex h-dvh w-60 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <img
          src="/icpep_logo.jpg"
          alt="ICpEP logo"
          className="h-8 w-8 rounded-md object-cover"
        />
        <div className="leading-tight">
          <div className="text-sm font-semibold text-sidebar-foreground">
            ICpEP.SE Ops
          </div>
          <div className="text-xs text-muted-foreground">Exec Operations</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-2 py-2">
        {NAV.map(({ key, label, icon: Icon }) => {
          const isActive = active === key
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {key === "escalations" && unresolved > 0 && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-semibold text-danger-foreground">
                  {unresolved}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-border p-2">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
            {(currentUserName || role).slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-xs font-medium text-sidebar-foreground">
              {currentUserName || "Signed-in user"}
            </div>
            <div className="text-xs text-muted-foreground">{role}</div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs text-muted-foreground hover:text-sidebar-foreground"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}

function RoleSwitcher({
  role,
  onChange,
  roles,
}: {
  role: Role
  onChange: (r: Role) => void
  roles: Role[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  return (
    <div ref={ref} className="relative border-t border-border p-2">
      {open && (
        <div className="absolute bottom-full left-2 right-2 mb-1 overflow-hidden rounded-md border border-border bg-popover shadow-md">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => {
                onChange(r)
                setOpen(false)
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-sm text-popover-foreground hover:bg-accent"
            >
              <span>{r}</span>
              {r === role && <Check className="size-4 text-brand" />}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-sidebar-accent"
      >
        <div className="flex size-8 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
          {role.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 leading-tight">
          <div className="text-xs text-muted-foreground">Viewing as</div>
          <div className="text-sm font-medium text-sidebar-foreground">
            {role}
          </div>
        </div>
        <ChevronsUpDown className="size-4 text-muted-foreground" />
      </button>
    </div>
  )
}
