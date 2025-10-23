import { NextRequest, NextResponse } from "next/server";
import { getGenre2ByGenre1, createGenre2 } from "@/lib/db/genres";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const genre1Id = searchParams.get("genre1Id");

    if (!genre1Id) {
      return NextResponse.json(
        { error: "genre1Id is required" },
        { status: 400 }
      );
    }

    const genres = await getGenre2ByGenre1(genre1Id);

    return NextResponse.json({ genres });
  } catch (error) {
    console.error("Error fetching Genre2:", error);
    return NextResponse.json(
      { error: "Failed to fetch genres" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, genre1Id, order } = body;

    if (!name || !genre1Id) {
      return NextResponse.json(
        { error: "Name and genre1Id are required" },
        { status: 400 }
      );
    }

    const genre = await createGenre2({ name, genre1Id, order });

    return NextResponse.json({ genre }, { status: 201 });
  } catch (error) {
    console.error("Error creating Genre2:", error);
    return NextResponse.json(
      { error: "Failed to create genre" },
      { status: 500 }
    );
  }
}
