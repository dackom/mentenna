import { prisma } from "@/lib/prisma";
import { AuthorsClient } from "./authors-client";

export default async function AuthorsPage() {
  const authors = await prisma.author.findMany({
    include: {
      writingGenres: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Type cast to match client expectations
  const clientAuthors = authors.map((author) => ({
    ...author,
    writingGenres: author.writingGenres.map((wg) => ({
      id: wg.id,
      writes: wg.writes as "Non-fiction" | "Fiction" | "Speculative" | null,
      genre_1: wg.genre_1,
      genre_2: wg.genre_2,
      genre_3: wg.genre_3,
    })),
  }));

  return <AuthorsClient initialAuthors={clientAuthors} />;
}
