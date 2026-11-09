import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { GIFT_CARD_MODULE } from "../modules/gift-card"
import type GiftCardModuleService from "../modules/gift-card/service"
import { deliverGiftCard } from "../lib/gift-cards"

/** Delivers gift cards whose scheduled delivery date has arrived. */
export default async function deliverScheduledGiftCards(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const giftCards = container.resolve<GiftCardModuleService>(GIFT_CARD_MODULE)
  const due = await giftCards.listGiftCards(
    { delivered_at: null, deliver_at: { $lte: new Date() }, status: "active" } as any,
    { take: 100 }
  )
  for (const card of due as any[]) {
    try {
      await deliverGiftCard(container, card.id)
    } catch (e: any) {
      logger.error(`[gift-card] delivery of ${card.id} failed: ${e.message}`)
    }
  }
}

export const config = { name: "nemaya-deliver-gift-cards", schedule: "*/5 * * * *" }
