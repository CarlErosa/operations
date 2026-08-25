import { cn } from "@/lib/utils"

const tones = {
  neutral: "bg-muted text-muted-foreground ring-border",
  brand: "bg-brand/10 text-brand ring-brand/20",
  success: "bg-success/10 text-success ring-success/20",
  warning: "bg-warning/15 text-warning-foreground ring-warning/30",
  danger: "bg-danger/10 text-danger ring-danger/25",
  info: "bg-info/10 text-info ring-info/20",
  outline: "bg-transparent text-foreground ring-border",
} as const

export type BadgeTone = keyof typeof tones

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
