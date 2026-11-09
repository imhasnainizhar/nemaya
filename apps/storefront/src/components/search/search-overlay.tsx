"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { ArrowRight, Clock, Loader2, Search, X } from "lucide-react"
import type { NavData } from "@/lib/nav"
import type { Product } from "@/lib/types"
import { useUI } from "@/components/ui/ui-provider"
import { Price, productPrice } from "@/components/price"
import { QuickAdd } from "@/components/product/quick-add"
import { cn, formatMoney } from "@/lib/util"

type Results = { products: Product[]; count: number; categories: { name: string; handle: string }[]; collections: { title: string; handle: string }[] }
const EMPTY: Results = { products: [], count: 0, categories: [], collections: [] }
const RECENT_KEY = "nemaya:recent-searches"
const SUGGESTIONS = ["hoodie", "linen", "cargo", "puffer", "beanie"]

/** Full-screen search: pill input on top, predictive results sheet below (tabs + quick add). */
export function SearchOverlay({ nav }: { nav: NavData }) {
  const ui = useUI()
  const open = ui.panel === "search"
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [mounted, setMounted] = useState(false)
  const [render, setRender] = useState(false)
  const [shown, setShown] = useState(false)
  const [q, setQ] = useState("")
  const [res, setRes] = useState<Results>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<"products" | "pages">("products")
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => setMounted(true), [])
  // keep mounted through the 0.8s exit so the closing animation can play
  useEffect(() => {
    if (open) {
      setRender(true)
      const go = setTimeout(() => setShown(true), 20)
      return () => clearTimeout(go)
    }
    setShown(false)
    const t = setTimeout(() => setRender(false), 800)
    return () => clearTimeout(t)
  }, [open])
  useEffect(() => {
    if (!open) return
    document.documentElement.style.overflow = "hidden"
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"))
    } catch {}
    const t = setTimeout(() => input.current?.focus({ preventScroll: true }), 350)
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && ui.close()
    window.addEventListener("keydown", onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener("keydown", onKey)
      document.documentElement.style.overflow = ""
    }
  }, [open, ui])

  // debounced predictive search
  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) {
      setRes(EMPTY)
      setLoading(false)
      return
    }
    setLoading(true)
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => setRes(d))
        .catch(() => undefined)
        .finally(() => setLoading(false))
    }, 220)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [q])

  const remember = (term: string) => {
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 5)
    setRecent(next)
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    } catch {}
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const term = q.trim()
    if (!term) return
    remember(term)
    ui.close()
    router.push(`/shop?q=${encodeURIComponent(term)}`)
  }

  if (!mounted || !render) return null
  const term = q.trim()
  const pages = res.categories.length + res.collections.length

  return createPortal(
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Search" data-open={shown}>
      <div className="ny-overlay absolute inset-0" onClick={ui.close} />

      <div className="relative mx-auto flex h-full max-w-[770px] flex-col px-3 pt-3 sm:px-5 sm:pt-6">
        {/* pill input */}
        <form onSubmit={submit} className="ny-search-form flex items-center gap-2">
          <label className="flex h-14 flex-1 items-center gap-3 rounded-full bg-paper px-5 shadow-xl shadow-bark/10">
            <Search className="h-5 w-5 shrink-0 text-stone" />
            <input
              ref={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search hoodies, linen, cargo…"
              className="h-full flex-1 bg-transparent text-base outline-none placeholder:text-stone"
              aria-label="Search products"
              enterKeyHint="search"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-stone" />}
            {q && (
              <button type="button" onClick={() => setQ("")} className="text-xs font-semibold text-bark-soft hover:text-bark">
                Clear
              </button>
            )}
          </label>
          <button type="button" onClick={ui.close} aria-label="Close search" className="ny-close grid h-14 w-14 shrink-0 place-items-center rounded-full bg-paper shadow-xl shadow-bark/10 hover:bg-sand">
            <X className="h-5 w-5" />
          </button>
        </form>

        {/* results sheet */}
        <div className="ny-search-body mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-t-[30px] bg-linen pb-28 lg:pb-6">
          {term.length < 2 ? (
            <div className="p-6">
              {recent.length > 0 && (
                <Section title="Recent">
                  <div className="flex flex-wrap gap-2">
                    {recent.map((r) => (
                      <button key={r} onClick={() => setQ(r)} className="chip gap-1.5 text-sm">
                        <Clock className="h-3.5 w-3.5 text-stone" /> {r}
                      </button>
                    ))}
                  </div>
                </Section>
              )}
              <Section title="Popular searches" delay={0.3}>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => setQ(s)} className="chip text-sm">{s}</button>
                  ))}
                </div>
              </Section>
              <Section title="Trending now" delay={0.4}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {nav.featured.map((p) => (
                    <Link key={p.id} href={`/products/${p.handle}`} onClick={ui.close} className="group block">
                      <span className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-sand">
                        {p.thumbnail && <Image src={p.thumbnail} alt="" fill sizes="160px" unoptimized className="object-cover transition duration-500 group-hover:scale-105" />}
                      </span>
                      <span className="mt-2 block truncate text-xs font-semibold">{p.title}</span>
                      <span className="text-xs text-bark-soft">{formatMoney(p.price, p.currency)}</span>
                    </Link>
                  ))}
                </div>
              </Section>
            </div>
          ) : (
            <div>
              <div className="sticky top-0 z-10 flex justify-center gap-2 bg-linen/95 px-6 pt-5 pb-3 backdrop-blur">
                <TabButton active={tab === "products"} onClick={() => setTab("products")}>Products {res.count ? `(${res.count})` : ""}</TabButton>
                <TabButton active={tab === "pages"} onClick={() => setTab("pages")}>Categories & collections {pages ? `(${pages})` : ""}</TabButton>
              </div>

              {tab === "products" ? (
                <ul className="space-y-2 px-3 pb-4 sm:px-5">
                  {!loading && res.products.length === 0 && (
                    <li className="py-12 text-center text-sm text-stone">No products match “{term}”.</li>
                  )}
                  {res.products.map((p, idx) => (
                    <li key={p.id} className="ny-reveal flex items-center gap-3 rounded-2xl bg-paper p-2 pr-3 ring-1 ring-bark/5" style={{ ["--d" as any]: `${Math.min(idx, 8) * 0.04}s` }}>
                      <Link href={`/products/${p.handle}`} onClick={() => { remember(term); ui.close() }} className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-sand">
                          {p.thumbnail && <Image src={p.thumbnail} alt="" fill sizes="56px" unoptimized className="object-cover" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[10px] font-semibold tracking-[0.16em] text-stone uppercase">{p.categories?.[0]?.name}</span>
                          <span className="block truncate text-sm font-semibold"><Highlight text={p.title} term={term} /></span>
                          <Price price={productPrice(p)} />
                        </span>
                      </Link>
                      <QuickAdd product={p} size="sm" placement="side" />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-2 px-3 pb-4 sm:px-5">
                  {pages === 0 && <p className="py-12 text-center text-sm text-stone">No categories or collections match “{term}”.</p>}
                  {res.categories.map((c) => (
                    <PageLink key={c.handle} href={`/shop?category=${c.handle}`} label={c.name} kind="Category" onClick={ui.close} />
                  ))}
                  {res.collections.map((c) => (
                    <PageLink key={c.handle} href={`/collections/${c.handle}`} label={c.title} kind="Collection" onClick={ui.close} />
                  ))}
                </div>
              )}

              {res.count > 0 && (
                <div className="sticky bottom-0 border-t border-bark/10 bg-linen/95 p-4 text-center backdrop-blur">
                  <button onClick={submit as any} className="inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4">
                    View all {res.count} results <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function Section({ title, children, delay = 0.25 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <section className="ny-reveal mb-7 last:mb-0" style={{ ["--d" as any]: `${delay}s` }}>
      <p className="mb-3 text-[11px] font-semibold tracking-[0.2em] text-stone uppercase">{title}</p>
      {children}
    </section>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("rounded-full px-4 py-2 text-xs font-semibold transition", active ? "bg-bark text-linen" : "bg-sand/70 hover:bg-sand")}>
      {children}
    </button>
  )
}

function PageLink({ href, label, kind, onClick }: { href: string; label: string; kind: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center justify-between rounded-2xl bg-paper px-5 py-4 ring-1 ring-bark/5 hover:bg-sand/50">
      <span>
        <span className="block text-[10px] font-semibold tracking-[0.16em] text-stone uppercase">{kind}</span>
        <span className="font-display text-xl">{label}</span>
      </span>
      <ArrowRight className="h-4 w-4" />
    </Link>
  )
}

function Highlight({ text, term }: { text: string; term: string }) {
  const i = text.toLowerCase().indexOf(term.toLowerCase())
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-ochre/30 px-0.5 text-bark">{text.slice(i, i + term.length)}</mark>
      {text.slice(i + term.length)}
    </>
  )
}
