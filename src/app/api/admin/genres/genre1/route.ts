import { NextRequest, NextResponse } from "next/server";
import { getAllGenre1, getGenre1ByWrites, createGenre1 } from "@/lib/db/genres";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const writes = searchParams.get("writes");

    let genres;
    if (writes) {
      genres = await getGenre1ByWrites(writes);
    } else {
      genres = await getAllGenre1();
    }

    return NextResponse.json({ genres });
  } catch (error) {
    console.error("Error fetching Genre1:", error);
    return NextResponse.json(
      { error: "Failed to fetch genres" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, writes, order } = body;

    if (!name || !writes) {
      return NextResponse.json(
        { error: "Name and writes are required" },
        { status: 400 }
      );
    }

    if (!["Fiction", "Non-fiction", "Speculative"].includes(writes)) {
      return NextResponse.json(
        { error: "Invalid writes value" },
        { status: 400 }
      );
    }

    const genre = await createGenre1({ name, writes, order });

    return NextResponse.json({ genre }, { status: 201 });
  } catch (error) {
    console.error("Error creating Genre1:", error);
    return NextResponse.json(
      { error: "Failed to create genre" },
      { status: 500 }
    );
  }
}
