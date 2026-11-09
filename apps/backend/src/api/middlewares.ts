import {
  authenticate,
  defineMiddlewares,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"
import { PROFILE_MODULE } from "../modules/profile"
import type ProfileModuleService from "../modules/profile/service"
import { MESSAGING_MODULE } from "../modules/messaging"
import type MessagingModuleService from "../modules/messaging/service"
import { clientInfo } from "../lib/device"

/** Run `fn` with the JSON body once the route handler responds successfully. */
function afterSuccess(res: MedusaResponse, fn: (body: any) => Promise<void>) {
  const originalJson = res.json.bind(res)
  ;(res as any).json = (body: any) => {
    const out = originalJson(body)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      setImmediate(() => fn(body).catch(() => undefined))
    }
    return out
  }
}

/**
 * Customer login:
 *  1. lets customers sign in with their username OR email
 *  2. detects sign-ins from new devices → "new_login" security alert
 */
async function customerLogin(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const body = (req.body ?? {}) as Record<string, any>
  const identifier = String(body.email ?? body.username ?? "").trim()

  if (identifier && !identifier.includes("@")) {
    const profiles = req.scope.resolve<ProfileModuleService>(PROFILE_MODULE)
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const profile = await profiles.getByUsername(identifier)
    if (profile) {
      const { data } = await query.graph({ entity: "customer", fields: ["email"], filters: { id: profile.customer_id } })
      if (data[0]?.email) body.email = data[0].email
    }
  }

  const info = clientInfo(req.headers as any, req.ip)
  const container = req.scope

  afterSuccess(res, async (resBody) => {
    const token = resBody?.token
    if (typeof token !== "string") return
    const decoded = jwt.decode(token) as any
    const customerId = decoded?.actor_id
    if (!customerId) return // auth identity without a customer yet (mid-registration)

    const messaging = container.resolve<MessagingModuleService>(MESSAGING_MODULE)
    const status = await messaging.recordDevice(customerId, info.fingerprint, info.label, info.ip)
    if (status === "new") {
      const eventBus = container.resolve(Modules.EVENT_BUS)
      await eventBus.emit({
        name: "nemaya.new_device_login",
        data: { customer_id: customerId, email: body.email, device: info.label, ip: info.ip || "unknown", time: new Date().toISOString() },
      })
    }
  })
  next()
}

/** Emits nemaya.password_changed after a successful customer password update/reset. */
async function customerPasswordUpdated(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const header = String(req.headers.authorization ?? "")
  const token = header.startsWith("Bearer ") ? header.slice(7) : String((req.query as any)?.token ?? "")
  const decoded = token ? (jwt.decode(token) as any) : null
  const email = decoded?.entity_id || (req.body as any)?.email
  const container = req.scope

  afterSuccess(res, async () => {
    if (!email) return
    const eventBus = container.resolve(Modules.EVENT_BUS)
    await eventBus.emit({ name: "nemaya.password_changed", data: { email, time: new Date().toISOString() } })
  })
  next()
}

const customerAuth = authenticate("customer", ["session", "bearer"])

export default defineMiddlewares({
  routes: [
    { matcher: "/auth/customer/emailpass", methods: ["POST"], middlewares: [customerLogin] },
    { matcher: "/auth/customer/emailpass/update", methods: ["POST"], middlewares: [customerPasswordUpdated] },
    { matcher: "/store/me*", middlewares: [customerAuth] },
  ],
})
