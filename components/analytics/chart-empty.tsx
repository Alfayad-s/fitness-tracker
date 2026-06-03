type ChartEmptyProps = {
  message: string;
};

export function ChartEmpty({ message }: ChartEmptyProps) {
  return (
    <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4">
      <p className="text-center text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
