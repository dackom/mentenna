import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditAuthorClient } from "./edit-author-client";

interface EditAuthorPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAuthorPage({ params }: EditAuthorPageProps) {
  const { id } = await params;

  const author = await prisma.author.findUnique({
    where: { id },
    include: {
      writingGenres: true,
    },
  });

  if (!author) {
    notFound();
  }

  // Type cast to match client expectations
  const clientAuthor = {
    ...author,
    writingGenres: author.writingGenres.map((wg) => ({
      id: wg.id,
      writes: wg.writes as "Non-fiction" | "Fiction" | "Speculative" | null,
      genre_1: wg.genre_1,
      genre_2: wg.genre_2,
      genre_3: wg.genre_3,
    })),
  };

  return <EditAuthorClient author={clientAuthor} />;
}
