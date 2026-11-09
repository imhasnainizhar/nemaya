import Image from "next/image"
import Link from "next/link"
import { Home } from "lucide-react"
import { cn } from "@/lib/util"

export type Crumb = { label: string; href?: string }

/**
 * Short hero for catalog + collection pages. Height comes from the aspect ratio
 * (wide on desktop, a little taller on phones) so it never dominates the page.
 */
export function CatalogBanner({
  title,
  crumbs,
  description,
  images = [],
  tone = "bark",
}: {
  title: string
  crumbs: Crumb[]
  description?: string
  images?: string[]
  tone?: "bark" | "moss" | "clay"
}) {
  const bg = { bark: "bg-bark", moss: "bg-moss", clay: "bg-clay" }[tone]
  return (
    <section className="container-x pt-4">
      <div
        className={cn(
          "grain relative overflow-hidden rounded-[32px] text-linen",
          "aspect-[2/1] min-h-[168px] sm:aspect-[3/1] lg:aspect-[4/1] xl:aspect-[9/2]",
          bg
        )}
      >
        <span className="blob absolute -top-24 -left-20 h-72 w-72 bg-linen/5" />
        <span className="blob absolute -right-10 -bottom-28 h-80 w-80 bg-clay/25" />

        {/* product art collage — hidden on small phones to keep the banner short */}
        {images.length > 0 && (
          <div className="absolute inset-y-0 right-0 hidden w-[46%] items-center justify-end gap-3 pr-6 sm:flex lg:pr-10">
            {images.slice(0, 3).map((src, i) => (
              <span
                key={src + i}
                className={cn(
                  "relative block aspect-[3/4] h-[72%] shrink-0 overflow-hidden rounded-[22px] bg-sand shadow-xl shadow-black/20",
                  i === 1 && "h-[86%]",
                  i === 0 && "-rotate-3",
                  i === 2 && "rotate-3"
                )}
              >
                <Image src={src} alt="" fill sizes="160px" unoptimized={src.endsWith(".svg")} className="object-cover" />
              </span>
            ))}
          </div>
        )}

        <div className="relative flex h-full flex-col justify-center px-6 sm:w-[56%] sm:px-10 lg:px-14">
          <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-2 text-xs text-linen/70">
            <Link href="/" aria-label="Home" className="grid h-6 w-6 place-items-center rounded-full bg-linen/15 hover:bg-linen/25">
              <Home className="h-3 w-3" />
            </Link>
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-linen/40" />
                {c.href ? <Link href={c.href} className="hover:text-linen">{c.label}</Link> : <span className="text-linen">{c.label}</span>}
              </span>
            ))}
          </nav>
          <h1 className="font-display text-[clamp(34px,5vw,64px)] leading-[0.95] tracking-tight">{title}</h1>
          {description && <p className="mt-3 line-clamp-2 max-w-md text-sm text-linen/75 max-sm:hidden">{description}</p>}
        </div>
      </div>
    </section>
  )
}
