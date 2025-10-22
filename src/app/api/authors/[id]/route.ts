import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorUpdateSchema } from "@/lib/validations/author";
import { v4 as uuidv4 } from "uuid";
import { getGenre1ById, getGenre2ById } from "@/lib/db/genres";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// GET /api/authors/[id] - Get a single author
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    return NextResponse.json(author);
  } catch (error) {
    console.error("Error fetching author:", error);
    return NextResponse.json(
      { error: "Failed to fetch author" },
      { status: 500 }
    );
  }
}

// PUT /api/authors/[id] - Update an author
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = authorUpdateSchema.parse(body);

    const { writingGenres, personalityIds, ...authorData } = validatedData;

    // Delete existing genres and personalities
    await prisma.authorWritingGenre.deleteMany({
      where: { authorId: id },
    });

    await prisma.authorPersonality.deleteMany({
      where: { authorId: id },
    });

    // Populate legacy genre fields by looking up names from IDs
    const genresWithNames = await Promise.all(
      (writingGenres || []).map(async (genre) => {
        let genre_1_name = genre.genre_1 || null;
        let genre_2_name = genre.genre_2 || null;

        // If genre1Id is provided but genre_1 isn't, look up the name
        if (genre.genre1Id && !genre_1_name) {
          const genre1 = await getGenre1ById(genre.genre1Id);
          genre_1_name = genre1?.name || null;
        }

        // If genre2Id is provided but genre_2 isn't, look up the name
        if (genre.genre2Id && !genre_2_name) {
          const genre2 = await getGenre2ById(genre.genre2Id);
          genre_2_name = genre2?.name || null;
        }

        return {
          id: uuidv4(),
          writes: genre.writes || null,
          genre1Id: genre.genre1Id || null,
          genre2Id: genre.genre2Id || null,
          genre_3: genre.genre_3 || null,
          // Legacy fields for backwards compatibility
          genre_1: genre_1_name,
          genre_2: genre_2_name,
        };
      })
    );

    const author = await prisma.author.update({
      where: { id },
      data: {
        ...authorData,
        writingGenres: {
          create: genresWithNames,
        },
        personalities: {
          create: (personalityIds || []).map((personalityId) => ({
            personalityId,
          })),
        },
      },
      include: {
        writingGenres: true,
        personalities: {
          include: {
            personality: true,
          },
        },
        writingStyle1: true,
        writingStyle2: true,
      },
    });

    return NextResponse.json(author);
  } catch (error) {
    console.error("Error updating author:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update author" },
      { status: 500 }
    );
  }
}

// DELETE /api/authors/[id] - Delete an author
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First, get the author to check if they have an image
    const author = await prisma.author.findUnique({
      where: { id },
      select: { image: true },
    });

    // Delete the author from database
    await prisma.author.delete({
      where: { id },
    });

    // If author had an image, delete it from filesystem
    if (author?.image) {
      try {
        const uploadsPath = process.env.AVATAR_UPLOAD_DIR || "avatars";
        const filePath = path.join(uploadsPath, author.image);

        if (existsSync(filePath)) {
          await unlink(filePath);
        }
      } catch (error) {
        console.error("Error deleting avatar file:", error);
        // Continue anyway - author is already deleted from DB
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting author:", error);
    return NextResponse.json(
      { error: "Failed to delete author" },
      { status: 500 }
    );
  }
}
