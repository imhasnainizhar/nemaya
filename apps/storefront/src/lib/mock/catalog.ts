import "server-only"
import { CATEGORIES, COLLECTIONS, COLORS, PRODUCTS, SIZES } from "@nemaya/demo-catalog"

/**
 * In-memory stand-in for the Medusa store API (NEMAYA_MOCK=1).
 * Built from the same demo catalog as the backend seed so UI work can happen
 * without Docker/Postgres/Redis. Never used when NEMAYA_MOCK is unset.
 */

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-")
const img = (handle: string, color: string, v = 0) => `/mock-media/${handle}--${color}--${v}.svg`

export const REGION = {
  id: "reg_mock",
  name: "Worldwide",
  currency_code: "usd",
  countries: [
    ["us", "United States"],
    ["gb", "United Kingdom"],
    ["ca", "Canada"],
    ["pk", "Pakistan"],
    ["de", "Germany"],
  ].map(([iso_2, display_name]) => ({ iso_2, display_name })),
}

export const MOCK_CATEGORIES = CATEGORIES.map((c, i) => ({ id: `pcat_${c.handle}`, name: c.name, handle: c.handle, description: c.blurb, rank: i }))
export const MOCK_COLLECTIONS = COLLECTIONS.map((c) => ({ id: `pcol_${c.handle}`, title: c.title, handle: c.handle, metadata: { description: c.description } }))

let variantIndex = 0
export const MOCK_PRODUCTS = PRODUCTS.map((p, pi) => {
  const sizes = p.sizes ?? SIZES
  const colorOpt = { id: `opt_${p.handle}_color`, title: "Color", values: p.colors.map((c) => ({ id: `optval_${p.handle}_${c}`, value: COLORS[c].label })) }
  const sizeOpt = { id: `opt_${p.handle}_size`, title: "Size", values: sizes.map((s) => ({ id: `optval_${p.handle}_${slug(s)}`, value: s })) }
  const images = [...p.colors.map((c) => ({ id: `img_${p.handle}_${c}`, url: img(p.handle, c) })), { id: `img_${p.handle}_detail`, url: img(p.handle, p.colors[0], 1) }]
  const category = MOCK_CATEGORIES.find((c) => c.name === p.category)!
  const collection = MOCK_COLLECTIONS.find((c) => c.title === p.collection) ?? null

  const variants = p.colors.flatMap((color) =>
    sizes.map((size) => {
      const i = variantIndex++
      return {
        id: `variant_${p.handle}_${color}_${slug(size)}`,
        title: `${COLORS[color].label} / ${size}`,
        sku: `${p.handle}-${color}-${size}`.toUpperCase(),
        manage_inventory: true,
        allow_backorder: false,
        // same "a few sold out" pattern as the seed
        inventory_quantity: i % 17 === 5 ? 0 : 40 + (i % 7) * 10,
        options: [
          { id: `vo_${i}_c`, value: COLORS[color].label, option_id: colorOpt.id, option: { title: "Color" } },
          { id: `vo_${i}_s`, value: size, option_id: sizeOpt.id, option: { title: "Size" } },
        ],
        calculated_price: {
          calculated_amount: p.sale ?? p.price,
          original_amount: p.price,
          currency_code: "usd",
        },
        metadata: { image: img(p.handle, color) },
      }
    })
  )

  return {
    id: `prod_${p.handle}`,
    title: p.title,
    handle: p.handle,
    subtitle: p.material,
    material: p.material,
    description: p.description,
    thumbnail: images[0].url,
    images,
    options: [colorOpt, sizeOpt],
    variants,
    categories: [category],
    collection,
    metadata: { colors: Object.fromEntries(p.colors.map((c) => [COLORS[c].label, COLORS[c].hex])) },
    created_at: new Date(Date.UTC(2026, 9, 1 + pi)).toISOString(),
  }
})

export type MockProduct = (typeof MOCK_PRODUCTS)[number]
