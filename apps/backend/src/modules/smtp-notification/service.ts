import nodemailer, { Transporter } from "nodemailer"
import { AbstractNotificationProviderService, MedusaError } from "@medusajs/framework/utils"
import type { Logger, ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from "@medusajs/framework/types"

type Options = {
  host: string
  port: number
  secure?: boolean
  user?: string
  pass?: string
  from: string
}

/**
 * Generic SMTP email channel.
 * Local: Mailpit (http://localhost:8025). Production: any SMTP — AWS SES, Resend, Postmark…
 */
class SmtpNotificationService extends AbstractNotificationProviderService {
  static identifier = "smtp"
  protected transporter: Transporter
  protected options: Options
  protected logger: Logger

  constructor({ logger }: { logger: Logger }, options: Options) {
    super()
    this.logger = logger
    this.options = options
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: !!options.secure,
      auth: options.user ? { user: options.user, pass: options.pass } : undefined,
    })
  }

  async send(notification: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO> {
    const content = notification.content
    if (!content?.html && !content?.text) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Email notifications need rendered content.")
    }
    const info = await this.transporter.sendMail({
      from: notification.from || this.options.from,
      to: notification.to,
      subject: content.subject ?? "Nemaya",
      html: content.html ?? undefined,
      text: content.text ?? undefined,
    })
    return { id: info.messageId }
  }
}

export default SmtpNotificationService
