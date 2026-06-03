import { DB_POOLER_HINT } from "@/lib/db/errors";

type DbUnavailableAlertProps = {
  title?: string;
};

export function DbUnavailableAlert({
  title = "Database temporarily unavailable",
}: DbUnavailableAlertProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-amber-900/90 dark:text-amber-100/80">
        {DB_POOLER_HINT} Then restart <code className="text-xs">npm run dev</code>
        .
      </p>
    </div>
  );
}
