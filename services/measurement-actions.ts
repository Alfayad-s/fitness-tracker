"use server";

import { revalidatePath } from "next/cache";

import { DbError } from "@/lib/db/errors";
import {
  createBodyMeasurement as insertBodyMeasurement,
  deleteBodyMeasurement as removeBodyMeasurement,
  listBodyMeasurementsByUser,
} from "@/lib/db/queries/body-measurements";
import {
  measurementFormHasMetrics,
  measurementFormToInsert,
} from "@/lib/measurements/measurement-form-map";
import { createClient } from "@/lib/supabase/server";
import {
  measurementFormSchema,
  type MeasurementFormValues,
} from "@/types/schemas/measurement";
import type { BodyMeasurement } from "@/types";

function mapDbError(error: unknown, fallback: string): string {
  if (error instanceof DbError) return error.userMessage;
  return fallback;
}

export async function fetchMeasurementHistory(): Promise<
  { measurements: BodyMeasurement[] } | { error: string; measurements: [] }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: "You must be signed in.", measurements: [] };
  }

  const { measurements, dbUnavailable } = await listBodyMeasurementsByUser(
    user.id,
  );

  if (dbUnavailable) {
    return {
      error: "Could not load measurements. Check database connection.",
      measurements: [],
    };
  }

  return { measurements };
}

export async function createBodyMeasurement(
  input: MeasurementFormValues,
): Promise<{ success: true; id: string } | { error: string }> {
  const parsed = measurementFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid measurement data." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: "You must be signed in." };
  }

  const v = parsed.data;

  if (!measurementFormHasMetrics(v)) {
    return {
      error: "Enter at least one measurement (weight, body composition, or circumference).",
    };
  }

  try {
    const row = await insertBodyMeasurement(
      measurementFormToInsert(user.id, v),
    );

    revalidatePath("/progress");
    revalidatePath("/dashboard");
    return { success: true, id: row.id };
  } catch (err) {
    return {
      error: mapDbError(err, "Could not save measurement."),
    };
  }
}

export async function deleteBodyMeasurement(
  id: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: "You must be signed in." };
  }

  try {
    await removeBodyMeasurement(id, user.id);
    revalidatePath("/progress");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return {
      error: mapDbError(err, "Could not delete measurement."),
    };
  }
}
