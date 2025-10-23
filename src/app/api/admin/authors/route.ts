import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorSchema } from "@/lib/validations/author";
import { v4 as uuidv4 } from "uuid";
import { getGenre1ById, getGenre2ById } from "@/lib/db/genres";

// GET /api/authors - List all authors
export async function GET() {
  try {
    const authors = await prisma.author.findMany({
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

    const { writingGenres, personalityIds, ...authorData } = validatedData;

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

    const author = await prisma.author.create({
      data: {
        id: uuidv4(),
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
