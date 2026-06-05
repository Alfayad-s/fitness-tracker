type StatSummaryProps = {
  items: { label: string; value: string }[];
};

export function StatSummary({ items }: StatSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl bg-card px-3 py-3"
        >
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
