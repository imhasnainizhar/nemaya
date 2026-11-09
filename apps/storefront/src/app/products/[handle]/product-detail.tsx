"use client"

import Image from "next/image"
import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, RotateCcw, ShieldCheck, ShoppingBag, Truck } from "lucide-react"
import type { Product } from "@/lib/types"
import { addToCartAction } from "@/lib/actions"
import { cn, colorHex } from "@/lib/util"
import { Price, productPrice, variantPrice } from "@/components/price"
import { WishlistButton } from "@/components/wishlist-button"
import { useUI } from "@/components/ui/ui-provider"

const TABS = ["Details", "Materials", "Size & Fit", "Shipping & Returns"] as const

export function ProductDetail({ product, saved }: { product: Product; saved: boolean }) {
  const router = useRouter()
  const ui = useUI()
  const colorOpt = product.options?.find((o) => o.title === "Color")
  const sizeOpt = product.options?.find((o) => o.title === "Size")
  const [color, setColor] = useState(colorOpt?.values?.[0]?.value ?? "")
  const [size, setSize] = useState<string>(sizeOpt?.values?.length === 1 ? sizeOpt.values[0].value : "")
  const [imageIdx, setImageIdx] = useState(0)
  const [tab, setTab] = useState<(typeof TABS)[number]>("Details")
  const [pending, start] = useTransition()
  const [status, setStatus] = useState<{ ok?: boolean; error?: string } | null>(null)

  const optionValue = (v: any, title: string) => v.options?.find((o: any) => o.option?.title === title || o.option_id === product.options?.find((x) => x.title === title)?.id)?.value

  const variant = useMemo(
    () =>
      (product.variants ?? []).find(
        (v) => (!colorOpt || optionValue(v, "Color") === color) && (!sizeOpt || optionValue(v, "Size") === size)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [color, size, product.variants]
  )

  const inStock = (v: any) => !v?.manage_inventory || v?.allow_backorder || Number(v?.inventory_quantity ?? 0) > 0
  const sizeAvailable = (s: string) =>
    (product.variants ?? []).some((v) => optionValue(v, "Size") === s && (!colorOpt || optionValue(v, "Color") === color) && inStock(v))

  const images = product.images ?? []
  const colorImage = (product.variants ?? []).find((v) => optionValue(v, "Color") === color)?.metadata?.image as string | undefined
  const mainSrc = imageIdx === -1 && colorImage ? colorImage : images[Math.max(0, imageIdx)]?.url ?? product.thumbnail ?? ""

  const price = variant ? variantPrice(variant) : productPrice(product)

  const add = () => {
    if (!variant) {
      setStatus({ error: sizeOpt && !size ? "Pick a size first." : "This combination isn't available." })
      return
    }
    start(async () => {
      const res = await addToCartAction(variant.id, 1)
      setStatus(res ?? { ok: true })
      if (!res?.error) {
        await ui.showCart()
        router.refresh()
      }
    })
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16">
      {/* gallery */}
      <div className="flex flex-col-reverse gap-4 md:flex-row md:items-start lg:sticky lg:top-28 lg:self-start">
        <div className="flex gap-3 md:flex-col">
          {images.slice(0, 6).map((img, i) => (
            <button
              key={img.id}
              onClick={() => setImageIdx(i)}
              aria-label={`Image ${i + 1}`}
              className={cn(
                "relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-2xl bg-sand transition md:w-20",
                (imageIdx === i || (imageIdx === -1 && img.url === colorImage)) ? "ring-2 ring-bark" : "opacity-70 hover:opacity-100"
              )}
            >
              <Image src={img.url} alt="" fill sizes="80px" unoptimized={img.url.endsWith(".svg")} className="object-cover" />
            </button>
          ))}
        </div>
        <div className="relative aspect-[3/4] flex-1 overflow-hidden rounded-[var(--radius-organic)] bg-sand">
          {mainSrc && (
            <Image key={mainSrc} src={mainSrc} alt={product.title} fill priority sizes="(min-width:1024px) 50vw, 100vw" unoptimized={mainSrc.endsWith(".svg")} className="object-cover animate-rise" />
          )}
        </div>
      </div>

      {/* info */}
      <div className="lg:pt-4">
        {product.collection && (
          <span className="inline-block rounded-full bg-sand px-3 py-1 text-xs font-medium">{product.collection.title}</span>
        )}
        <h1 className="font-display mt-4 text-4xl leading-[1.05] tracking-tight sm:text-5xl">{product.title}</h1>
        <div className="mt-5">
          <Price price={price} size="lg" />
        </div>
        <p className="mt-6 max-w-md leading-relaxed text-bark-soft">{product.description}</p>

        <div className="my-8 h-px bg-bark/10" />

        {colorOpt && (
          <div>
            <p className="text-sm"><span className="font-semibold">Color:</span> <span className="text-bark-soft">{color}</span></p>
            <div className="mt-3 flex flex-wrap gap-3">
              {colorOpt.values?.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setColor(v.value)
                    setImageIdx(-1)
                    setStatus(null)
                  }}
                  aria-label={v.value}
                  aria-pressed={color === v.value}
                  className={cn("h-11 w-11 rounded-full transition", color === v.value ? "ring-2 ring-bark ring-offset-2 ring-offset-linen" : "ring-1 ring-bark/15 hover:scale-105")}
                  style={{ background: colorHex(product, v.value) }}
                />
              ))}
            </div>
          </div>
        )}

        {sizeOpt && (
          <div className="mt-7">
            <div className="flex items-center justify-between text-sm">
              <p><span className="font-semibold">Size:</span> <span className="text-bark-soft">{size || "Select"}</span></p>
              <button onClick={() => setTab("Size & Fit")} className="text-bark-soft underline underline-offset-4 hover:text-bark">Size guide</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {sizeOpt.values?.map((v) => {
                const available = sizeAvailable(v.value)
                return (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSize(v.value)
                      setStatus(null)
                    }}
                    aria-pressed={size === v.value}
                    className={cn(
                      "min-w-[56px] rounded-2xl border px-4 py-3 text-sm font-medium transition",
                      size === v.value ? "border-bark bg-bark text-linen" : "border-bark/15 hover:border-bark/40",
                      !available && "text-stone line-through decoration-stone/60"
                    )}
                  >
                    {v.value}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button onClick={add} disabled={pending || (variant && !inStock(variant))} className="btn-primary h-[52px] flex-1 text-base">
            {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : status?.ok ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" strokeWidth={1.7} />}
            {variant && !inStock(variant) ? "Sold out — save it to get notified" : status?.ok ? "Added to cart" : "Add to cart"}
          </button>
          <WishlistButton productId={product.id} initial={saved} variant="large" />
        </div>
        {status?.error && <p className="mt-3 text-sm text-clay">{status.error}</p>}
        {status?.ok && (
          <p className="mt-3 text-sm text-moss">
            Added. <button onClick={() => ui.open("cart")} className="font-semibold underline underline-offset-4">View cart</button>
          </p>
        )}

        <ul className="mt-8 grid grid-cols-3 gap-3 text-[11px] text-bark-soft">
          {[
            [Truck, "Free shipping", "Orders over $99"],
            [RotateCcw, "Easy returns", "30-day policy"],
            [ShieldCheck, "Secure checkout", "Stripe test mode"],
          ].map(([Icon, t, s]: any) => (
            <li key={t} className="flex items-start gap-2">
              <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.6} />
              <span><span className="block font-semibold text-bark">{t}</span>{s}</span>
            </li>
          ))}
        </ul>

        {/* tabs */}
        <div className="mt-12">
          <div className="flex gap-6 overflow-x-auto border-b border-bark/10" role="tablist">
            {TABS.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={cn("-mb-px shrink-0 border-b-2 pb-3 text-sm transition", tab === t ? "border-bark font-semibold" : "border-transparent text-stone hover:text-bark")}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="pt-5 text-sm leading-relaxed text-bark-soft" role="tabpanel">
            {tab === "Details" && (
              <ul className="space-y-2">
                <li>• {product.description}</li>
                <li>• Relaxed, slightly oversized silhouette</li>
                <li>• Garment-dyed for a lived-in, earthy tone</li>
                <li>• Unisex sizing</li>
              </ul>
            )}
            {tab === "Materials" && <p>{(product as any).material ?? product.subtitle ?? "Responsibly sourced natural fibres."} Wash cold, dry flat, and it will last for years.</p>}
            {tab === "Size & Fit" && (
              <table className="w-full text-left">
                <thead><tr className="text-bark"><th className="py-1">Size</th><th>Chest (cm)</th><th>Length (cm)</th></tr></thead>
                <tbody>
                  {[["S", 116, 68], ["M", 122, 70], ["L", 128, 72], ["XL", 134, 74], ["XXL", 140, 76]].map(([s, c, l]) => (
                    <tr key={s} className="border-t border-bark/10"><td className="py-1.5">{s}</td><td>{c}</td><td>{l}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            {tab === "Shipping & Returns" && <p>Standard shipping 4–7 business days, free over $99. Express in 1–2 days. Free returns within 30 days. (Demo store — nothing actually ships.)</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
