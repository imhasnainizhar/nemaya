import Image from "next/image"
import Link from "next/link"
import type { NavCategory } from "@/lib/nav"
import { cn } from "@/lib/util"

/** Horizontal strip of small image cards (fixed small ratio) for jumping between categories. */
export function CategoryStrip({ categories, active, basePath = "/shop" }: { categories: NavCategory[]; active?: string; basePath?: string }) {
  if (!categories.length) return null
  return (
    <section className="container-x mt-6">
      <ul className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pt-1 pb-2 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0">
        <li className="snap-start">
          <StripCard href={basePath} label="All" active={!active} />
        </li>
        {categories.map((c) => (
          <li key={c.id} className="snap-start">
            <StripCard href={`${basePath}?category=${c.handle}`} label={c.name} image={c.thumbnail} active={active === c.handle} count={c.count} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function StripCard({ href, label, image, active, count }: { href: string; label: string; image?: string | null; active?: boolean; count?: number }) {
  return (
    <Link href={href} className="group block w-[104px] sm:w-[128px]" aria-current={active ? "page" : undefined}>
      <span
        className={cn(
          "relative block aspect-square overflow-hidden rounded-[22px] bg-sand transition",
          active ? "ring-2 ring-bark ring-offset-2 ring-offset-linen" : "group-hover:ring-1 group-hover:ring-bark/20"
        )}
      >
        {image ? (
          <Image src={image} alt="" fill sizes="128px" unoptimized={image.endsWith(".svg")} className="object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <span className="font-display grid h-full place-items-center bg-bark text-3xl text-linen">All</span>
        )}
      </span>
      <span className={cn("mt-2 block truncate text-center text-xs", active ? "font-semibold" : "text-bark-soft")}>
        {label}
        {count !== undefined && <span className="ml-1 text-stone">{count}</span>}
      </span>
    </Link>
  )
}
