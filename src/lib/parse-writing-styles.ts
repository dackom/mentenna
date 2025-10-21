import fs from "fs";
import path from "path";

let cachedWritingStyles: string[] | null = null;
let lastModifiedTime: number | null = null;

export function parseWritingStylesCSV(): string[] {
  const csvPath = path.join(process.cwd(), "src", "csvs", "writing_styles.csv");

  // In development, check if file has been modified
  if (process.env.NODE_ENV === "development") {
    const stats = fs.statSync(csvPath);
    const currentModifiedTime = stats.mtimeMs;

    // Clear cache if file has been modified
    if (lastModifiedTime !== null && currentModifiedTime !== lastModifiedTime) {
      cachedWritingStyles = null;
    }

    lastModifiedTime = currentModifiedTime;
  }

  if (cachedWritingStyles) {
    return cachedWritingStyles;
  }

  // Read CSV file
  const csvContent = fs.readFileSync(csvPath, "utf-8");

  // Parse CSV properly handling quoted fields with commas and newlines
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let isFirstRow = true;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      // End of row
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (!isFirstRow && currentRow.length > 0 && currentRow[0]) {
          rows.push(currentRow);
        }
        isFirstRow = false;
        currentRow = [];
        currentField = "";
      }
      // Skip \r if it's followed by \n (Windows line endings)
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
    } else {
      currentField += char;
    }
  }

  // Handle last row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (!isFirstRow && currentRow.length > 0 && currentRow[0]) {
      rows.push(currentRow);
    }
  }

  // Extract first column (writing styles)
  cachedWritingStyles = rows
    .map((row) => row[0])
    .filter((style) => style && style.length > 0);

  // Remove duplicates and sort
  cachedWritingStyles = Array.from(new Set(cachedWritingStyles)).sort();

  return cachedWritingStyles;
}

export function getWritingStyleOptions(): string[] {
  return parseWritingStylesCSV();
}
