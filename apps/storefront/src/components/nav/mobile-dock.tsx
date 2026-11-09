"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Home, Search, ShoppingBag, User } from "lucide-react"
import { useUI } from "@/components/ui/ui-provider"
import { cn } from "@/lib/util"

/**
 * Floating bottom nav dock for phones/tablets (hidden from lg up).
 * Frosted pill with Search · Home · Menu · Account; the cart is either a separate
 * black floating button or an item inside the pill (uiConfig.dock_cart_separate).
 */
export function MobileDock({ signedIn, cartSeparate }: { signedIn: boolean; cartSeparate: boolean }) {
  const ui = useUI()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  // entrance: rise from below once the page has painted
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 250)
    return () => clearTimeout(t)
  }, [])

  const count = ui.cartCount
  const item = "flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1 text-[10px] leading-3 transition-colors"
  const active = (on: boolean) => (on ? "text-bark" : "text-bark-soft")

  const cartIcon = (
    <span className="relative block">
      <ShoppingBag className="h-6 w-6" strokeWidth={1.6} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-clay px-1 text-[10px] leading-3 font-bold text-linen">
          {count}
        </span>
      )}
    </span>
  )

  return (
    <div
      data-ready={ready}
      className={cn(
        "ny-dock fixed inset-x-0 bottom-2.5 z-50 mx-auto grid max-w-[600px] gap-2 px-2.5 lg:hidden",
        cartSeparate ? "grid-cols-[1fr_auto]" : "grid-cols-1"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <nav
        aria-label="Quick navigation"
        className="flex items-center rounded-full bg-linen/55 px-4 py-2.5 text-bark shadow-[0_2px_14px_2px_rgba(42,36,29,0.22)] ring-1 ring-bark/5 backdrop-blur-[15px]"
      >
        <button onClick={() => ui.open("search")} className={cn(item, active(ui.panel === "search"))} aria-label="Search">
          <Search className="h-6 w-6" strokeWidth={1.6} />
          Search
        </button>
        <Link href="/" className={cn(item, active(pathname === "/" && !ui.panel))} aria-current={pathname === "/" ? "page" : undefined}>
          <Home className="h-6 w-6" strokeWidth={1.6} />
          Home
        </Link>
        <button onClick={() => (ui.panel === "menu" ? ui.close() : ui.open("menu"))} className={cn(item, active(ui.panel === "menu"))} aria-label="Menu" aria-expanded={ui.panel === "menu"}>
          <MenuGlyph open={ui.panel === "menu"} />
          Menu
        </button>
        <Link href={signedIn ? "/account" : "/login"} className={cn(item, active(pathname.startsWith("/account")))}>
          <User className="h-6 w-6" strokeWidth={1.6} />
          {signedIn ? "Account" : "Sign in"}
        </Link>
        {!cartSeparate && (
          <button onClick={() => ui.open("cart")} className={cn(item, active(ui.panel === "cart"))} aria-label={`Cart, ${count} items`}>
            {cartIcon}
            Cart
          </button>
        )}
      </nav>

      {cartSeparate && (
        <button
          onClick={() => ui.open("cart")}
          aria-label={`Cart, ${count} items`}
          className="flex aspect-square h-full flex-col items-center justify-center gap-1 rounded-full bg-bark text-[10px] leading-3 font-semibold text-linen shadow-[0_2px_14px_2px_rgba(42,36,29,0.25)] transition-transform active:scale-95"
        >
          {cartIcon}
          Cart
        </button>
      )}
    </div>
  )
}

/** Three lines that fold into an × — same morph timing as the header trigger. */
function MenuGlyph({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
      <path className="ny-morph origin-center" d="M4 7h16" style={{ transform: open ? "translateY(5px) rotate(45deg)" : "none", transformBox: "fill-box" }} />
      <path className="ny-morph" d="M4 12h16" style={{ opacity: open ? 0 : 1 }} />
      <path className="ny-morph origin-center" d="M4 17h16" style={{ transform: open ? "translateY(-5px) rotate(-45deg)" : "none", transformBox: "fill-box" }} />
    </svg>
  )
}
