import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/book-drafts - List all drafts (all admins can see all drafts)
export async function GET() {
  try {
    const drafts = await prisma.bookDraft.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(drafts);
  } catch (error) {
    console.error("Error fetching book drafts:", error);
    return NextResponse.json(
      { error: "Failed to fetch book drafts" },
      { status: 500 }
    );
  }
}
