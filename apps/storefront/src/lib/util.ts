import clsx, { type ClassValue } from "clsx"

export const cn = (...c: ClassValue[]) => clsx(c)

export function formatMoney(amount: number | string | null | undefined, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: Number(amount) % 1 === 0 ? 0 : 2,
  }).format(Number(amount ?? 0))
}

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  const units: [number, string][] = [
    [31536000, "y"],
    [2592000, "mo"],
    [604800, "w"],
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
  ]
  for (const [sec, label] of units) if (s >= sec) return `${Math.floor(s / sec)}${label} ago`
  return "just now"
}

/** Color swatches stored on product.metadata.colors by the seed ({ Label: "#hex" }). */
export function colorHex(product: { metadata?: Record<string, unknown> | null }, label: string) {
  const map = (product.metadata?.colors ?? {}) as Record<string, string>
  return map[label] ?? "#d9cbb4"
}
