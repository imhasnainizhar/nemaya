import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import { assertCartGiftCardsValid } from "../../lib/gift-cards"

/**
 * Before an order is created, re-check every applied gift card:
 * still active, not expired, and with enough balance (prevents double-spend
 * when the same card is applied to two carts at once).
 */
completeCartWorkflow.hooks.validate(async ({ input, cart }, { container }) => {
  const cartId = (cart as any)?.id ?? (input as any)?.id
  if (cartId) await assertCartGiftCardsValid(container, cartId)
})
