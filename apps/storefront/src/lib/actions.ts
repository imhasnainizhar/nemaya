"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { AUTH_COOKIE, CART_COOKIE, cookieOpts, medusa, MedusaRequestError } from "./medusa"
import { getCart, getCartId, getRegion } from "./data"

export type ActionState = { error?: string; ok?: boolean; message?: string } | undefined

const fail = (e: unknown): ActionState => ({ error: e instanceof Error ? e.message : "Something went wrong." })
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim()

// ───────────────────────────────────────────────────────────────── auth
async function storeToken(token: string) {
  ;(await cookies()).set(AUTH_COOKIE, token, cookieOpts)
}

async function attachCartToCustomer() {
  const cartId = await getCartId()
  if (!cartId) return
  await medusa(`/store/carts/${cartId}/customer`, { method: "POST" }).catch(() => undefined)
}

async function loginRaw(identifier: string, password: string) {
  const res = await medusa<{ token?: string }>("/auth/customer/emailpass", {
    method: "POST",
    auth: false,
    body: { email: identifier, password },
  })
  if (!res.token) throw new Error("Sign-in needs an extra step that isn't supported yet.")
  await storeToken(res.token)
  return res.token
}

export async function loginAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const identifier = str(fd, "identifier")
  const password = String(fd.get("password") ?? "")
  const next = str(fd, "next") || "/account"
  if (!identifier || !password) return { error: "Enter your email or username and password." }
  try {
    await loginRaw(identifier, password)
    await attachCartToCustomer()
  } catch (e) {
    if (e instanceof MedusaRequestError && e.status === 401) return { error: "Those details don't match an account." }
    return fail(e)
  }
  redirect(next.startsWith("/") ? next : "/account")
}

export async function checkUsername(username: string) {
  try {
    return await medusa<{ available: boolean; reason?: string; username: string }>("/store/nemaya/username-check", {
      auth: false,
      query: { username },
    })
  } catch {
    return { available: false, reason: "Couldn't check right now.", username }
  }
}

export async function registerAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const fullName = str(fd, "full_name")
  const username = str(fd, "username").toLowerCase()
  const email = str(fd, "email").toLowerCase()
  const password = String(fd.get("password") ?? "")
  const avatarId = str(fd, "avatar_id") || "av-01"

  if (fullName.length < 2) return { error: "Please enter your full name." }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." }
  if (password.length < 8) return { error: "Use at least 8 characters for your password." }
  const check = await checkUsername(username)
  if (!check.available) return { error: check.reason ?? "That username isn't available." }

  try {
    // 1) auth identity → registration token
    const reg = await medusa<{ token: string }>("/auth/customer/emailpass/register", {
      method: "POST",
      auth: false,
      body: { email, password },
    })
    // 2) customer record
    const [first_name, ...rest] = fullName.split(/\s+/)
    await medusa("/store/customers", {
      method: "POST",
      token: reg.token,
      body: { email, first_name, last_name: rest.join(" ") },
    })
    // 3) real session token, 4) profile (username + avatar)
    const token = await loginRaw(email, password)
    await medusa("/store/me/profile", { method: "POST", token, body: { username, avatar_id: avatarId } })
    await attachCartToCustomer()
  } catch (e) {
    if (e instanceof MedusaRequestError && /exist/i.test(e.message)) {
      return { error: "An account with this email already exists. Try signing in." }
    }
    return fail(e)
  }
  redirect("/account?welcome=1")
}

export async function logoutAction() {
  const jar = await cookies()
  jar.delete(AUTH_COOKIE)
  jar.delete(CART_COOKIE)
  redirect("/")
}

export async function forgotPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const email = str(fd, "email").toLowerCase()
  if (!email.includes("@")) return { error: "Enter the email on your account." }
  await medusa("/auth/customer/emailpass/reset-password", { method: "POST", auth: false, body: { identifier: email } }).catch(() => undefined)
  // same response either way — don't reveal whether an account exists
  return { ok: true, message: "If an account exists for that email, a reset link is on its way." }
}

export async function resetPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const token = str(fd, "token")
  const email = str(fd, "email")
  const password = String(fd.get("password") ?? "")
  if (password.length < 8) return { error: "Use at least 8 characters." }
  try {
    await medusa("/auth/customer/emailpass/update", { method: "POST", token, body: { email, password } })
  } catch {
    return { error: "This reset link is invalid or has expired. Request a new one." }
  }
  return { ok: true, message: "Password updated. You can sign in now." }
}

export async function changePasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    await medusa("/store/me/password", {
      method: "POST",
      body: { current_password: String(fd.get("current_password") ?? ""), new_password: String(fd.get("new_password") ?? "") },
    })
    return { ok: true, message: "Password changed. We've emailed you a confirmation." }
  } catch (e) {
    return fail(e)
  }
}

// ───────────────────────────────────────────────────────────────── profile
export async function updateProfileAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const body: Record<string, string> = {}
  for (const k of ["full_name", "username", "avatar_id"]) {
    const v = str(fd, k)
    if (v) body[k] = v
  }
  try {
    await medusa("/store/me/profile", { method: "POST", body })
    revalidatePath("/", "layout")
    return { ok: true, message: "Profile saved." }
  } catch (e) {
    return fail(e)
  }
}

export async function setAvatarAction(avatarId: string) {
  await medusa("/store/me/profile", { method: "POST", body: { avatar_id: avatarId } })
  revalidatePath("/", "layout")
}

// ───────────────────────────────────────────────────────────────── cart
async function getOrCreateCartId() {
  let id = await getCartId()
  if (id) {
    const cart = await getCart()
    if (cart) return id
  }
  const region = await getRegion()
  const { cart } = await medusa<{ cart: { id: string } }>("/store/carts", { method: "POST", body: { region_id: region?.id } })
  ;(await cookies()).set(CART_COOKIE, cart.id, { ...cookieOpts, maxAge: 60 * 60 * 24 * 30 })
  return cart.id
}

export async function addToCartAction(variantId: string, quantity = 1): Promise<ActionState> {
  try {
    const cartId = await getOrCreateCartId()
    await medusa(`/store/carts/${cartId}/line-items`, { method: "POST", body: { variant_id: variantId, quantity } })
    revalidatePath("/", "layout")
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

export async function updateLineItemAction(lineId: string, quantity: number) {
  const cartId = await getCartId()
  if (!cartId) return
  if (quantity <= 0) await medusa(`/store/carts/${cartId}/line-items/${lineId}`, { method: "DELETE" })
  else await medusa(`/store/carts/${cartId}/line-items/${lineId}`, { method: "POST", body: { quantity } })
  await medusa(`/store/carts/${cartId}/gift-cards/refresh`, { method: "POST" }).catch(() => undefined)
  revalidatePath("/", "layout")
}

export async function applyPromoAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const code = str(fd, "code")
  const cartId = await getCartId()
  if (!cartId || !code) return { error: "Enter a code." }
  try {
    await medusa(`/store/carts/${cartId}/promotions`, { method: "POST", body: { promo_codes: [code] } })
    revalidatePath("/", "layout")
    return { ok: true }
  } catch (e) {
    return fail(e)
  }
}

// ───────────────────────────────────────────────────────────────── gift cards
export async function applyGiftCardAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const code = str(fd, "code")
  const cartId = await getCartId()
  if (!cartId) return { error: "Your cart is empty." }
  try {
    await medusa(`/store/carts/${cartId}/gift-cards`, { method: "POST", body: { code } })
    revalidatePath("/", "layout")
    return { ok: true, message: "Gift card applied." }
  } catch (e) {
    return fail(e)
  }
}

export async function removeGiftCardAction(lineId: string) {
  const cartId = await getCartId()
  if (!cartId) return
  await medusa(`/store/carts/${cartId}/gift-cards/${lineId}`, { method: "DELETE" })
  revalidatePath("/", "layout")
}

export async function buyGiftCardAction(_: ActionState, fd: FormData): Promise<ActionState> {
  try {
    const cartId = await getOrCreateCartId()
    await medusa(`/store/carts/${cartId}/gift-card-items`, {
      method: "POST",
      body: {
        amount: Number(fd.get("amount")),
        recipient_name: str(fd, "recipient_name"),
        recipient_email: str(fd, "recipient_email"),
        sender_name: str(fd, "sender_name"),
        message: str(fd, "message"),
        deliver_at: str(fd, "deliver_at") || null,
      },
    })
    revalidatePath("/", "layout")
  } catch (e) {
    return fail(e)
  }
  redirect("/cart")
}

export async function checkGiftCardBalanceAction(_: ActionState, fd: FormData) {
  try {
    const res = await medusa<any>("/store/nemaya/gift-cards/balance", { method: "POST", auth: false, body: { code: str(fd, "code") } })
    return { ok: true, card: res } as ActionState & { card: any }
  } catch (e) {
    return fail(e)
  }
}

// ───────────────────────────────────────────────────────────────── wishlist
export async function toggleWishlistAction(productId: string, inWishlist: boolean): Promise<ActionState> {
  try {
    if (inWishlist) await medusa(`/store/me/wishlist/${productId}`, { method: "DELETE" })
    else await medusa("/store/me/wishlist", { method: "POST", body: { product_id: productId } })
    revalidatePath("/account/wishlist")
    return { ok: true }
  } catch (e) {
    if (e instanceof MedusaRequestError && e.status === 401) return { error: "login" }
    return fail(e)
  }
}

// ───────────────────────────────────────────────────────────────── notifications
export async function markNotificationsReadAction(ids?: string[]) {
  await medusa("/store/me/notifications/read", { method: "POST", body: ids ? { ids } : { all: true } }).catch(() => undefined)
  revalidatePath("/account/notifications")
}

export async function savePreferencesAction(prefs: { marketing_email?: boolean; marketing_push?: boolean; muted_types?: string[] }) {
  await medusa("/store/me/notification-preferences", { method: "POST", body: prefs })
  revalidatePath("/account/notifications")
}

export async function savePushSubscriptionAction(subscription: PushSubscriptionJSON) {
  await medusa("/store/me/push-subscriptions", { method: "POST", body: { subscription } })
}

export async function removePushSubscriptionAction(endpoint?: string) {
  await medusa("/store/me/push-subscriptions", { method: "DELETE", body: endpoint ? { endpoint } : {} })
}
