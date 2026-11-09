"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Gift, Heart, LayoutGrid, LogOut, Package, Shield, UserRound } from "lucide-react"
import { logoutAction } from "@/lib/actions"
import { cn } from "@/lib/util"

const LINKS = [
  ["/account", "Overview", LayoutGrid],
  ["/account/profile", "Profile", UserRound],
  ["/account/orders", "Orders", Package],
  ["/account/wishlist", "Wishlist", Heart],
  ["/account/notifications", "Notifications", Bell],
  ["/account/gift-cards", "Gift cards", Gift],
  ["/account/security", "Security", Shield],
] as const

export function AccountNav() {
  const path = usePathname()
  return (
    <nav className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible" aria-label="Account">
      {LINKS.map(([href, label, Icon]) => {
        const active = href === "/account" ? path === href : path.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn("flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm transition", active ? "bg-bark text-linen" : "hover:bg-sand")}
          >
            <Icon className="h-4 w-4" strokeWidth={1.7} /> {label}
          </Link>
        )
      })}
      <form action={logoutAction}>
        <button className="flex w-full shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm text-stone transition hover:bg-sand hover:text-bark">
          <LogOut className="h-4 w-4" strokeWidth={1.7} /> Sign out
        </button>
      </form>
    </nav>
  )
}
