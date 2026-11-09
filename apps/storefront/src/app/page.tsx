import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Bell, Gift, Leaf } from "lucide-react"
import { getWishlist, listCategories, listCollections, listProducts } from "@/lib/data"
import { ProductCard } from "@/components/product-card"

export const revalidate = 60

export default async function Home() {
  const [{ products }, categories, collections, wishlist] = await Promise.all([
    listProducts({ limit: 12, order: "-created_at" }),
    listCategories(),
    listCollections(),
    getWishlist(),
  ])
  const saved = new Set(wishlist.items.map((i) => i.product_id))
  const hero = products.find((p) => p.handle === "essential-oversized-hoodie") ?? products[0]
  const drop = products.find((p) => p.handle === "quilted-puffer-jacket") ?? products[1]
  const earth = collections.find((c: any) => c.handle === "earth-tones")

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="container-x grid items-center gap-10 pt-10 pb-16 lg:grid-cols-[1.1fr_1fr] lg:pt-16 lg:pb-24">
          <div className="relative z-10 animate-rise">
            <p className="mb-6 text-xs font-semibold tracking-[0.24em] text-clay uppercase">// Autumn drop 2026</p>
            <h1 className="font-display text-[clamp(56px,9vw,128px)] leading-[0.9] font-medium tracking-[-0.03em]">
              Wear the
              <br />
              <span className="italic text-moss">earth</span>
              <span className="text-clay">.</span>
            </h1>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-bark-soft">
              Heavyweight organic basics in colours borrowed from clay, moss and stone. Made slow, worn often.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/shop" className="btn-primary px-7 py-4">
                Discover the collection <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href="/shop?sale=1" className="btn-ghost px-7 py-4">Shop the sale</Link>
            </div>
            <dl className="mt-14 grid max-w-md grid-cols-3 divide-x divide-bark/15">
              {[
                ["100%", "Organic cotton"],
                ["420", "GSM fleece"],
                ["30d", "Free returns"],
              ].map(([v, l]) => (
                <div key={l} className="px-4 first:pl-0">
                  <dt className="font-display text-3xl">{v}</dt>
                  <dd className="mt-1 text-xs text-stone">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto aspect-[4/5] w-full max-w-[520px]">
            <div className="blob absolute inset-[6%] bg-sand-deep" />
            <div className="blob absolute inset-[12%_0_0_14%] rotate-12 bg-clay/15" />
            {hero?.thumbnail && (
              <div className="blob absolute inset-[3%_6%_8%_8%] overflow-hidden">
                <Image src={hero.thumbnail} alt={hero.title} fill priority unoptimized className="object-cover" />
              </div>
            )}
            <span className="absolute top-[6%] right-[2%] grid h-24 w-24 place-items-center rounded-full bg-linen text-center text-[9px] font-semibold tracking-[0.2em] uppercase shadow-lg shadow-bark/5">
              <Leaf className="mb-1 h-5 w-5 text-moss" />
              Made
              <br />
              slow
            </span>
            {drop && (
              <Link
                href={`/products/${drop.handle}`}
                className="card absolute -bottom-4 left-0 flex w-[260px] items-center gap-4 p-3 pr-5 shadow-xl shadow-bark/10 transition hover:-translate-y-1 sm:-left-8"
              >
                <span className="relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl bg-sand">
                  {drop.thumbnail && <Image src={drop.thumbnail} alt="" fill unoptimized className="object-cover" />}
                </span>
                <span>
                  <span className="block text-[10px] font-semibold tracking-[0.18em] text-clay uppercase">New drop</span>
                  <span className="font-display mt-1 block text-lg leading-tight">{drop.title}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs text-bark-soft">Shop now <ArrowRight className="h-3 w-3" /></span>
                </span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────── */}
      <section className="container-x">
        <div className="flex flex-wrap gap-2">
          <Link href="/shop" className="chip chip-active">All</Link>
          {categories.map((c: any) => (
            <Link key={c.id} href={`/shop?category=${c.handle}`} className="chip">{c.name}</Link>
          ))}
          <Link href="/gift-cards" className="chip"><Gift className="mr-1.5 h-3.5 w-3.5" /> Gift cards</Link>
        </div>
      </section>

      {/* ── New arrivals ─────────────────────────────────── */}
      <section className="container-x mt-12">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-4xl tracking-tight sm:text-5xl">New arrivals</h2>
          <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:text-clay">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.slice(0, 8).map((p, i) => (
            <ProductCard key={p.id} product={p} saved={saved.has(p.id)} priority={i < 4} />
          ))}
        </div>
      </section>

      {/* ── Campaign banner ──────────────────────────────── */}
      <section className="container-x mt-24">
        <div className="grain relative overflow-hidden rounded-[40px] bg-clay px-6 py-16 text-linen sm:px-14 sm:py-24">
          <div className="blob absolute -top-20 -right-16 h-80 w-80 bg-ochre/40" />
          <div className="blob absolute -bottom-24 left-1/3 h-72 w-72 bg-clay-deep/60" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.24em] uppercase opacity-80">Earth Week · Limited time</p>
            <h2 className="font-display mt-4 text-[clamp(48px,8vw,104px)] leading-[0.9] font-medium tracking-[-0.03em]">
              Up to 33% off
              <br />
              <span className="italic">the essentials.</span>
            </h2>
            <p className="mt-6 max-w-md text-linen/85">Our heaviest hoodie and roomiest cargos, marked down while the season turns.</p>
            <Link href="/shop?sale=1" className="btn mt-10 bg-linen px-8 py-4 text-bark hover:bg-paper">
              Shop the sale <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Earth tones collection ───────────────────────── */}
      {earth && (
        <section className="container-x mt-24">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-moss uppercase">Collection</p>
              <h2 className="font-display mt-2 text-4xl tracking-tight sm:text-5xl">{earth.title}</h2>
            </div>
            <Link href={`/shop?collection=${earth.handle}`} className="inline-flex items-center gap-1.5 text-sm font-semibold hover:text-clay">
              Explore <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {products
              .filter((p) => (p as any).collection?.handle === "earth-tones")
              .slice(0, 4)
              .map((p) => (
                <ProductCard key={p.id} product={p} saved={saved.has(p.id)} />
              ))}
          </div>
        </section>
      )}

      {/* ── Gift cards + alerts ──────────────────────────── */}
      <section className="container-x mt-24 grid gap-4 md:grid-cols-2">
        <Link href="/gift-cards" className="group card relative overflow-hidden bg-moss p-10 text-linen">
          <Gift className="h-8 w-8" strokeWidth={1.4} />
          <h3 className="font-display mt-10 text-4xl leading-tight">Give something
            <br />they’ll live in.</h3>
          <p className="mt-3 max-w-xs text-linen/80">Digital gift cards from $10, delivered on the day you choose.</p>
          <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold">Send a gift card <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
        </Link>
        <Link href="/account/notifications" className="group card relative overflow-hidden bg-sand p-10">
          <Bell className="h-8 w-8 text-clay" strokeWidth={1.4} />
          <h3 className="font-display mt-10 text-4xl leading-tight">Hear about drops
            <br />before anyone.</h3>
          <p className="mt-3 max-w-xs text-bark-soft">Turn on notifications for price drops, restocks on your wishlist and new releases.</p>
          <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold">Turn on alerts <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
        </Link>
      </section>
    </>
  )
}
