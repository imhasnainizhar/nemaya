import fs from "fs"
import path from "path"
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createUserAccountWorkflow } from "@medusajs/medusa/core-flows"
import seed from "./seed"

/**
 * Idempotent first-run setup (safe to run on every deploy):
 *  1. seeds demo data if the database is empty (SEED_DEMO_DATA !== "false")
 *  2. creates the admin user from ADMIN_EMAIL / ADMIN_PASSWORD if missing
 *  3. writes the storefront publishable key to PUBLISHABLE_KEY_FILE (local docker convenience)
 */
export default async function bootstrap(args: ExecArgs) {
  const { container } = args
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  if (process.env.SEED_DEMO_DATA !== "false") await seed(args)

  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (email && password) {
    const users = container.resolve(Modules.USER)
    const [existing] = await users.listUsers({ email })
    if (!existing) {
      const auth = container.resolve(Modules.AUTH)
      const { authIdentity, success, error } = await auth.register("emailpass", { body: { email, password } } as any)
      if (!success || !authIdentity) {
        logger.error(`[bootstrap] admin user not created: ${error}`)
      } else {
        await createUserAccountWorkflow(container).run({
          input: { authIdentityId: authIdentity.id, userData: { email, first_name: "Nemaya", last_name: "Admin" } },
        })
        logger.info(`[bootstrap] admin user ${email} created`)
      }
    }
  }

  // the storefront key = the one linked to the store's default sales channel
  const { data: stores } = await query.graph({ entity: "store", fields: ["default_sales_channel_id"] })
  const channelId = (stores[0] as any)?.default_sales_channel_id
  const { data: keys } = await query.graph({
    entity: "api_key",
    fields: ["token", "title", "revoked_at", "sales_channels.id"],
    filters: { type: "publishable" },
  })
  const active = (keys as any[]).filter((k) => !k.revoked_at)
  const key = (active.find((k) => (k.sales_channels ?? []).some((s: any) => s.id === channelId)) ?? active[0])?.token
  if (key) {
    logger.info(`[bootstrap] Publishable key: ${key}`)
    const file = process.env.PUBLISHABLE_KEY_FILE
    if (file) {
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, key)
      logger.info(`[bootstrap] wrote publishable key to ${file}`)
    }
  }
}
