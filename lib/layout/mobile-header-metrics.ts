/**
 * Mobile top bar + streak pin layout (keep in sync with app-header-bar & header-streak-pin).
 */

/** App home route (bottom nav "home") */
export const HOME_ROUTE = "/dashboard";

export function isHomeRoute(pathname: string): boolean {
  return pathname === HOME_ROUTE;
}

/** Inner row height in app-header-bar */
export const MOBILE_HEADER_BAR_HEIGHT = "4.75rem";

/** header border-b */
export const MOBILE_HEADER_BORDER = "1px";

/** Space between header bottom edge and streak capsule top */
export const STREAK_BELOW_HEADER_GAP = "0.75rem";

/**
 * Streak pin link: py-1.5 + capsule badge h-9 (sm) + border.
 * py-1.5 (0.75rem) + 2.25rem content ≈ 3rem
 */
export const STREAK_CAPSULE_HEIGHT = "3rem";

/** Collapsed pin offset from top when header is hidden */
export const STREAK_PINNED_FROM_TOP = "20px";

export const mobileHeaderStreakTopAttached = `calc(env(safe-area-inset-top, 0px) + ${MOBILE_HEADER_BAR_HEIGHT} + ${MOBILE_HEADER_BORDER} + ${STREAK_BELOW_HEADER_GAP})`;

export const mobileHeaderStreakTopPinned = `calc(env(safe-area-inset-top, 0px) + ${STREAK_PINNED_FROM_TOP})`;

/** Main content padding when header + streak pin are visible */
export const mobileHeaderContentPaddingTop = `calc(env(safe-area-inset-top, 0px) + ${MOBILE_HEADER_BAR_HEIGHT} + ${MOBILE_HEADER_BORDER} + ${STREAK_BELOW_HEADER_GAP} + ${STREAK_CAPSULE_HEIGHT})`;

/** Main content padding when only streak pin is visible */
export const mobileStreakPinContentPaddingTop = `calc(env(safe-area-inset-top, 0px) + ${STREAK_PINNED_FROM_TOP} + ${STREAK_CAPSULE_HEIGHT})`;

/** Main content padding when header is visible without streak pin */
export const mobileHeaderOnlyPaddingTop = `calc(env(safe-area-inset-top, 0px) + ${MOBILE_HEADER_BAR_HEIGHT} + ${MOBILE_HEADER_BORDER})`;
