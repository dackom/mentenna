import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function parseWritingStylesCSV(
  csvPath: string
): Array<{ name: string; description: string }> {
  const csvContent = fs.readFileSync(csvPath, "utf-8");

  // Parse CSV manually to handle quoted fields with newlines
  const writingStyles: Array<{ name: string; description: string }> = [];
  const lines = csvContent.split("\n");

  let currentLine = "";
  let inQuotes = false;

  for (const line of lines) {
    currentLine += (currentLine ? "\n" : "") + line;

    // Count quotes to determine if we're inside a quoted field
    const quoteCount = (currentLine.match(/"/g) || []).length;
    inQuotes = quoteCount % 2 !== 0;

    if (!inQuotes && currentLine.trim()) {
      // Parse the row
      const fields: string[] = [];
      let currentField = "";
      let insideQuote = false;

      for (let i = 0; i < currentLine.length; i++) {
        const char = currentLine[i];

        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === "," && !insideQuote) {
          fields.push(currentField.trim());
          currentField = "";
        } else {
          currentField += char;
        }
      }
      fields.push(currentField.trim());

      // Extract name (1st column) and description (6th/last column)
      if (fields.length >= 6) {
        const name = fields[0].replace(/^["']|["']$/g, "").trim();
        const description = fields[5].replace(/^["']|["']$/g, "").trim();

        if (name && description) {
          writingStyles.push({ name, description });
        }
      }

      currentLine = "";
    }
  }

  return writingStyles;
}

async function seedWritingStyles() {
  console.log("🌱 Starting writing styles seeding...");

  const csvPath = path.join(process.cwd(), "src", "csvs", "writing_styles.csv");
  const writingStyles = parseWritingStylesCSV(csvPath);

  console.log(`📖 Parsed ${writingStyles.length} writing styles from CSV`);

  let count = 0;
  for (let i = 0; i < writingStyles.length; i++) {
    const { name, description } = writingStyles[i];

    // Find existing writing style by name
    const existing = await prisma.writingStyle.findFirst({
      where: { name },
    });

    if (existing) {
      // Update existing
      await prisma.writingStyle.update({
        where: { id: existing.id },
        data: { description, order: i },
      });
    } else {
      // Create new
      await prisma.writingStyle.create({
        data: {
          name,
          description,
          order: i,
        },
      });
    }

    count++;
    console.log(`  ✓ ${name}`);
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`   - Created/updated ${count} writing style entries`);
}

seedWritingStyles()
  .catch((error) => {
    console.error("❌ Error seeding writing styles:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
