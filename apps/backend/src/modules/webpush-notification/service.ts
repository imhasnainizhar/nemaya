import webpush from "web-push"
import { AbstractNotificationProviderService, MedusaError } from "@medusajs/framework/utils"
import type { Logger, ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from "@medusajs/framework/types"

type Options = {
  vapid_public_key?: string
  vapid_private_key?: string
  vapid_subject: string
}

/**
 * Browser Web Push channel using the open VAPID standard — no Firebase needed.
 * `to` is the subscription endpoint; keys are passed in provider_data.
 * Later, an APNs/FCM provider for the mobile app can sit next to this one.
 */
class WebPushNotificationService extends AbstractNotificationProviderService {
  static identifier = "webpush"
  protected enabled: boolean
  protected logger: Logger

  constructor({ logger }: { logger: Logger }, options: Options) {
    super()
    this.logger = logger
    this.enabled = !!(options.vapid_public_key && options.vapid_private_key)
    if (this.enabled) {
      webpush.setVapidDetails(options.vapid_subject, options.vapid_public_key!, options.vapid_private_key!)
    } else {
      logger.warn("[webpush] VAPID keys not configured — web push is disabled. Run `pnpm vapid` to generate keys.")
    }
  }

  async send(notification: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO> {
    if (!this.enabled) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Web push is not configured.")
    const keys = (notification.provider_data ?? {}) as { p256dh?: string; auth?: string }
    if (!keys.p256dh || !keys.auth) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing push subscription keys.")

    const payload = JSON.stringify({
      title: notification.content?.subject ?? "Nemaya",
      body: notification.content?.text ?? "",
      url: (notification.data as any)?.url ?? "/",
      image: (notification.data as any)?.image_url ?? undefined,
      tag: notification.template,
    })

    try {
      const res = await webpush.sendNotification({ endpoint: notification.to, keys: { p256dh: keys.p256dh, auth: keys.auth } }, payload, {
        TTL: 60 * 60 * 24,
      })
      return { id: res.headers?.location ?? undefined }
    } catch (e: any) {
      // 404/410 = subscription expired; the dispatcher prunes it
      const err = new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `webpush ${e?.statusCode ?? ""} ${e?.body ?? e?.message}`)
      ;(err as any).statusCode = e?.statusCode
      throw err
    }
  }
}

export default WebPushNotificationService
