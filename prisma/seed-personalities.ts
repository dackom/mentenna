import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function parsePersonalitiesCSV(csvPath: string): string[] {
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n").filter((line) => line.trim());

  return lines
    .map((line) => line.trim())
    .filter((personality) => personality && personality.length > 0);
}

async function seedPersonalities() {
  console.log("🌱 Starting personality seeding...");

  const csvPath = path.join(process.cwd(), "src", "csvs", "personalities.csv");
  const personalities = parsePersonalitiesCSV(csvPath);

  console.log(`📖 Parsed ${personalities.length} personalities from CSV`);

  let count = 0;
  for (let i = 0; i < personalities.length; i++) {
    const name = personalities[i];

    await prisma.personality.upsert({
      where: { name },
      update: { order: i },
      create: {
        name,
        order: i,
      },
    });

    count++;
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`   - Created/updated ${count} personality entries`);
}

seedPersonalities()
  .catch((error) => {
    console.error("❌ Error seeding personalities:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
