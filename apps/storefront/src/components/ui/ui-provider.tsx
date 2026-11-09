"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import type { Cart } from "@/lib/types"

type Panel = "cart" | "search" | "menu" | null

type UI = {
  panel: Panel
  open: (p: Exclude<Panel, null>) => void
  close: () => void
  cart: Cart | null
  cartCount: number
  refreshCart: () => Promise<Cart | null>
  /** refresh then slide the cart open (after add-to-cart) */
  showCart: () => Promise<void>
}

const Ctx = createContext<UI | null>(null)

export function UIProvider({ children, initialCartCount = 0 }: { children: React.ReactNode; initialCartCount?: number }) {
  const [panel, setPanel] = useState<Panel>(null)
  const [cart, setCart] = useState<Cart | null>(null)
  const [count, setCount] = useState(initialCartCount)
  const pathname = usePathname()

  const refreshCart = useCallback(async () => {
    const res = await fetch("/api/cart", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ cart: null }))
    setCart(res.cart)
    setCount((res.cart?.items ?? []).reduce((n: number, i: any) => n + Number(i.quantity), 0))
    return res.cart as Cart | null
  }, [])

  // close any overlay on navigation
  useEffect(() => setPanel(null), [pathname])

  // "/" opens search, like most stores
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key === "/" && !/input|textarea|select/i.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault()
        setPanel("search")
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (panel === "cart") refreshCart()
  }, [panel, refreshCart])

  const value = useMemo<UI>(
    () => ({
      panel,
      open: (p) => setPanel(p),
      close: () => setPanel(null),
      cart,
      cartCount: count,
      refreshCart,
      showCart: async () => {
        await refreshCart()
        setPanel("cart")
      },
    }),
    [panel, cart, count, refreshCart]
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useUI() {
  const v = useContext(Ctx)
  if (!v) throw new Error("useUI must be used inside <UIProvider>")
  return v
}
