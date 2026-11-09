"use client"

import { useOptimistic, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { toggleWishlistAction } from "@/lib/actions"
import { cn } from "@/lib/util"

export function WishlistButton({
  productId,
  initial,
  className,
  variant = "icon",
}: {
  productId: string
  initial: boolean
  className?: string
  variant?: "icon" | "large"
}) {
  const [saved, setSaved] = useOptimistic(initial)
  const [pending, start] = useTransition()
  const router = useRouter()

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    start(async () => {
      setSaved(!saved)
      const res = await toggleWishlistAction(productId, saved)
      if (res?.error === "login") router.push(`/login?next=${encodeURIComponent(location.pathname)}`)
      else router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      className={cn(
        "grid place-items-center transition",
        variant === "icon"
          ? "h-9 w-9 rounded-full bg-paper/90 backdrop-blur hover:scale-105"
          : "h-[52px] w-[52px] rounded-full border border-bark/15 hover:border-bark/40",
        className
      )}
    >
      <Heart className={cn("h-[18px] w-[18px] transition", saved ? "fill-clay stroke-clay" : "stroke-bark")} strokeWidth={1.7} />
    </button>
  )
}
