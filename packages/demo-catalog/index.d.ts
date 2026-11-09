export type Garment =
  | "hoodie" | "zip_hoodie" | "tee" | "sweatshirt" | "shirt" | "pants" | "cargo" | "puffer" | "jacket" | "beanie" | "tote" | "giftcard"

export interface DemoProduct {
  title: string
  handle: string
  garment: Garment
  category: string
  collection?: string
  price: number
  sale?: number
  colors: string[]
  sizes?: string[]
  description: string
  material: string
}

export declare const COLORS: Record<string, { hex: string; shade: string; label: string }>
export declare const SIZES: string[]
export declare const PRODUCTS: DemoProduct[]
export declare const CATEGORIES: { name: string; handle: string; blurb: string }[]
export declare const COLLECTIONS: { title: string; handle: string; description: string }[]
export declare function garmentSvg(garment: Garment, colorKey: string, variant?: number): string
