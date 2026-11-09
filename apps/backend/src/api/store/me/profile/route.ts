import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateCustomersWorkflow } from "@medusajs/medusa/core-flows"
import { PROFILE_MODULE } from "../../../../modules/profile"
import type ProfileModuleService from "../../../../modules/profile/service"
import { bad, customerIdOf, splitFullName, str } from "../../../utils"

async function load(req: AuthenticatedMedusaRequest, customerId: string) {
  const profiles = req.scope.resolve<ProfileModuleService>(PROFILE_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const [profile, { data }] = await Promise.all([
    profiles.getByCustomerId(customerId),
    query.graph({ entity: "customer", fields: ["id", "email", "first_name", "last_name", "phone", "created_at"], filters: { id: customerId } }),
  ])
  const customer = data[0] as any
  return {
    customer,
    profile: profile
      ? {
          username: profile.username,
          avatar_id: profile.avatar_id,
          full_name: [customer?.first_name, customer?.last_name].filter(Boolean).join(" "),
          username_quota: profiles.usernameQuota(profile),
        }
      : null,
  }
}

/** GET /store/me/profile */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  res.json(await load(req, customerIdOf(req)))
}

/**
 * POST /store/me/profile  { username?, avatar_id?, full_name? }
 * Creates the profile on first call (sign-up), updates it afterwards.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = customerIdOf(req)
  const profiles = req.scope.resolve<ProfileModuleService>(PROFILE_MODULE)
  const body = (req.body ?? {}) as Record<string, unknown>
  const username = str(body.username, 40)
  const avatarId = str(body.avatar_id, 20)
  const fullName = str(body.full_name, 120)

  if (fullName !== undefined) {
    if (fullName.length < 2) throw bad("Please enter your full name.")
    await updateCustomersWorkflow(req.scope).run({
      input: { selector: { id: customerId }, update: splitFullName(fullName) },
    })
  }

  const existing = await profiles.getByCustomerId(customerId)
  if (!existing) {
    if (!username) throw bad("Choose a username.")
    const { customer } = await load(req, customerId)
    await profiles.createForCustomer({ customer_id: customerId, username, avatar_id: avatarId, email: customer?.email })
  } else {
    if (username !== undefined) await profiles.changeUsername(customerId, username)
    if (avatarId !== undefined) await profiles.setAvatar(customerId, avatarId)
  }

  res.json(await load(req, customerId))
}
