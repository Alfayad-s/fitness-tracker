import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "AI Assistant",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function AiLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="ai-assistant-light min-h-[100dvh] bg-white text-neutral-900">
      {children}
    </div>
  );
}
