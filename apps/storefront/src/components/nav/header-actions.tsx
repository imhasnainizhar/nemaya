"use client"

import { Search, ShoppingBag } from "lucide-react"
import { useUI } from "@/components/ui/ui-provider"

export function SearchButton() {
  const ui = useUI()
  return (
    <button onClick={() => ui.open("search")} aria-label="Search (press /)" className="grid h-10 w-10 place-items-center rounded-full bg-sand/70 transition-colors hover:bg-sand">
      <Search className="h-[18px] w-[18px]" strokeWidth={1.7} />
    </button>
  )
}

export function CartButton() {
  const ui = useUI()
  return (
    <button
      onClick={() => ui.open("cart")}
      aria-label={`Open cart, ${ui.cartCount} items`}
      className="relative grid h-10 w-10 place-items-center rounded-full bg-sand/70 transition-colors hover:bg-sand"
    >
      <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.7} />
      {ui.cartCount > 0 && (
        <span className="absolute top-0.5 right-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-clay px-1 text-[10px] font-bold text-linen">
          {ui.cartCount}
        </span>
      )}
    </button>
  )
}
