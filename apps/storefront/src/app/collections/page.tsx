import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { ArrowUpRight } from "lucide-react"
import { getWishlist, listProducts } from "@/lib/data"
import { getNavData } from "@/lib/nav"
import { CatalogBanner } from "@/components/catalog/catalog-banner"
import { ProductRail } from "@/components/catalog/product-rail"

export const metadata: Metadata = { title: "Collections" }

export default async function CollectionsPage() {
  const [nav, wishlist, { products }] = await Promise.all([getNavData(), getWishlist(), listProducts({ limit: 200, order: "-created_at" })])
  const saved = new Set(wishlist.items.map((i) => i.product_id))

  return (
    <div>
      <CatalogBanner
        title="Collections"
        crumbs={[{ label: "Collections" }]}
        description="Small, considered edits — each one built around a feeling, a season or a fabric."
        images={nav.collections.flatMap((c) => c.thumbnails).slice(0, 3)}
      />

      <div className="mt-12 space-y-20">
        {nav.collections.map((c, idx) => {
          const items = products.filter((p) => p.collection?.id === c.id)
          return (
            <section key={c.id} aria-labelledby={`col-${c.handle}`}>
              <div className="container-x">
                {/* collection hero: short, ratio-managed image band + copy */}
                <Link
                  href={`/collections/${c.handle}`}
                  className="group grid overflow-hidden rounded-[32px] bg-sand md:grid-cols-[1.3fr_1fr]"
                >
                  <span className={`relative grid aspect-[16/7] grid-cols-3 gap-1 md:aspect-auto md:min-h-[260px] ${idx % 2 ? "md:order-2" : ""}`}>
                    {c.thumbnails.map((t, i) => (
                      <span key={i} className="relative overflow-hidden">
                        <Image src={t} alt="" fill sizes="(min-width:768px) 20vw, 33vw" unoptimized={t.endsWith(".svg")} className="object-cover transition duration-700 group-hover:scale-105" />
                      </span>
                    ))}
                  </span>
                  <span className="flex flex-col justify-center p-6 sm:p-10">
                    <span className="text-[11px] font-semibold tracking-[0.2em] text-clay uppercase">{c.count} pieces</span>
                    <span id={`col-${c.handle}`} className="font-display mt-2 text-4xl leading-tight sm:text-5xl">{c.title}</span>
                    <span className="mt-3 max-w-md text-sm leading-relaxed text-bark-soft">{c.description}</span>
                    <span className="btn-primary mt-6 w-fit">
                      Shop the collection <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </span>
                </Link>
              </div>
              {items.length > 0 && <ProductRail products={items} saved={[...saved]} label={`${c.title} products`} />}
            </section>
          )
        })}
      </div>
    </div>
  )
}
