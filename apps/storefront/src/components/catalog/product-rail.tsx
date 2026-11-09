"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Product } from "@/lib/types"
import { ProductCard } from "@/components/product-card"

/** Horizontal, snap-scrolling product row with arrow controls. */
export function ProductRail({ products, saved, label }: { products: Product[]; saved: string[]; label: string }) {
  const ref = useRef<HTMLUListElement>(null)
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" })

  return (
    <div className="container-x relative mt-6">
      <ul ref={ref} aria-label={label} className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {products.map((p) => (
          <li key={p.id} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23%]">
            <ProductCard product={p} saved={saved.includes(p.id)} />
          </li>
        ))}
      </ul>
      {products.length > 4 && (
        <div className="pointer-events-none absolute inset-x-0 top-[38%] hidden justify-between px-1 lg:flex">
          <button onClick={() => scroll(-1)} aria-label="Scroll left" className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-paper shadow-lg">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => scroll(1)} aria-label="Scroll right" className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-paper shadow-lg">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}
