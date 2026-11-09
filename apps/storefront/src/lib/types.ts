import type { HttpTypes } from "@medusajs/types"

export type Product = HttpTypes.StoreProduct
export type Variant = HttpTypes.StoreProductVariant
export type Cart = HttpTypes.StoreCart & {
  credit_lines?: { id: string; amount: number; reference: string | null; reference_id: string | null; metadata?: Record<string, any> | null }[]
  credit_line_total?: number
}
export type LineItem = HttpTypes.StoreCartLineItem
export type Order = HttpTypes.StoreOrder
export type Customer = HttpTypes.StoreCustomer

export type Profile = {
  username: string
  avatar_id: string
  full_name: string
  username_quota: { remaining: number; limit: number; window_days: number; next_available_at: string | null }
}

export type InboxMessage = {
  id: string
  type: string
  category: string
  title: string
  body: string
  url: string | null
  image_url: string | null
  read_at: string | null
  created_at: string
}

export type GiftCardSummary = {
  id: string
  code: string
  balance: number
  initial_amount: number
  currency_code: string
  status: string
  expires_at: string | null
  recipient_name: string | null
  recipient_email: string | null
  sender_name: string | null
  deliver_at: string | null
  delivered_at: string | null
  created_at: string
}
