import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getProduct, getWishlist, listProducts } from "@/lib/data"
import { ProductCard } from "@/components/product-card"
import { ProductDetail } from "./product-detail"

type Params = Promise<{ handle: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await getProduct((await params).handle)
  return product ? { title: product.title, description: product.description ?? undefined, openGraph: { images: product.thumbnail ? [product.thumbnail] : [] } } : {}
}

export default async function ProductPage({ params }: { params: Params }) {
  const { handle } = await params
  const product = await getProduct(handle)
  if (!product) notFound()

  const categoryId = product.categories?.[0]?.id
  const [{ products: related }, wishlist] = await Promise.all([
    listProducts({ limit: 5, category_id: categoryId }),
    getWishlist(),
  ])
  const saved = new Set(wishlist.items.map((i) => i.product_id))
  let more = related.filter((p) => p.id !== product.id)
  if (more.length < 4) {
    const { products } = await listProducts({ limit: 8 })
    more = [...more, ...products.filter((p) => p.id !== product.id && !more.some((m) => m.id === p.id))]
  }

  return (
    <div className="container-x pt-8">
      <nav className="mb-6 text-xs text-stone" aria-label="Breadcrumb">
        <Link href="/shop" className="hover:text-bark">Shop</Link>
        {product.categories?.[0] && (
          <>
            {" / "}
            <Link href={`/shop?category=${product.categories[0].handle}`} className="hover:text-bark">{product.categories[0].name}</Link>
          </>
        )}
        {" / "}
        <span className="text-bark">{product.title}</span>
      </nav>

      <ProductDetail product={product} saved={saved.has(product.id)} />

      <section className="mt-28">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">You may also like</h2>
          <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:text-clay">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {more.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} saved={saved.has(p.id)} />
          ))}
        </div>
      </section>
    </div>
  )
}
