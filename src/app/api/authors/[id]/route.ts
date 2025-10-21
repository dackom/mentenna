import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorUpdateSchema } from "@/lib/validations/author";
import { v4 as uuidv4 } from "uuid";

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
        writingGenres: true,
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

    const { writingGenres, ...authorData } = validatedData;

    // Delete existing genres and create new ones
    await prisma.authorWritingGenre.deleteMany({
      where: { authorId: id },
    });

    const author = await prisma.author.update({
      where: { id },
      data: {
        ...authorData,
        writingGenres: {
          create:
            writingGenres?.map((genre) => ({
              id: uuidv4(),
              writes: genre.writes || null,
              genre_1: genre.genre_1 || null,
              genre_2: genre.genre_2 || null,
              genre_3: genre.genre_3 || null,
            })) || [],
        },
      },
      include: {
        writingGenres: true,
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

    await prisma.author.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting author:", error);
    return NextResponse.json(
      { error: "Failed to delete author" },
      { status: 500 }
    );
  }
}
