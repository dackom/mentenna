import fs from "fs";
import path from "path";

let cachedPersonalities: string[] | null = null;
let lastModifiedTime: number | null = null;

export function parsePersonalitiesCSV(): string[] {
  const csvPath = path.join(process.cwd(), "src", "csvs", "personalities.csv");

  // In development, check if file has been modified
  if (process.env.NODE_ENV === "development") {
    const stats = fs.statSync(csvPath);
    const currentModifiedTime = stats.mtimeMs;

    // Clear cache if file has been modified
    if (lastModifiedTime !== null && currentModifiedTime !== lastModifiedTime) {
      cachedPersonalities = null;
    }

    lastModifiedTime = currentModifiedTime;
  }

  if (cachedPersonalities) {
    return cachedPersonalities;
  }

  // Read CSV file
  const csvContent = fs.readFileSync(csvPath, "utf-8");

  // Parse CSV - each line is a personality (no headers, single column)
  const lines = csvContent.split("\n").filter((line) => line.trim());

  cachedPersonalities = lines
    .map((line) => line.trim())
    .filter((personality) => personality && personality.length > 0);

  // Remove duplicates and sort
  cachedPersonalities = Array.from(new Set(cachedPersonalities)).sort();

  return cachedPersonalities;
}

export function getPersonalityOptions(): string[] {
  return parsePersonalitiesCSV();
}
