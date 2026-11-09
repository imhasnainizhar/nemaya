import "server-only"
import { cookies, headers } from "next/headers"

export const BACKEND_URL = (process.env.MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
export const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export const AUTH_COOKIE = "_nemaya_jwt"
export const CART_COOKIE = "_nemaya_cart"

export class MedusaRequestError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

type Opts = {
  method?: "GET" | "POST" | "DELETE"
  body?: unknown
  query?: Record<string, string | number | boolean | string[] | undefined | null>
  /** attach the customer's JWT from the cookie (default true) */
  auth?: boolean
  token?: string
  /** seconds to cache (catalog). Omit for no-store. */
  revalidate?: number
  tags?: string[]
}

function toQuery(q?: Opts["query"]) {
  if (!q) return ""
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null || v === "") continue
    if (Array.isArray(v)) v.forEach((x) => p.append(`${k}[]`, String(x)))
    else p.set(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ""
}

export async function getToken() {
  try {
    return (await cookies()).get(AUTH_COOKIE)?.value
  } catch {
    return undefined
  }
}

/** Server-side fetch to the Medusa API (publishable key, auth, client UA/IP forwarding). */
export async function medusa<T = any>(path: string, opts: Opts = {}): Promise<T> {
  if (process.env.NEMAYA_MOCK === "1") {
    const { mockMedusa } = await import("./mock/api")
    try {
      return await mockMedusa<T>(path, opts)
    } catch (e: any) {
      throw new MedusaRequestError(e.message, e.status ?? 500)
    }
  }
  const h: Record<string, string> = {
    "x-publishable-api-key": PUBLISHABLE_KEY,
    accept: "application/json",
  }
  if (opts.body !== undefined) h["content-type"] = "application/json"

  const token = opts.token ?? (opts.auth === false ? undefined : await getToken())
  if (token) h.authorization = `Bearer ${token}`

  // forward shopper's device info for "new sign-in" security alerts
  try {
    const incoming = await headers()
    const ua = incoming.get("user-agent")
    const ip = incoming.get("x-forwarded-for") || incoming.get("x-real-ip")
    if (ua) h["x-nemaya-client-ua"] = ua
    if (ip) h["x-nemaya-client-ip"] = ip.split(",")[0].trim()
  } catch {
    /* not in a request scope (build time) */
  }

  const cacheable = opts.revalidate !== undefined && !token && (opts.method ?? "GET") === "GET"
  const res = await fetch(`${BACKEND_URL}${path}${toQuery(opts.query)}`, {
    method: opts.method ?? "GET",
    headers: h,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    ...(cacheable ? { next: { revalidate: opts.revalidate, tags: opts.tags } } : { cache: "no-store" as const }),
  })

  const text = await res.text()
  const json = text ? JSON.parse(text) : {}
  if (!res.ok) throw new MedusaRequestError(json?.message || `Request failed (${res.status})`, res.status)
  return json as T
}

/** Like medusa() but returns null instead of throwing (for optional data). */
export async function medusaSafe<T = any>(path: string, opts: Opts = {}): Promise<T | null> {
  try {
    return await medusa<T>(path, opts)
  } catch {
    return null
  }
}

export const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
}
