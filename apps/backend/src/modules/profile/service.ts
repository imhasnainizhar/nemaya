import { MedusaError, MedusaService } from "@medusajs/framework/utils"
import { isValidAvatarId, DEFAULT_AVATAR_ID } from "@nemaya/avatars"
import Profile from "./models/profile"
import UsernameReservation from "./models/username-reservation"

export const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9._]{1,18})[a-z0-9]$/
export const USERNAME_CHANGES_PER_WINDOW = 2
export const USERNAME_WINDOW_DAYS = 30
export const USERNAME_HOLD_DAYS = 30

const RESERVED = new Set([
  "admin", "administrator", "nemaya", "support", "help", "root", "system",
  "staff", "official", "moderator", "mod", "security", "billing", "api",
  "store", "shop", "account", "me", "null", "undefined",
])

const DAY = 24 * 60 * 60 * 1000

export function normalizeUsername(raw: string) {
  return (raw || "").trim().toLowerCase().replace(/^@/, "")
}

export function validateUsernameFormat(username: string): string | null {
  if (!USERNAME_REGEX.test(username)) {
    return "Usernames are 3–20 characters: letters, numbers, dots and underscores, starting and ending with a letter or number."
  }
  if (/[._]{2}/.test(username)) return "Dots and underscores can't be next to each other."
  if (RESERVED.has(username)) return "That username is reserved."
  return null
}

class ProfileModuleService extends MedusaService({ Profile, UsernameReservation }) {
  async isUsernameAvailable(raw: string, forCustomerId?: string) {
    const username = normalizeUsername(raw)
    const formatError = validateUsernameFormat(username)
    if (formatError) return { available: false, reason: formatError, username }

    const [taken] = await this.listProfiles({ username }, { take: 1 })
    if (taken && taken.customer_id !== forCustomerId) {
      return { available: false, reason: "That username is taken.", username }
    }

    const [held] = await this.listUsernameReservations({ username }, { take: 1 })
    if (held && held.customer_id !== forCustomerId && new Date(held.reserved_until).getTime() > Date.now()) {
      return { available: false, reason: "That username was recently used and is on hold.", username }
    }
    return { available: true, username }
  }

  async getByCustomerId(customerId: string) {
    const [profile] = await this.listProfiles({ customer_id: customerId }, { take: 1 })
    return profile ?? null
  }

  async getByUsername(raw: string) {
    const [profile] = await this.listProfiles({ username: normalizeUsername(raw) }, { take: 1 })
    return profile ?? null
  }

  /** Username-change quota for the rolling window. */
  usernameQuota(profile: { username_changes?: unknown }) {
    const changes = (Array.isArray(profile.username_changes) ? profile.username_changes : []) as string[]
    const since = Date.now() - USERNAME_WINDOW_DAYS * DAY
    const recent = changes.filter((c) => new Date(c).getTime() > since).sort()
    const remaining = Math.max(0, USERNAME_CHANGES_PER_WINDOW - recent.length)
    const next_available_at =
      remaining === 0 && recent.length ? new Date(new Date(recent[0]).getTime() + USERNAME_WINDOW_DAYS * DAY).toISOString() : null
    return { remaining, limit: USERNAME_CHANGES_PER_WINDOW, window_days: USERNAME_WINDOW_DAYS, next_available_at, recent }
  }

  async createForCustomer(input: { customer_id: string; username: string; avatar_id?: string; email?: string }) {
    const existing = await this.getByCustomerId(input.customer_id)
    if (existing) {
      throw new MedusaError(MedusaError.Types.DUPLICATE_ERROR, "Profile already exists for this customer.")
    }
    const check = await this.isUsernameAvailable(input.username, input.customer_id)
    if (!check.available) throw new MedusaError(MedusaError.Types.INVALID_DATA, check.reason!)
    const avatar_id = isValidAvatarId(input.avatar_id) ? input.avatar_id : DEFAULT_AVATAR_ID

    return await this.createProfiles({
      customer_id: input.customer_id,
      username: check.username,
      avatar_id,
      username_changes: [] as any,
      email_snapshot: input.email ?? null,
    })
  }

  async changeUsername(customerId: string, raw: string) {
    const profile = await this.getByCustomerId(customerId)
    if (!profile) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Profile not found.")
    const username = normalizeUsername(raw)
    if (username === profile.username) return profile

    const quota = this.usernameQuota(profile)
    if (quota.remaining <= 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `You can change your username ${quota.limit} times every ${quota.window_days} days. Next change available ${quota.next_available_at}.`
      )
    }
    const check = await this.isUsernameAvailable(username, customerId)
    if (!check.available) throw new MedusaError(MedusaError.Types.INVALID_DATA, check.reason!)

    // hold the old username
    const [oldHold] = await this.listUsernameReservations({ username: profile.username }, { take: 1 })
    const reserved_until = new Date(Date.now() + USERNAME_HOLD_DAYS * DAY)
    if (oldHold) {
      await this.updateUsernameReservations({ id: oldHold.id, customer_id: customerId, reserved_until })
    } else {
      await this.createUsernameReservations({ username: profile.username, customer_id: customerId, reserved_until })
    }
    // release a hold on the new name if it was this customer's own
    const [ownHold] = await this.listUsernameReservations({ username, customer_id: customerId }, { take: 1 })
    if (ownHold) await this.deleteUsernameReservations(ownHold.id)

    return await this.updateProfiles({
      id: profile.id,
      username,
      username_changes: [...quota.recent, new Date().toISOString()] as any,
    })
  }

  async setAvatar(customerId: string, avatarId: string) {
    if (!isValidAvatarId(avatarId)) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Unknown avatar.")
    const profile = await this.getByCustomerId(customerId)
    if (!profile) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Profile not found.")
    return await this.updateProfiles({ id: profile.id, avatar_id: avatarId })
  }
}

export default ProfileModuleService
