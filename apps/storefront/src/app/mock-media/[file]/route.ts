import { garmentSvg, PRODUCTS, type Garment } from "@nemaya/demo-catalog"

/** Serves demo garment art in mock mode: /mock-media/<handle>--<color>--<variant>.svg */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  if (process.env.NEMAYA_MOCK !== "1") return new Response("Not found", { status: 404 })
  const [handle, color, v] = (await params).file.replace(/\.svg$/, "").split("--")
  const product = PRODUCTS.find((p) => p.handle === handle)
  const svg = garmentSvg((product?.garment ?? "tee") as Garment, color, Number(v) || 0)
  return new Response(svg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=3600" } })
}
