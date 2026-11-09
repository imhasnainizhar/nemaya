import Link from "next/link"
import { Logo } from "./logo"

const COLS = [
  { title: "Shop", links: [["All products", "/shop"], ["Hoodies", "/shop?category=hoodies"], ["Outerwear", "/shop?category=outerwear"], ["Accessories", "/shop?category=accessories"], ["Gift cards", "/gift-cards"]] },
  { title: "Account", links: [["Sign in", "/login"], ["Create account", "/register"], ["Orders", "/account/orders"], ["Wishlist", "/account/wishlist"], ["Notifications", "/account/notifications"]] },
  { title: "Help", links: [["Gift card balance", "/gift-cards/balance"], ["Shipping & returns", "/shop"], ["Privacy", "/"], ["Terms", "/"]] },
]

export function Footer() {
  return (
    <footer className="mt-24 border-t border-bark/10 bg-sand/60">
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-bark-soft">
            Rooted in comfort. Heavyweight basics in earth tones, made to be worn in.
          </p>
          <p className="mt-6 rounded-2xl border border-clay/30 bg-paper px-4 py-3 text-xs leading-relaxed text-bark-soft">
            This is a portfolio project. Payments run in Stripe test mode — no real orders are charged or shipped.
          </p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <p className="mb-4 text-xs font-semibold tracking-[0.16em] uppercase">{c.title}</p>
            <ul className="space-y-2.5">
              {c.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-bark-soft transition hover:text-bark">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-x flex flex-col items-center justify-between gap-2 border-t border-bark/10 py-6 text-xs text-stone sm:flex-row">
        <p>© {new Date().getFullYear()} Nemaya. All rights reserved.</p>
        <p>Built with Medusa & Next.js</p>
      </div>
    </footer>
  )
}
