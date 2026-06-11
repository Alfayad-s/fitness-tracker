import Image from "next/image";

import {
  getGreetingDisplayName,
  getGreetingPeriod,
} from "@/lib/analytics/dashboard-summary";

type DashboardWelcomeHeaderProps = {
  fullName: string | null;
  username: string | null;
};

export function DashboardWelcomeHeader({
  fullName,
  username,
}: DashboardWelcomeHeaderProps) {
  const period = getGreetingPeriod();
  const displayName = getGreetingDisplayName(fullName, username);

  return (
    <header className="flex items-start justify-between gap-1 sm:gap-3">
      <div className="min-w-0 flex-1 pt-0.5">
        <h1 className="text-[1.75rem] font-semibold leading-[1.15] tracking-tight sm:text-3xl">
          {period},
          <br />
          <span className="font-bold">{displayName}</span>
        </h1>
        <p className="mt-1.5 text-base text-muted-foreground">
          Here&apos;s how your training is going.
        </p>
      </div>
      <Image
        src="/buddy/hi-image.png"
        alt=""
        width={260}
        height={320}
        priority
        className="pointer-events-none -mr-1 h-36 w-auto shrink-0 object-contain object-top sm:h-44"
        aria-hidden
      />
    </header>
  );
}
