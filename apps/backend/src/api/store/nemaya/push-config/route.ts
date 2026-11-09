import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/** GET /store/nemaya/push-config — the public VAPID key browsers need to subscribe. */
export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  const key = process.env.VAPID_PUBLIC_KEY || null
  res.json({ enabled: !!key && !!process.env.VAPID_PRIVATE_KEY, vapid_public_key: key })
}
