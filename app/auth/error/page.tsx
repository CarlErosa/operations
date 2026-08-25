import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { AuthShell } from "@/components/auth/auth-shell"
import { cn } from "@/lib/utils"

export default function AuthErrorPage() {
  return (
    <AuthShell
      title="Authentication error"
      subtitle="Something went wrong verifying your session."
    >
      <p className="text-sm text-muted-foreground text-pretty">
        Your confirmation link may have expired or already been used. Please try
        signing in again.
      </p>
      <Link href="/auth/login" className={cn(buttonVariants(), "mt-5 w-full")}>
        Back to sign in
      </Link>
    </AuthShell>
  )
}
