import { createHash } from "crypto"

/** Human-friendly device label from a user agent, e.g. "Chrome on Windows". */
export function deviceLabel(ua = "") {
  const browser =
    /Edg\//.test(ua) ? "Edge" :
    /OPR\//.test(ua) ? "Opera" :
    /Firefox\//.test(ua) ? "Firefox" :
    /Chrome\//.test(ua) ? "Chrome" :
    /Safari\//.test(ua) ? "Safari" :
    /Dart|Flutter/i.test(ua) ? "Nemaya app" : "a browser"
  const os =
    /Windows/.test(ua) ? "Windows" :
    /iPhone|iPad|iOS/.test(ua) ? "iOS" :
    /Android/.test(ua) ? "Android" :
    /Mac OS X|Macintosh/.test(ua) ? "macOS" :
    /Linux/.test(ua) ? "Linux" : "an unknown OS"
  return `${browser} on ${os}`
}

/**
 * Coarse fingerprint (browser family + OS) — stable across browser updates,
 * so customers aren't spammed after every version bump.
 */
export function deviceFingerprint(ua = "") {
  return createHash("sha256").update(deviceLabel(ua)).digest("hex").slice(0, 32)
}

export function clientInfo(headers: Record<string, string | string[] | undefined>, fallbackIp?: string) {
  const h = (k: string) => {
    const v = headers[k]
    return Array.isArray(v) ? v[0] : v
  }
  // The storefront calls the API server-side, so it forwards the shopper's UA/IP in these headers.
  const ua = h("x-nemaya-client-ua") || h("user-agent") || ""
  const ip = (h("x-nemaya-client-ip") || h("x-forwarded-for") || fallbackIp || "").split(",")[0].trim()
  return { ua, ip, label: deviceLabel(ua), fingerprint: deviceFingerprint(ua) }
}
