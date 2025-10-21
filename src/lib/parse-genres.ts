import fs from "fs";
import path from "path";

export type GenreHierarchy = {
  writes: string;
  genre_1?: string;
  genre_2?: string;
  genre_3?: string;
};

let cachedGenreData: GenreHierarchy[] | null = null;
let lastModifiedTime: number | null = null;

export function parseGenresCSV(): GenreHierarchy[] {
  const csvPath = path.join(process.cwd(), "src", "csvs", "genres.csv");

  // In development, check if file has been modified
  if (process.env.NODE_ENV === "development") {
    const stats = fs.statSync(csvPath);
    const currentModifiedTime = stats.mtimeMs;

    // Clear cache if file has been modified
    if (lastModifiedTime !== null && currentModifiedTime !== lastModifiedTime) {
      cachedGenreData = null;
    }

    lastModifiedTime = currentModifiedTime;
  }

  if (cachedGenreData) {
    return cachedGenreData;
  }

  // Read CSV file
  const csvContent = fs.readFileSync(csvPath, "utf-8");

  // Parse CSV manually
  const lines = csvContent.split("\n").filter((line) => line.trim());

  cachedGenreData = lines
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

  return cachedGenreData;
}

export function getWritesOptions(): string[] {
  const data = parseGenresCSV();
  const unique = new Set(data.map((row) => row.writes));
  return Array.from(unique).sort();
}

export function getGenre1Options(writes: string | null | undefined): string[] {
  if (!writes) return [];

  const data = parseGenresCSV();
  const filtered = data.filter((row) => row.writes === writes && row.genre_1);
  const unique = new Set(filtered.map((row) => row.genre_1!));
  return Array.from(unique).sort();
}

export function getGenre2Options(
  writes: string | null | undefined,
  genre1: string | null | undefined
): string[] {
  if (!writes || !genre1) return [];

  const data = parseGenresCSV();
  const filtered = data.filter(
    (row) => row.writes === writes && row.genre_1 === genre1 && row.genre_2
  );
  const unique = new Set(filtered.map((row) => row.genre_2!));
  return Array.from(unique).sort();
}

export function getGenre3Options(
  writes: string | null | undefined,
  genre1: string | null | undefined,
  genre2: string | null | undefined
): string[] {
  if (!writes || !genre1 || !genre2) return [];

  const data = parseGenresCSV();
  const filtered = data.filter(
    (row) =>
      row.writes === writes &&
      row.genre_1 === genre1 &&
      row.genre_2 === genre2 &&
      row.genre_3
  );
  const unique = new Set(filtered.map((row) => row.genre_3!));
  return Array.from(unique).sort();
}
