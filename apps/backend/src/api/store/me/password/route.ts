import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { customerIdOf, bad } from "../../../utils"

/**
 * POST /store/me/password { current_password, new_password }
 * Change password while signed in (verifies the current one first).
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = customerIdOf(req)
  const { current_password, new_password } = (req.body ?? {}) as Record<string, string>
  if (!current_password || !new_password) throw bad("Enter your current and new password.")
  if (String(new_password).length < 8) throw bad("Use at least 8 characters.")

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "customer", fields: ["email"], filters: { id: customerId } })
  const email = (data[0] as any)?.email
  if (!email) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Customer not found.")

  const auth = req.scope.resolve(Modules.AUTH)
  const check = await auth.authenticate("emailpass", { body: { email, password: current_password } } as any)
  if (!check.success) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Your current password is incorrect.")

  const update = await auth.updateProvider("emailpass", { entity_id: email, password: new_password } as any)
  if (!update.success) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, update.error ?? "Could not update password.")

  const eventBus = req.scope.resolve(Modules.EVENT_BUS)
  await eventBus.emit({ name: "nemaya.password_changed", data: { customer_id: customerId, email, time: new Date().toISOString() } })
  res.json({ success: true })
}
