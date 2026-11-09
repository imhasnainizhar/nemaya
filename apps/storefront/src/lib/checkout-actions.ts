"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { CART_COOKIE, medusa } from "./medusa"
import { getCartId } from "./data"

type Result<T = {}> = ({ ok: true } & T) | { ok: false; error: string }
const err = (e: unknown) => ({ ok: false as const, error: e instanceof Error ? e.message : "Something went wrong." })

async function requireCartId() {
  const id = await getCartId()
  if (!id) throw new Error("Your cart has expired. Please add items again.")
  return id
}

export async function saveAddressAction(input: {
  email: string
  full_name: string
  phone?: string
  address_1: string
  address_2?: string
  city: string
  province?: string
  postal_code: string
  country_code: string
}): Promise<Result> {
  try {
    const id = await requireCartId()
    const [first_name, ...rest] = input.full_name.trim().split(/\s+/)
    const address = {
      first_name,
      last_name: rest.join(" ") || "-",
      phone: input.phone || undefined,
      address_1: input.address_1,
      address_2: input.address_2 || undefined,
      city: input.city,
      province: input.province || undefined,
      postal_code: input.postal_code,
      country_code: input.country_code.toLowerCase(),
    }
    await medusa(`/store/carts/${id}`, {
      method: "POST",
      body: { email: input.email.toLowerCase(), shipping_address: address, billing_address: address },
    })
    revalidatePath("/checkout")
    return { ok: true }
  } catch (e) {
    return err(e)
  }
}

export async function setShippingMethodAction(optionId: string): Promise<Result> {
  try {
    const id = await requireCartId()
    await medusa(`/store/carts/${id}/shipping-methods`, { method: "POST", body: { option_id: optionId } })
    await medusa(`/store/carts/${id}/gift-cards/refresh`, { method: "POST" }).catch(() => undefined)
    revalidatePath("/checkout")
    return { ok: true }
  } catch (e) {
    return err(e)
  }
}

/** Creates (or re-uses) the payment session and returns Stripe's client secret when relevant. */
export async function initPaymentAction(providerId: string): Promise<Result<{ clientSecret?: string | null }>> {
  try {
    const id = await requireCartId()
    await medusa(`/store/carts/${id}/gift-cards/refresh`, { method: "POST" }).catch(() => undefined)
    const { cart } = await medusa<{ cart: any }>(`/store/carts/${id}`, {
      query: { fields: "id,total,*payment_collection,*payment_collection.payment_sessions" },
    })
    let collectionId = cart.payment_collection?.id
    if (!collectionId) {
      const res = await medusa<{ payment_collection: { id: string } }>("/store/payment-collections", { method: "POST", body: { cart_id: id } })
      collectionId = res.payment_collection.id
    }
    const res = await medusa<{ payment_collection: any }>(`/store/payment-collections/${collectionId}/payment-sessions`, {
      method: "POST",
      body: { provider_id: providerId },
    })
    const session = (res.payment_collection.payment_sessions ?? []).find((s: any) => s.provider_id === providerId)
    return { ok: true, clientSecret: session?.data?.client_secret ?? null }
  } catch (e) {
    return err(e)
  }
}

export async function completeOrderAction(): Promise<Result<{ orderId: string }>> {
  try {
    const id = await requireCartId()
    const res = await medusa<any>(`/store/carts/${id}/complete`, { method: "POST" })
    if (res.type !== "order" || !res.order) {
      return { ok: false, error: res.error?.message ?? "We couldn't place your order. Please check your payment details." }
    }
    ;(await cookies()).delete(CART_COOKIE)
    revalidatePath("/", "layout")
    return { ok: true, orderId: res.order.id }
  } catch (e) {
    return err(e)
  }
}
