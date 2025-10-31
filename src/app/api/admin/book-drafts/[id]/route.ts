import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/book-drafts/[id] - Get single draft
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const draft = await prisma.bookDraft.findUnique({
      where: {
        id,
      },
      include: {
        author: true,
      },
    });

    if (!draft) {
      return NextResponse.json(
        { error: "Draft not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(draft);
  } catch (error) {
    console.error("Error fetching book draft:", error);
    return NextResponse.json(
      { error: "Failed to fetch book draft" },
      { status: 500 }
    );
  }
}
