"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ArrowUpRight, ChevronLeft, ChevronRight, Gift, Heart, Search, User } from "lucide-react"
import type { NavData } from "@/lib/nav"
import { Sheet, SheetClose } from "@/components/ui/sheet"
import { useUI } from "@/components/ui/ui-provider"
import { RollText } from "@/components/ui/roll-text"
import { cn, formatMoney } from "@/lib/util"

type Sub = "shop" | "collections" | null

/**
 * The menu drawer: floating slide-up panel on desktop (with a promo column cascading
 * beside it) and a bottom sheet on phones. Drill-down submenus slide in from the right.
 */
export function MenuDrawer({ nav, signedIn }: { nav: NavData; signedIn: boolean }) {
  const ui = useUI()
  const [sub, setSub] = useState<Sub>(null)
  const open = ui.panel === "menu"
  const close = () => {
    ui.close()
    setTimeout(() => setSub(null), 600)
  }

  const links: { label: string; href?: string; sub?: Sub; accent?: boolean }[] = [
    { label: "Home", href: "/" },
    { label: "Shop", sub: "shop" },
    { label: "Collections", sub: "collections" },
    { label: "New in", href: "/shop?sort=newest" },
    { label: "Sale", href: "/shop?sale=1", accent: true },
    { label: "Gift cards", href: "/gift-cards" },
  ]

  const big = "font-display flex w-full items-center justify-between py-1.5 text-left text-[30px] leading-[1.2] tracking-tight lg:text-[32px]"

  return (
    <Sheet
      open={open}
      onClose={close}
      title="Menu"
      anchor="left"
      desktopWidth={460}
      hideHeader
      aside={<PromoColumn nav={nav} />}
    >
      <div className="relative h-full overflow-hidden">
        {/* root panel */}
        <div className="h-full overflow-y-auto px-6 pb-10 [scrollbar-width:none] lg:px-9" aria-hidden={sub !== null}>
          <div className="ny-reveal flex items-center justify-between pt-2 pb-8 lg:pt-8" style={{ ["--d" as any]: "0.2s" }}>
            <span className="font-display text-xl">nemaya<span className="text-clay">.</span></span>
            <SheetClose onClick={close} />
          </div>

          <p className="ny-reveal mb-2 text-xs text-stone" style={{ ["--d" as any]: "0.3s" }}>Menu</p>
          <nav aria-label="Menu">
            <ul>
              {links.map((l, i) => (
                <li key={l.label} className="ny-reveal" style={{ ["--d" as any]: `${0.3 + i * 0.04}s` }}>
                  {l.sub ? (
                    <button className={cn(big, "group/chev")} onClick={() => setSub(l.sub!)}>
                      <RollText>{l.label}</RollText>
                      <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-sand">
                        <ChevronRight className="ny-chev h-4 w-4" />
                      </span>
                    </button>
                  ) : (
                    <Link href={l.href!} onClick={close} className={cn(big, l.accent && "text-clay")}>
                      <RollText>{l.label}</RollText>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="ny-reveal mt-6 grid grid-cols-3 gap-2" style={{ ["--d" as any]: "0.4s" }}>
            <Quick href={signedIn ? "/account" : "/login"} icon={<User className="h-4 w-4" />} label={signedIn ? "Account" : "Sign in"} onClick={close} />
            <Quick href="/account/wishlist" icon={<Heart className="h-4 w-4" />} label="Wishlist" onClick={close} />
            <button onClick={() => ui.open("search")} className="flex flex-col items-center gap-1.5 rounded-2xl bg-sand/70 py-3 text-xs font-medium transition-colors hover:bg-sand">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>

          <p className="ny-reveal mt-8 mb-3 text-xs font-semibold text-stone" style={{ ["--d" as any]: "0.5s" }}>Popular categories</p>
          <ul className="space-y-2">
            {nav.categories.slice(0, 4).map((c, i) => (
              <li key={c.id} className="ny-reveal" style={{ ["--d" as any]: `${0.5 + i * 0.05}s` }}>
                <Link href={`/shop?category=${c.handle}`} onClick={close} className="group/chev flex items-center gap-3 rounded-2xl border border-bark/10 bg-paper p-2 pr-4 transition-colors hover:bg-sand/40">
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-sand">
                    {c.thumbnail && <Image src={c.thumbnail} alt="" fill sizes="48px" unoptimized className="object-cover" />}
                  </span>
                  <span className="flex-1 text-sm font-semibold">{c.name}</span>
                  <span className="overflow-hidden"><ChevronRight className="ny-chev h-4 w-4 text-stone" /></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* shop submenu */}
        <SubPanel active={sub === "shop"} onBack={() => setSub(null)} title="Shop">
          {[{ name: "All products", handle: "", count: undefined as number | undefined }, ...nav.categories].map((c, i) => (
            <Link
              key={c.handle || "all"}
              href={c.handle ? `/shop?category=${c.handle}` : "/shop"}
              onClick={close}
              className={cn(big, "ny-mega-item")}
              style={{ ["--i" as any]: i }}
            >
              <RollText>{c.name}</RollText>
              {c.count !== undefined && <span className="font-sans text-xs text-stone">{c.count}</span>}
            </Link>
          ))}
          <Link href="/gift-cards" onClick={close} className="ny-mega-item mt-6 flex items-center gap-3 rounded-2xl bg-moss p-4 text-linen" style={{ ["--i" as any]: nav.categories.length + 1 }}>
            <Gift className="h-5 w-5" /> <span className="text-sm font-semibold">Send a gift card</span>
          </Link>
        </SubPanel>

        {/* collections submenu */}
        <SubPanel active={sub === "collections"} onBack={() => setSub(null)} title="Collections">
          <div className="space-y-5">
            {nav.collections.map((c, i) => (
              <Link key={c.id} href={`/collections/${c.handle}`} onClick={close} className="ny-mega-item group block" style={{ ["--i" as any]: i }}>
                <span className="grid aspect-[16/6] grid-cols-3 gap-1 overflow-hidden rounded-2xl bg-sand">
                  {c.thumbnails.map((t, k) => (
                    <span key={k} className="relative overflow-hidden">
                      <Image src={t} alt="" fill sizes="150px" unoptimized className="object-cover transition duration-700 group-hover:scale-105" />
                    </span>
                  ))}
                </span>
                <span className="font-display mt-2 block text-2xl">{c.title}</span>
              </Link>
            ))}
            <Link href="/collections" onClick={close} className="ny-mega-item chip" style={{ ["--i" as any]: nav.collections.length }}>
              All collections
            </Link>
          </div>
        </SubPanel>
      </div>
    </Sheet>
  )
}

function SubPanel({ active, onBack, title, children }: { active: boolean; onBack: () => void; title: string; children: React.ReactNode }) {
  return (
    <div data-active={active} className="ny-submenu absolute inset-y-0 w-full overflow-y-auto bg-linen px-6 pb-10 [scrollbar-width:none] lg:px-9" aria-hidden={!active} inert={!active}>
      <button onClick={onBack} className="mt-2 mb-4 flex w-full items-center gap-2 border-b border-bark/10 pb-4 text-sm lg:mt-8">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-sand"><ChevronLeft className="h-4 w-4" /></span>
        Back
      </button>
      <p className="mb-2 text-xs text-stone">{title}</p>
      {children}
    </div>
  )
}

function Quick({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex flex-col items-center gap-1.5 rounded-2xl bg-sand/70 py-3 text-xs font-medium transition-colors hover:bg-sand">
      {icon} {label}
    </Link>
  )
}

/** Desktop-only promo column that cascades up beside the menu panel. */
function PromoColumn({ nav }: { nav: NavData }) {
  const ui = useUI()
  const feature = nav.sale[0] ?? nav.featured[0]
  return (
    <div className="ny-promo pointer-events-auto h-full overflow-y-auto rounded-t-[30px] bg-sand p-5 shadow-[0_0_30px_rgba(42,36,29,0.12)] [scrollbar-width:none]">
      <div className="space-y-4">
        {feature && (
          <Link href={`/products/${feature.handle}`} onClick={ui.close} className="ny-promo-card group relative block overflow-hidden rounded-[22px] bg-linen" style={{ ["--i" as any]: 0 }}>
            <span className="relative block aspect-[4/3]">
              {feature.thumbnail && <Image src={feature.thumbnail} alt={feature.title} fill sizes="360px" unoptimized className="object-cover transition duration-500 [transition-timing-function:var(--ease-default)] group-hover:scale-105" />}
            </span>
            <span className="absolute top-4 left-4 rounded-full bg-clay px-2.5 py-1 text-[10px] font-bold tracking-wider text-linen uppercase">
              {nav.sale[0] ? "On sale" : "New in"}
            </span>
            <span className="block p-4">
              <span className="font-display block text-xl leading-tight">{feature.title}</span>
              <span className="text-sm">
                {formatMoney(feature.price, feature.currency)}
                {feature.original > feature.price && <span className="ml-2 text-stone line-through">{formatMoney(feature.original, feature.currency)}</span>}
              </span>
            </span>
          </Link>
        )}
        {nav.collections[0] && (
          <Link href={`/collections/${nav.collections[0].handle}`} onClick={ui.close} className="ny-promo-card grain relative block overflow-hidden rounded-[22px] bg-bark p-5 text-linen" style={{ ["--i" as any]: 1 }}>
            <span className="text-[10px] font-semibold tracking-[0.2em] text-sage uppercase">Collection</span>
            <span className="font-display mt-2 block text-3xl leading-tight">{nav.collections[0].title}</span>
            <span className="mt-2 line-clamp-2 block text-xs text-linen/70">{nav.collections[0].description}</span>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold">Explore <ArrowUpRight className="h-3.5 w-3.5" /></span>
          </Link>
        )}
        <Link href="/gift-cards" onClick={ui.close} className="ny-promo-card relative block overflow-hidden rounded-[22px] bg-moss p-5 text-linen" style={{ ["--i" as any]: 2 }}>
          <Gift className="h-5 w-5" strokeWidth={1.5} />
          <span className="font-display mt-3 block text-2xl leading-tight">Give a gift card</span>
          <span className="mt-1 block text-xs text-linen/75">From $10, delivered on the day you choose.</span>
        </Link>
      </div>
    </div>
  )
}
