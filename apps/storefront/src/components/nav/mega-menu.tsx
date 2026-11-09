"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { ArrowRight, ArrowUpRight, ChevronDown, Gift, Sparkles } from "lucide-react"
import type { NavData } from "@/lib/nav"
import { cn, formatMoney } from "@/lib/util"

type MenuKey = "shop" | "collections" | null

/**
 * Desktop mega menu: opens on hover (with intent delay), click or keyboard,
 * closes on mouse-leave, Escape, outside click or navigation.
 */
export function MegaMenu({ nav }: { nav: NavData }) {
  const [open, setOpen] = useState<MenuKey>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const schedule = useCallback((next: MenuKey, ms: number) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(next), ms)
  }, [])

  useEffect(() => setOpen(null), [pathname])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null)
    const onDown = (e: PointerEvent) => root.current && !root.current.contains(e.target as Node) && setOpen(null)
    window.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onDown)
    return () => {
      window.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onDown)
    }
  }, [])

  const trigger = (key: Exclude<MenuKey, null>, label: string) => (
    <button
      type="button"
      aria-expanded={open === key}
      aria-controls={`mega-${key}`}
      onClick={() => setOpen((o) => (o === key ? null : key))}
      onMouseEnter={() => schedule(key, open ? 0 : 120)}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-2 text-[13px] font-medium tracking-wide transition",
        open === key ? "bg-sand text-bark" : "text-bark-soft hover:text-bark"
      )}
    >
      {label}
      <ChevronDown className={cn("h-3.5 w-3.5 transition", open === key && "rotate-180")} />
    </button>
  )

  const link = (href: string, label: string, accent = false) => (
    <Link
      href={href}
      onMouseEnter={() => schedule(null, 150)}
      className={cn("rounded-full px-3 py-2 text-[13px] font-medium tracking-wide transition", accent ? "text-clay hover:text-clay-deep" : "text-bark-soft hover:text-bark")}
    >
      {label}
    </Link>
  )

  return (
    <div ref={root} className="hidden lg:block" onMouseLeave={() => schedule(null, 180)}>
      <nav aria-label="Main" className="flex items-center gap-1">
        {trigger("shop", "Shop")}
        {trigger("collections", "Collections")}
        {link("/shop?sort=newest", "New in")}
        {link("/shop?sale=1", "Sale", true)}
        {link("/gift-cards", "Gift cards")}
      </nav>

      {/* panel */}
      <div
        className={cn(
          "absolute inset-x-0 top-full border-b border-bark/10 bg-linen shadow-[0_24px_40px_-24px_rgba(42,36,29,0.25)] transition-all duration-500 [transition-timing-function:var(--ease-default)]",
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
        )}
        onMouseEnter={() => timer.current && clearTimeout(timer.current)}
      >
        <div id="mega-shop" className={cn("container-x grid-cols-[1.1fr_1fr_1.6fr] gap-10 py-10", open === "shop" ? "grid" : "hidden")}>
          <div>
            <p className="mb-4 text-[11px] font-semibold tracking-[0.2em] text-stone uppercase">Shop by category</p>
            <ul className="space-y-1">
              {nav.categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/shop?category=${c.handle}`} className="group flex items-center gap-3 rounded-2xl p-2 transition hover:bg-sand/70">
                    <span className="relative h-12 w-10 shrink-0 overflow-hidden rounded-xl bg-sand">
                      {c.thumbnail && <Image src={c.thumbnail} alt="" fill sizes="40px" unoptimized className="object-cover" />}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        {c.name} <span className="text-[11px] font-normal text-stone">{c.count}</span>
                      </span>
                      <span className="block truncate text-xs text-bark-soft">{c.blurb}</span>
                    </span>
                    <ArrowRight className="ml-auto h-4 w-4 -translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2 pl-2">
              <Link href="/shop" className="chip text-xs">All products</Link>
              <Link href="/shop?sale=1" className="chip border-clay/40 text-xs text-clay">On sale</Link>
            </div>
          </div>

          <div>
            <p className="mb-4 text-[11px] font-semibold tracking-[0.2em] text-stone uppercase">Collections</p>
            <ul className="space-y-4">
              {nav.collections.map((c) => (
                <li key={c.id}>
                  <Link href={`/collections/${c.handle}`} className="group block">
                    <span className="font-display text-2xl leading-tight transition group-hover:text-clay">{c.title}</span>
                    <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-bark-soft">{c.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/collections" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold hover:text-clay">
              All collections <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-8 mb-3 text-[11px] font-semibold tracking-[0.2em] text-stone uppercase">Help</p>
            <ul className="space-y-1.5 text-sm text-bark-soft">
              <li><Link href="/gift-cards/balance" className="hover:text-bark">Gift card balance</Link></li>
              <li><Link href="/account/orders" className="hover:text-bark">Track an order</Link></li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(nav.sale[0] ?? nav.featured[0]) && <FeatureTile p={nav.sale[0] ?? nav.featured[0]} label={nav.sale[0] ? "On sale" : "New in"} />}
            <Link href="/gift-cards" className="grain group relative flex flex-col justify-between overflow-hidden rounded-[24px] bg-moss p-5 text-linen">
              <span className="blob absolute -right-10 -bottom-12 h-40 w-40 bg-sage/40" />
              <Gift className="relative h-6 w-6" strokeWidth={1.5} />
              <span className="relative">
                <span className="font-display block text-2xl leading-tight">Give a gift card</span>
                <span className="mt-1 block text-xs text-linen/80">From $10, delivered on the day you choose.</span>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold">Send one <ArrowUpRight className="h-3.5 w-3.5" /></span>
              </span>
            </Link>
          </div>
        </div>

        <div id="mega-collections" className={cn("container-x py-10", open === "collections" ? "block" : "hidden")}>
          <div className="grid grid-cols-3 gap-5">
            {nav.collections.map((c) => (
              <Link key={c.id} href={`/collections/${c.handle}`} className="group block">
                {/* short, ratio-managed preview strip */}
                <span className="relative grid aspect-[16/7] grid-cols-3 gap-1 overflow-hidden rounded-[22px] bg-sand">
                  {c.thumbnails.map((t, i) => (
                    <span key={i} className="relative overflow-hidden">
                      <Image src={t} alt="" fill sizes="160px" unoptimized className="object-cover transition duration-700 group-hover:scale-105" />
                    </span>
                  ))}
                </span>
                <span className="mt-3 flex items-baseline justify-between">
                  <span className="font-display text-2xl">{c.title}</span>
                  <span className="text-xs text-stone">{c.count} pieces</span>
                </span>
                <span className="mt-1 line-clamp-2 block text-sm text-bark-soft">{c.description}</span>
              </Link>
            ))}
            <Link href="/collections" className="flex flex-col justify-center rounded-[22px] border border-dashed border-bark/20 p-6 transition hover:bg-sand/50">
              <Sparkles className="h-5 w-5 text-clay" />
              <span className="font-display mt-3 text-2xl">Browse every collection</span>
              <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold">View all <ArrowRight className="h-4 w-4" /></span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureTile({ p, label }: { p: NavData["featured"][number]; label: string }) {
  return (
    <Link href={`/products/${p.handle}`} className="group relative block overflow-hidden rounded-[24px] bg-sand">
      <span className="relative block aspect-[4/5]">
        {p.thumbnail && <Image src={p.thumbnail} alt={p.title} fill sizes="240px" unoptimized className="object-cover transition duration-700 group-hover:scale-105" />}
      </span>
      <span className="absolute top-3 left-3 rounded-full bg-clay px-2.5 py-1 text-[10px] font-bold tracking-wider text-linen uppercase">{label}</span>
      <span className="absolute inset-x-3 bottom-3 rounded-2xl bg-paper/90 px-3 py-2 backdrop-blur">
        <span className="block truncate text-sm font-semibold">{p.title}</span>
        <span className="text-xs">
          {formatMoney(p.price, p.currency)}
          {p.original > p.price && <span className="ml-1.5 text-stone line-through">{formatMoney(p.original, p.currency)}</span>}
        </span>
      </span>
    </Link>
  )
}
