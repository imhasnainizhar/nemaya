"use client"

import { useUI } from "@/components/ui/ui-provider"
import { cn } from "@/lib/util"

/** Grid icon that morphs into a close "×" while the menu drawer is open. */
export function MenuTrigger({ className }: { className?: string }) {
  const ui = useUI()
  const open = ui.panel === "menu"
  return (
    <button
      type="button"
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      onClick={() => (open ? ui.close() : ui.open("menu"))}
      className={cn("relative grid h-10 w-10 place-items-center rounded-full bg-sand/70 transition-colors hover:bg-sand", className)}
    >
      {/* grid (4 rounded squares) */}
      <svg
        viewBox="0 0 24 24"
        className={cn("ny-morph absolute h-[18px] w-[18px]", open ? "scale-50 rotate-45 opacity-0" : "opacity-100")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        aria-hidden
      >
        <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
      </svg>
      {/* close */}
      <svg
        viewBox="0 0 24 24"
        className={cn("ny-morph absolute h-[16px] w-[16px]", open ? "scale-110 rotate-90 opacity-100" : "scale-50 rotate-0 opacity-0")}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  )
}
