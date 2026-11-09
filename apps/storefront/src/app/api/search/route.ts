import { NextResponse } from "next/server"
import { listCategories, listCollections, listProducts } from "@/lib/data"

export const dynamic = "force-dynamic"

/** Predictive search for the search overlay: products + matching categories/collections. */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 80)
  if (q.length < 2) return NextResponse.json({ products: [], count: 0, categories: [], collections: [] })

  const term = q.toLowerCase()
  const [{ products, count }, categories, collections] = await Promise.all([
    listProducts({ q, limit: 8 }),
    listCategories(),
    listCollections(),
  ])
  return NextResponse.json({
    products,
    count,
    categories: categories.filter((c: any) => c.name.toLowerCase().includes(term)).map((c: any) => ({ name: c.name, handle: c.handle })),
    collections: collections
      .filter((c: any) => c.title.toLowerCase().includes(term))
      .map((c: any) => ({ title: c.title, handle: c.handle })),
  })
}
