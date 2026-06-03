import { and, desc, eq, gte, lte } from "drizzle-orm";

import type { DateRange } from "@/lib/analytics/date-range";
import { DbError, runDb } from "@/lib/db/errors";
import { db } from "@/lib/db";
import { withDbFallback } from "@/lib/db/with-db";
import { bodyMeasurements } from "@/lib/db/schema";
import type { BodyMeasurement, NewBodyMeasurement } from "@/types";

export type ListBodyMeasurementsResult = {
  measurements: BodyMeasurement[];
  dbUnavailable: boolean;
};

export async function getBodyMeasurementById(
  id: string,
  userId: string,
): Promise<BodyMeasurement | null> {
  return withDbFallback(
    "getBodyMeasurementById",
    async () => {
      const [row] = await db
        .select()
        .from(bodyMeasurements)
        .where(
          and(eq(bodyMeasurements.id, id), eq(bodyMeasurements.userId, userId)),
        )
        .limit(1);

      return row ?? null;
    },
    null,
  );
}

export async function getLatestBodyMeasurementByUser(
  userId: string,
): Promise<BodyMeasurement | null> {
  return withDbFallback(
    "getLatestBodyMeasurementByUser",
    async () => {
      const [row] = await db
        .select()
        .from(bodyMeasurements)
        .where(eq(bodyMeasurements.userId, userId))
        .orderBy(desc(bodyMeasurements.recordedAt))
        .limit(1);

      return row ?? null;
    },
    null,
  );
}

export async function listBodyMeasurementsByUser(
  userId: string,
  limit = 50,
): Promise<ListBodyMeasurementsResult> {
  return withDbFallback(
    "listBodyMeasurementsByUser",
    async () => {
      const measurements = await db
        .select()
        .from(bodyMeasurements)
        .where(eq(bodyMeasurements.userId, userId))
        .orderBy(desc(bodyMeasurements.recordedAt))
        .limit(limit);

      const result: ListBodyMeasurementsResult = {
        measurements,
        dbUnavailable: false,
      };
      return result;
    },
    { measurements: [], dbUnavailable: true },
  );
}

export async function listBodyMeasurementsInRange(
  userId: string,
  range: DateRange,
): Promise<BodyMeasurement[]> {
  return withDbFallback(
    "listBodyMeasurementsInRange",
    async () =>
      db
        .select()
        .from(bodyMeasurements)
        .where(
          and(
            eq(bodyMeasurements.userId, userId),
            gte(
              bodyMeasurements.recordedAt,
              new Date(`${range.from}T00:00:00.000Z`),
            ),
            lte(
              bodyMeasurements.recordedAt,
              new Date(`${range.to}T23:59:59.999Z`),
            ),
          ),
        )
        .orderBy(bodyMeasurements.recordedAt),
    [],
  );
}

export async function createBodyMeasurement(
  data: NewBodyMeasurement,
): Promise<BodyMeasurement> {
  return runDb("createBodyMeasurement", async () => {
    const [row] = await db.insert(bodyMeasurements).values(data).returning();
    return row;
  });
}

export async function updateBodyMeasurement(
  id: string,
  userId: string,
  data: Partial<NewBodyMeasurement>,
): Promise<BodyMeasurement> {
  return runDb("updateBodyMeasurement", async () => {
    const [row] = await db
      .update(bodyMeasurements)
      .set(data)
      .where(
        and(eq(bodyMeasurements.id, id), eq(bodyMeasurements.userId, userId)),
      )
      .returning();

    if (!row) {
      throw new DbError(
        "NOT_FOUND",
        "Body measurement not found",
        "updateBodyMeasurement",
      );
    }

    return row;
  });
}

export async function deleteBodyMeasurement(
  id: string,
  userId: string,
): Promise<void> {
  return runDb("deleteBodyMeasurement", async () => {
    const result = await db
      .delete(bodyMeasurements)
      .where(
        and(eq(bodyMeasurements.id, id), eq(bodyMeasurements.userId, userId)),
      )
      .returning({ id: bodyMeasurements.id });

    if (result.length === 0) {
      throw new DbError(
        "NOT_FOUND",
        "Body measurement not found",
        "deleteBodyMeasurement",
      );
    }
  });
}
