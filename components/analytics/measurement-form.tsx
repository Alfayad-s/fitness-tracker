"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { todayDateString } from "@/lib/workout/format";
import { createBodyMeasurement } from "@/services/measurement-actions";
import {
  MEASUREMENT_FORM_SECTIONS,
  type MeasurementFormValues,
} from "@/types/schemas/measurement";

export function MeasurementForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<MeasurementFormValues>({
    defaultValues: {
      recordedAt: todayDateString(),
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const result = await createBodyMeasurement(values);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.push("/progress");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <label htmlFor="recordedAt" className="text-sm font-medium">
          Date
        </label>
        <Input id="recordedAt" type="date" {...register("recordedAt")} />
      </div>

      {MEASUREMENT_FORM_SECTIONS.map((section) => (
        <fieldset key={section.title} className="space-y-3">
          <div>
            <legend className="text-sm font-medium">{section.title}</legend>
            <p className="text-xs text-muted-foreground">{section.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {section.fields.map((field) => (
              <div key={field.name} className="space-y-1">
                <label
                  htmlFor={field.name}
                  className="text-xs text-muted-foreground"
                >
                  {field.label}
                </label>
                <Input
                  id={field.name}
                  type="number"
                  step={"step" in field ? field.step : "0.1"}
                  min={0}
                  max={"max" in field ? field.max : undefined}
                  placeholder={"placeholder" in field ? field.placeholder : undefined}
                  {...register(field.name)}
                />
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      <p className="text-xs text-muted-foreground">
        All fields except date are optional — fill in what your scale or InBody
        report shows.
      </p>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" asChild>
          <Link href="/progress">Cancel</Link>
        </Button>
        <Button type="submit" size="touch" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </form>
  );
}
