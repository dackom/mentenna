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
      writingGenres: {
        include: {
          genre1: true,
          genre2: true,
        },
      },
      personalities: {
        include: {
          personality: true,
        },
      },
      writingStyle1: true,
      writingStyle2: true,
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
      genre1Id: wg.genre1Id,
      genre2Id: wg.genre2Id,
      genre_1: wg.genre_1,
      genre_2: wg.genre_2,
      genre_3: wg.genre_3,
      // Include the relations so the form can display names
      genre1: wg.genre1,
      genre2: wg.genre2,
    })),
    personalities: author.personalities,
    writingStyle1: author.writingStyle1,
    writingStyle2: author.writingStyle2,
  };

  return <EditAuthorClient author={clientAuthor} />;
}
