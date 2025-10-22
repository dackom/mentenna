import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

type GenreRow = {
  writes: string;
  genre_1?: string;
  genre_2?: string;
  genre_3?: string;
};

function parseCSV(csvPath: string): GenreRow[] {
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n").filter((line) => line.trim());

  return lines
    .map((line) => {
      const columns = line.split(",").map((col) => col.trim());
      return {
        writes: columns[0] || "",
        genre_1: columns[1] || undefined,
        genre_2: columns[2] || undefined,
        genre_3: columns[3] || undefined,
      };
    })
    .filter((row) => row.writes); // Filter out empty rows
}

async function seedGenres() {
  console.log("🌱 Starting genre seeding...");

  const csvPath = path.join(process.cwd(), "src", "csvs", "genres.csv");
  const rows = parseCSV(csvPath);

  console.log(`📖 Parsed ${rows.length} rows from CSV`);

  // Group by writes and genre_1 to extract unique combinations
  const genre1Map = new Map<
    string,
    Map<string, { order: number; genre2s: Set<string> }>
  >();

  rows.forEach((row, index) => {
    if (!row.genre_1) return; // Skip rows without genre_1

    if (!genre1Map.has(row.writes)) {
      genre1Map.set(row.writes, new Map());
    }

    const genre1s = genre1Map.get(row.writes)!;

    if (!genre1s.has(row.genre_1)) {
      genre1s.set(row.genre_1, {
        order: genre1s.size,
        genre2s: new Set(),
      });
    }

    if (row.genre_2) {
      genre1s.get(row.genre_1)!.genre2s.add(row.genre_2);
    }
  });

  console.log(
    `📊 Found ${Array.from(genre1Map.values()).reduce((sum, g1Map) => sum + g1Map.size, 0)} unique Genre1 entries`
  );

  // Insert Genre1 and Genre2 entries
  let genre1Count = 0;
  let genre2Count = 0;

  for (const [writes, genre1s] of genre1Map.entries()) {
    console.log(`\n📝 Processing "${writes}" category...`);

    for (const [genre1Name, { order, genre2s }] of genre1s.entries()) {
      // Create or get Genre1
      const genre1 = await prisma.genre1.upsert({
        where: {
          writes_name: {
            writes,
            name: genre1Name,
          },
        },
        update: {},
        create: {
          name: genre1Name,
          writes,
          order,
        },
      });

      genre1Count++;

      // Create Genre2 entries
      let genre2Order = 0;
      for (const genre2Name of Array.from(genre2s)) {
        await prisma.genre2.upsert({
          where: {
            genre1Id_name: {
              genre1Id: genre1.id,
              name: genre2Name,
            },
          },
          update: {},
          create: {
            name: genre2Name,
            genre1Id: genre1.id,
            order: genre2Order++,
          },
        });

        genre2Count++;
      }
    }
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`   - Created/updated ${genre1Count} Genre1 entries`);
  console.log(`   - Created/updated ${genre2Count} Genre2 entries`);
}

seedGenres()
  .catch((error) => {
    console.error("❌ Error seeding genres:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
