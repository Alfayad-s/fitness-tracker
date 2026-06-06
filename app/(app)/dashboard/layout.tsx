import { DashboardAuthGate } from "@/components/auth/dashboard-auth-gate";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DashboardAuthGate>{children}</DashboardAuthGate>;
}
