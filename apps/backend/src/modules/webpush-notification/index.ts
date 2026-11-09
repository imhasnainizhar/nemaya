import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import WebPushNotificationService from "./service"

export default ModuleProvider(Modules.NOTIFICATION, {
  services: [WebPushNotificationService],
})
