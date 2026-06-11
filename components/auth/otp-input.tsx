"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type OtpInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

export function OtpInput({
  id = "otp",
  value,
  onChange,
  disabled,
  className,
  ...aria
}: OtpInputProps) {
  return (
    <Input
      id={id}
      size="lg"
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      placeholder="000000"
      disabled={disabled}
      value={value}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
        onChange(digits);
      }}
      className={cn(
        "text-center font-mono text-2xl tracking-[0.35em]",
        "placeholder:tracking-[0.35em] placeholder:text-muted-foreground/40",
        className,
      )}
      {...aria}
    />
  );
}
