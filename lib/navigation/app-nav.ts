export const APP_NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "home",
    title: "Home",
    iconKey: "home",
    accentColor: "#EAB308",
  },
  {
    href: "/workouts",
    label: "workouts",
    title: "Workouts",
    iconKey: "barbell",
    accentColor: "#EF4444",
  },
  {
    href: "/progress",
    label: "progress",
    title: "Progress",
    iconKey: "chartBar",
    accentColor: "#22C55E",
  },
  {
    href: "/profile",
    label: "profile",
    title: "Profile",
    iconKey: "user",
    accentColor: "#3B82F6",
  },
] as const;

export type AppNavIconKey = (typeof APP_NAV_ITEMS)[number]["iconKey"];

export type AppNavItem = (typeof APP_NAV_ITEMS)[number];
