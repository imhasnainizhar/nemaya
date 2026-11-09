import Link from "next/link"
import { cn } from "@/lib/util"

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="Nemaya home" className={cn("font-display text-[28px] leading-none tracking-tight text-bark", className)}>
      nemaya<span className="text-clay">.</span>
    </Link>
  )
}
