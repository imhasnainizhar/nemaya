import type { Metadata, Viewport } from "next"
import { Fraunces, Inter } from "next/font/google"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { UIProvider } from "@/components/ui/ui-provider"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { SearchOverlay } from "@/components/search/search-overlay"
import { NewsletterPopover } from "@/components/newsletter-popover"
import { MenuDrawer } from "@/components/nav/menu-drawer"
import { MobileDock } from "@/components/nav/mobile-dock"
import { PageLoader, pageLoaderSkipScript } from "@/components/page-loader"
import { uiConfig } from "../../nemaya.config"
import { getCart, getCustomer } from "@/lib/data"
import { getNavData } from "@/lib/nav"
import "./globals.css"

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["SOFT", "opsz"], display: "swap" })
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"),
  title: { default: "Nemaya — Rooted in comfort", template: "%s · Nemaya" },
  description: "Heavyweight basics and outerwear in earth tones. A portfolio commerce project built on Medusa and Next.js.",
}

export const viewport: Viewport = { themeColor: "#f4efe6" }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [nav, cart, customer] = await Promise.all([getNavData(), getCart(), getCustomer()])
  const cartCount = (cart?.items ?? []).reduce((n, i) => n + Number(i.quantity), 0)
  // leave room for the floating dock on phones
  const bodyClass = uiConfig.separate_mobile_nav_dock ? "pb-24 lg:pb-0" : undefined

  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        {uiConfig.page_loader && uiConfig.page_loader_once_per_session && <script dangerouslySetInnerHTML={{ __html: pageLoaderSkipScript }} />}
      </head>
      <body className={bodyClass}>
        {uiConfig.page_loader && <PageLoader oncePerSession={uiConfig.page_loader_once_per_session} />}
        <UIProvider initialCartCount={cartCount}>
          <Header nav={nav} />
          <main>{children}</main>
          <Footer />
          <MenuDrawer nav={nav} signedIn={!!customer} />
          <CartDrawer />
          <SearchOverlay nav={nav} />
          <NewsletterPopover signedIn={!!customer} raised={uiConfig.separate_mobile_nav_dock} />
          {uiConfig.separate_mobile_nav_dock && <MobileDock signedIn={!!customer} cartSeparate={uiConfig.dock_cart_separate} />}
        </UIProvider>
      </body>
    </html>
  )
}
