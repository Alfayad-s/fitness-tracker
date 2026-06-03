import { timestamp } from "drizzle-orm/pg-core";

/** Shared created/updated columns for auditable tables. */
export const auditTimestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
};
