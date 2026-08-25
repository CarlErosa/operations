import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { AuthShell } from "@/components/auth/auth-shell"
import { cn } from "@/lib/utils"

export default function SignUpSuccessPage() {
  return (
    <AuthShell
      title="Check your email"
      subtitle="We sent a confirmation link to finish setting up your account."
    >
      <p className="text-sm text-muted-foreground text-pretty">
        Click the link in your email to confirm your address, then sign in to
        access the operations board.
      </p>
      <Link href="/auth/login" className={cn(buttonVariants(), "mt-5 w-full")}>
        Back to sign in
      </Link>
    </AuthShell>
  )
}
