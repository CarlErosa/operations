import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { OpsShell } from "@/components/ops-shell"
import type { Role } from "@/lib/types"

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle()

  const role: Role =
    profile?.role === "President" || profile?.role === "Reviewer"
      ? profile.role
      : "Officer"

  return (
    <OpsShell
      role={role}
      currentUserName={profile?.full_name || user.email || "Signed-in user"}
    />
  )
}
