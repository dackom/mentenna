import { NextRequest, NextResponse } from "next/server";
import { getGenre1ById, updateGenre1, deleteGenre1 } from "@/lib/db/genres";
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
    const genre = await getGenre1ById(id);

    if (!genre) {
      return NextResponse.json({ error: "Genre not found" }, { status: 404 });
    }

    return NextResponse.json({ genre });
  } catch (error) {
    console.error("Error fetching Genre1:", error);
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
    const { name, writes, order } = body;

    const updateData: Parameters<typeof updateGenre1>[1] = {};
    if (name !== undefined) updateData.name = name;
    if (writes !== undefined) {
      if (!["Fiction", "Non-fiction", "Speculative"].includes(writes)) {
        return NextResponse.json(
          { error: "Invalid writes value" },
          { status: 400 }
        );
      }
      updateData.writes = writes;
    }
    if (order !== undefined) updateData.order = order;

    const genre = await updateGenre1(id, updateData);

    return NextResponse.json({ genre });
  } catch (error) {
    console.error("Error updating Genre1:", error);
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
    await deleteGenre1(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Genre1:", error);
    return NextResponse.json(
      { error: "Failed to delete genre" },
      { status: 500 }
    );
  }
}
