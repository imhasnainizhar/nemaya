/**
 * Nemaya storefront UI configuration.
 * Change a flag and the dev server hot-reloads; production picks it up on the next build.
 */
export const uiConfig = {
  /**
   * Desktop navigation style.
   *  true  → menu icon on the left, brand centred, and the slide-up menu drawer on desktop too
   *  false → classic header with the inline mega menu (Shop / Collections dropdowns)
   */
  desktop_menu: true,

  /**
   * Mobile navigation style.
   *  true  → floating bottom nav dock (Search · Home · Menu · Account) on phones/tablets
   *  false → header-only navigation (menu + cart icons in the top bar)
   */
  separate_mobile_nav_dock: true,

  /**
   * Only used when separate_mobile_nav_dock is true.
   *  true  → cart is a separate black floating button next to the dock
   *  false → cart sits inside the dock pill with the other items
   */
  dock_cart_separate: true,

  /**
   * Full-screen loading screen (brand letters rise, wordmark fills with progress,
   * then the panel sweeps up with a curved edge).
   *  true  → show it   ·   false → never show it
   */
  page_loader: true,

  /** true → only on the first page load of a browser session; false → on every full page load */
  page_loader_once_per_session: true,
} as const

export type UIConfig = typeof uiConfig
