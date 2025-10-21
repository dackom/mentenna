import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateAuthorGenres() {
  console.log("🔄 Starting author genre migration...");

  // Get all author writing genres that need migration
  const authorGenres = await prisma.authorWritingGenre.findMany({
    where: {
      OR: [
        { genre1Id: null, genre_1: { not: null } },
        { genre2Id: null, genre_2: { not: null } },
      ],
    },
  });

  console.log(`📊 Found ${authorGenres.length} genre entries to migrate`);

  let successCount = 0;
  let genre1MissingCount = 0;
  let genre2MissingCount = 0;

  for (const authorGenre of authorGenres) {
    const updates: {
      genre1Id?: string | null;
      genre2Id?: string | null;
    } = {};

    // Try to find matching Genre1
    if (authorGenre.genre_1 && !authorGenre.genre1Id) {
      const genre1 = await prisma.genre1.findFirst({
        where: {
          name: authorGenre.genre_1,
          writes: authorGenre.writes || "",
        },
      });

      if (genre1) {
        updates.genre1Id = genre1.id;
      } else {
        console.warn(
          `⚠️  Genre1 not found: ${authorGenre.genre_1} (writes: ${authorGenre.writes})`
        );
        genre1MissingCount++;
      }
    }

    // Try to find matching Genre2
    if (authorGenre.genre_2 && !authorGenre.genre2Id && updates.genre1Id) {
      const genre2 = await prisma.genre2.findFirst({
        where: {
          name: authorGenre.genre_2,
          genre1Id: updates.genre1Id,
        },
      });

      if (genre2) {
        updates.genre2Id = genre2.id;
      } else {
        console.warn(
          `⚠️  Genre2 not found: ${authorGenre.genre_2} (under genre1Id: ${updates.genre1Id})`
        );
        genre2MissingCount++;
      }
    }

    // Update the record if we found matches
    if (Object.keys(updates).length > 0) {
      await prisma.authorWritingGenre.update({
        where: { id: authorGenre.id },
        data: updates,
      });
      successCount++;
    }
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`   - Successfully migrated: ${successCount} entries`);
  console.log(`   - Genre1 not found: ${genre1MissingCount} entries`);
  console.log(`   - Genre2 not found: ${genre2MissingCount} entries`);

  if (genre1MissingCount > 0 || genre2MissingCount > 0) {
    console.log("\n⚠️  Some genres could not be matched. You may need to:");
    console.log(
      "   1. Check if those genres exist in the genre_1 and genre_2 tables"
    );
    console.log("   2. Manually add missing genres to the database");
    console.log("   3. Re-run this migration script");
  }
}

migrateAuthorGenres()
  .catch((error) => {
    console.error("❌ Error migrating author genres:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
