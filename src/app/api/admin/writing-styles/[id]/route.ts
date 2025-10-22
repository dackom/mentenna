import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/admin/writing-styles/[id] - Update a writing style
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Writing style name is required" },
        { status: 400 }
      );
    }

    if (
      !description ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return NextResponse.json(
        { error: "Writing style description is required" },
        { status: 400 }
      );
    }

    const writingStyle = await prisma.writingStyle.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description.trim(),
      },
    });

    return NextResponse.json({ writingStyle });
  } catch (error: any) {
    console.error("Error updating writing style:", error);

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A writing style with this name already exists" },
        { status: 409 }
      );
    }

    // Handle not found
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Writing style not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update writing style" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/writing-styles/[id] - Delete a writing style
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.writingStyle.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting writing style:", error);

    // Handle not found
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Writing style not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete writing style" },
      { status: 500 }
    );
  }
}
