"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/util"

/**
 * Slide-up sheet (cloned motion: overlay 0.8s, panel 0.6s cubic-bezier(.7,0,.2,1)).
 *  - phones/tablets: full-width bottom sheet, swipe down to close
 *  - desktop (lg+): floating panel anchored to the bottom, inset 40px from the left or right
 *
 * Children can use `.ny-reveal` with `style={{ "--d": "0.3s" }}` for staggered entrances.
 * `aside` renders next to the panel on desktop (e.g. the menu's promo column).
 */
export function Sheet({
  open,
  onClose,
  title,
  anchor = "right",
  desktopWidth = 550,
  hideHeader = false,
  heading,
  children,
  footer,
  aside,
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  anchor?: "left" | "right"
  desktopWidth?: number
  hideHeader?: boolean
  /** custom header content (replaces the default title) */
  heading?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  aside?: React.ReactNode
  className?: string
}) {
  const [mounted, setMounted] = useState(false)
  const [render, setRender] = useState(false)
  const [shown, setShown] = useState(false)
  const [drag, setDrag] = useState(0)
  const startY = useRef<number | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const lastFocus = useRef<HTMLElement | null>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (open) {
      lastFocus.current = document.activeElement as HTMLElement
      setRender(true)
      document.documentElement.style.overflow = "hidden"
      // after the closed state has painted → start the transition (timeout, not rAF: rAF pauses in background tabs)
      const go = setTimeout(() => setShown(true), 20)
      const t = setTimeout(() => panelRef.current?.focus({ preventScroll: true }), 80)
      return () => {
        clearTimeout(go)
        clearTimeout(t)
      }
    }
    setShown(false)
    document.documentElement.style.overflow = ""
    lastFocus.current?.focus?.({ preventScroll: true })
    const t = setTimeout(() => setRender(false), 800) // overlay fade length
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!mounted || !render) return null

  const onPointerDown = (e: React.PointerEvent) => {
    if (window.innerWidth >= 1024) return
    startY.current = e.clientY
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current !== null) setDrag(Math.max(0, e.clientY - startY.current))
  }
  const onPointerUp = () => {
    if (startY.current === null) return
    if (drag > 110) onClose()
    startY.current = null
    setDrag(0)
  }

  return createPortal(
    <div className="fixed inset-0 z-[60]" data-open={shown}>
      <div className="ny-overlay absolute inset-0" onClick={onClose} aria-hidden />

      <div
        className={cn(
          "ny-sheet absolute bottom-0 flex flex-col",
          "inset-x-0 h-full max-h-[calc(100%-80px)]",
          "lg:h-full lg:max-h-[calc(100%-100px)] lg:w-full lg:max-w-[var(--sheet-w)]",
          anchor === "right" ? "lg:right-10 lg:left-auto" : "lg:right-auto lg:left-10"
        )}
        style={{ ["--sheet-w" as any]: `${desktopWidth}px`, ...(drag ? { transform: `translateY(${drag}px)`, transition: "none" } : {}) }}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          tabIndex={-1}
          className={cn("relative z-10 flex h-full flex-col overflow-hidden rounded-t-[30px] bg-linen outline-none", className)}
        >
          <div
            className="flex shrink-0 cursor-grab touch-none justify-center pt-3 lg:hidden"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <span className="h-1.5 w-12 rounded-full bg-bark/20" />
          </div>
          {!hideHeader && (
            <div className="flex shrink-0 items-center justify-between gap-4 px-5 pt-2 pb-3 sm:px-7 lg:pt-7">
              {heading ?? <h2 className="font-display text-2xl">{title}</h2>}
              <button onClick={onClose} aria-label="Close" className="ny-close grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sand transition-colors hover:bg-sand-deep">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          {footer && <div className="shrink-0 border-t border-bark/10 px-5 py-4 sm:px-7">{footer}</div>}
        </div>
        {aside && <div className="pointer-events-none absolute bottom-0 left-[calc(100%-56px)] z-20 hidden h-[calc(100dvh-210px)] w-[400px] lg:block">{aside}</div>}
      </div>
    </div>,
    document.body
  )
}

/** Close button styled like the sheet's own (spins on hover). */
export function SheetClose({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick} aria-label="Close" className={cn("ny-close grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sand transition-colors hover:bg-sand-deep", className)}>
      <X className="h-4 w-4" />
    </button>
  )
}
