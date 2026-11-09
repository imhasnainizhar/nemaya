import type { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

export const customerIdOf = (req: AuthenticatedMedusaRequest) => {
  const id = req.auth_context?.actor_id
  if (!id) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Please sign in.")
  return id
}

export const bad = (message: string) => new MedusaError(MedusaError.Types.INVALID_DATA, message)

export const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : undefined)

/** Splits a single "Full name" field into Medusa's first/last name. */
export function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/)
  const first_name = parts.shift() ?? ""
  return { first_name, last_name: parts.join(" ") }
}

export const isEmail = (v: unknown) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
