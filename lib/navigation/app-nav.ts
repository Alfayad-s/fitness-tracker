export const APP_NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "home",
    title: "Home",
    iconKey: "home",
  },
  {
    href: "/workouts",
    label: "workouts",
    title: "Workouts",
    iconKey: "barbell",
  },
  {
    href: "/progress",
    label: "progress",
    title: "Progress",
    iconKey: "chartBar",
  },
  {
    href: "/profile",
    label: "profile",
    title: "Profile",
    iconKey: "user",
  },
] as const;

export type AppNavIconKey = (typeof APP_NAV_ITEMS)[number]["iconKey"];

export type AppNavItem = (typeof APP_NAV_ITEMS)[number];
