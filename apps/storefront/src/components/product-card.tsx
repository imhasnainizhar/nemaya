import Image from "next/image"
import Link from "next/link"
import type { Product } from "@/lib/types"
import { colorHex } from "@/lib/util"
import { Price, productPrice } from "./price"
import { WishlistButton } from "./wishlist-button"
import { QuickAdd } from "./product/quick-add"

export function ProductCard({ product, saved = false, priority = false }: { product: Product; saved?: boolean; priority?: boolean }) {
  const price = productPrice(product)
  const colors = product.options?.find((o) => o.title === "Color")?.values ?? []
  const second = product.images?.[1]?.url
  const soldOut = (product.variants ?? []).every((v: any) => v.manage_inventory && !v.allow_backorder && Number(v.inventory_quantity ?? 0) <= 0)

  return (
    <div className="group relative">
      <Link href={`/products/${product.handle}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-organic)] bg-sand">
          {product.thumbnail && (
            <Image
              src={product.thumbnail}
              alt={product.title}
              fill
              priority={priority}
              sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
              className="object-cover transition-all duration-700 ease-[var(--ease-soft)] group-hover:scale-[1.03]"
              unoptimized={product.thumbnail.endsWith(".svg")}
            />
          )}
          {second && (
            <Image
              src={second}
              alt=""
              fill
              sizes="(min-width:1024px) 25vw, 50vw"
              className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              unoptimized={second.endsWith(".svg")}
            />
          )}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {price?.onSale && <span className="rounded-full bg-clay px-2.5 py-1 text-[10px] font-bold tracking-wider text-linen uppercase">Sale</span>}
            {soldOut && <span className="rounded-full bg-bark px-2.5 py-1 text-[10px] font-bold tracking-wider text-linen uppercase">Sold out</span>}
          </div>
        </div>
        <div className="mt-3.5 px-1 text-center">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-stone uppercase">{product.categories?.[0]?.name ?? product.collection?.title}</p>
          <h3 className="mt-1 truncate text-sm font-medium">{product.title}</h3>
          <Price price={price} className="mt-1 justify-center" />
          {colors.length > 1 && (
            <div className="mt-2 flex justify-center gap-1.5">
              {colors.slice(0, 5).map((c) => (
                <span key={c.id} title={c.value} className="h-3 w-3 rounded-full ring-1 ring-bark/15" style={{ background: colorHex(product, c.value) }} />
              ))}
            </div>
          )}
        </div>
      </Link>
      <WishlistButton productId={product.id} initial={saved} className="absolute top-3 right-3" />
      {!soldOut && <QuickAddSlot product={product} />}
    </div>
  )
}

/** Quick add sits on the image's bottom-right corner; always visible on touch, on hover for mouse. */
function QuickAddSlot({ product }: { product: Product }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[3/4] has-[[aria-expanded=true]]:z-30">
      <div className="pointer-events-auto absolute right-3 bottom-3 transition md:translate-y-1 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 md:has-[[aria-expanded=true]]:translate-y-0 md:has-[[aria-expanded=true]]:opacity-100">
        <QuickAdd product={product} />
      </div>
    </div>
  )
}
