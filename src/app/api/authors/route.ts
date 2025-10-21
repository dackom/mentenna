import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorSchema } from "@/lib/validations/author";
import { v4 as uuidv4 } from "uuid";

// GET /api/authors - List all authors
export async function GET() {
  try {
    const authors = await prisma.author.findMany({
      include: {
        writingGenres: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(authors);
  } catch (error) {
    console.error("Error fetching authors:", error);
    return NextResponse.json(
      { error: "Failed to fetch authors" },
      { status: 500 }
    );
  }
}

// POST /api/authors - Create a new author
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = authorSchema.parse(body);

    const { writingGenres, ...authorData } = validatedData;

    const author = await prisma.author.create({
      data: {
        id: uuidv4(),
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

    return NextResponse.json(author, { status: 201 });
  } catch (error) {
    console.error("Error creating author:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create author" },
      { status: 500 }
    );
  }
}
