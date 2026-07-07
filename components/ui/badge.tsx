import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "primary"
    | "success"
    | "warning"
    | "error"
    | "info"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const baseStyles =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"

  const variants = {
    default: "border-transparent bg-slate-900 text-slate-50",
    secondary: "border-transparent bg-slate-800 text-slate-300",
    outline: "text-slate-400 border-slate-800",
    primary: "border-transparent bg-violet-500/10 text-violet-400 border-violet-500/20",
    success: "border-transparent bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "border-transparent bg-amber-500/10 text-amber-400 border-amber-500/20",
    error: "border-transparent bg-rose-500/10 text-rose-400 border-rose-500/20",
    info: "border-transparent bg-blue-500/10 text-blue-400 border-blue-500/20",
  }

  return (
    <div
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    />
  )
}

export { Badge }
