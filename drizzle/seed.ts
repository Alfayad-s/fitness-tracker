import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const { seedDefaultExercisesIfEmpty } = await import(
    "@/lib/db/seed-default-exercises"
  );
  const inserted = await seedDefaultExercisesIfEmpty();

  if (inserted > 0) {
    console.log(`Seeded ${inserted} default exercises.`);
  } else {
    console.log("Exercises already present — nothing to seed.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
