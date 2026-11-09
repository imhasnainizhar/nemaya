import Link from "next/link"
import { Heart, User } from "lucide-react"
import { uiConfig } from "../../nemaya.config"
import { getProfile } from "@/lib/data"
import type { NavData } from "@/lib/nav"
import { cn } from "@/lib/util"
import { Logo } from "./logo"
import { Avatar } from "./avatar"
import { NotificationBell } from "./notification-bell"
import { MegaMenu } from "./nav/mega-menu"
import { MenuTrigger } from "./nav/menu-trigger"
import { CartButton, SearchButton } from "./nav/header-actions"

/**
 * Header layouts (nemaya.config.ts → desktop_menu):
 *  true  → [menu] · brand (centred) · [actions] on every screen size, menu opens the drawer
 *  false → phones: [menu] · brand · [actions]; desktop: brand · mega menu · actions
 */
export async function Header({ nav }: { nav: NavData }) {
  const me = await getProfile()
  const signedIn = !!me?.customer
  const drawerOnDesktop = uiConfig.desktop_menu

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-bark text-linen">
        <p className="container-x truncate py-2 text-center text-[11px] leading-4 tracking-[0.18em] uppercase">
          Free shipping over $99<span className="hidden sm:inline"> · Portfolio demo — test payments only</span>
        </p>
      </div>
      <div className="relative border-b border-bark/10 bg-linen/90 backdrop-blur-md">
        <div className={cn("container-x grid h-[68px] grid-cols-[1fr_auto_1fr] items-center", !drawerOnDesktop && "lg:flex lg:gap-8")}>
          <div className={cn("flex items-center", !drawerOnDesktop && "lg:hidden")}>
            <MenuTrigger />
          </div>

          <Logo className="justify-self-center" />

          {!drawerOnDesktop && <MegaMenu nav={nav} />}

          <div className={cn("flex items-center justify-end gap-1.5", !drawerOnDesktop && "lg:ml-auto")}>
            <SearchButton />
            <Link href="/account/wishlist" aria-label="Wishlist" className="hidden h-10 w-10 place-items-center rounded-full bg-sand/70 transition-colors hover:bg-sand lg:grid">
              <Heart className="h-[18px] w-[18px]" strokeWidth={1.7} />
            </Link>
            {signedIn && (
              <span className="hidden lg:block">
                <NotificationBell />
              </span>
            )}
            <Link
              href={signedIn ? "/account" : "/login"}
              aria-label={signedIn ? "Your account" : "Sign in"}
              className="hidden h-10 w-10 place-items-center rounded-full bg-sand/70 transition-colors hover:bg-sand lg:grid"
            >
              {signedIn && me?.profile ? <Avatar id={me.profile.avatar_id} size={30} /> : <User className="h-[18px] w-[18px]" strokeWidth={1.7} />}
            </Link>
            <CartButton />
          </div>
        </div>
      </div>
    </header>
  )
}
