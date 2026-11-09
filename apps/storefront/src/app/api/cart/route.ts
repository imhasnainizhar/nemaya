import { NextResponse } from "next/server"
import { getCart } from "@/lib/data"

export const dynamic = "force-dynamic"

/** Cart snapshot for the cart drawer. */
export async function GET() {
  const cart = await getCart()
  return NextResponse.json({ cart })
}
