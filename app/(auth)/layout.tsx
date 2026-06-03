import type { Metadata } from "next";

import { PageBackButton } from "@/components/layout/page-back-button";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className="flex min-h-[100dvh] flex-1 flex-col justify-center px-5 py-10 sm:px-6"
      style={{
        paddingTop: "max(2.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="mx-auto w-full max-w-[22rem] sm:max-w-sm">
        <PageBackButton className="px-0 pt-0" fallbackHref="/dashboard" />
        {children}
      </div>
    </div>
  );
}
