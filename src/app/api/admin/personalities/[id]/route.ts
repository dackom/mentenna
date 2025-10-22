import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/personalities/[id] - Update a personality
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Personality name is required" },
        { status: 400 }
      );
    }

    const personality = await prisma.personality.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json({ personality });
  } catch (error: any) {
    console.error("Error updating personality:", error);

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A personality with this name already exists" },
        { status: 409 }
      );
    }

    // Handle not found
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Personality not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update personality" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/personalities/[id] - Delete a personality
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.personality.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting personality:", error);

    // Handle not found
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Personality not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete personality" },
      { status: 500 }
    );
  }
}
