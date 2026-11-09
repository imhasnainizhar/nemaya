import Link from "next/link"
import { Bell } from "lucide-react"
import { getWishlist, listProducts } from "@/lib/data"
import { ProductCard } from "@/components/product-card"

export default async function WishlistPage() {
  const { items } = await getWishlist()
  const ids = items.map((i) => i.product_id)
  const { products } = ids.length ? await listProducts({ id: ids, limit: 100 }) : { products: [] }
  const ordered = ids.map((id) => products.find((p) => p.id === id)).filter(Boolean) as typeof products

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl">Wishlist</h2>
          <p className="mt-1 text-sm text-stone">We’ll let you know when these drop in price or come back in stock.</p>
        </div>
        <Link href="/account/notifications" className="chip"><Bell className="mr-1.5 h-3.5 w-3.5" /> Alert settings</Link>
      </div>
      {ordered.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="text-stone">Tap the heart on anything you love.</p>
          <Link href="/shop" className="btn-primary mt-6">Browse the shop</Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
          {ordered.map((p) => <ProductCard key={p.id} product={p} saved />)}
        </div>
      )}
    </div>
  )
}
