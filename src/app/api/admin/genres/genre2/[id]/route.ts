import { NextRequest, NextResponse } from "next/server";
import { getGenre2ById, updateGenre2, deleteGenre2 } from "@/lib/db/genres";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const genre = await getGenre2ById(id);

    if (!genre) {
      return NextResponse.json({ error: "Genre not found" }, { status: 404 });
    }

    return NextResponse.json({ genre });
  } catch (error) {
    console.error("Error fetching Genre2:", error);
    return NextResponse.json(
      { error: "Failed to fetch genre" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, order } = body;

    const updateData: Parameters<typeof updateGenre2>[1] = {};
    if (name !== undefined) updateData.name = name;
    if (order !== undefined) updateData.order = order;

    const genre = await updateGenre2(id, updateData);

    return NextResponse.json({ genre });
  } catch (error) {
    console.error("Error updating Genre2:", error);
    return NextResponse.json(
      { error: "Failed to update genre" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await deleteGenre2(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Genre2:", error);
    return NextResponse.json(
      { error: "Failed to delete genre" },
      { status: 500 }
    );
  }
}
