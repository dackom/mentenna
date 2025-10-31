import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/admin/books - List all generated books
export async function GET() {
  try {
    const books = await prisma.book.findMany({
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
        generationJob: {
          select: {
            status: true,
            currentChapter: true,
            totalChapters: true,
            model: true,
          },
        },
        bookChapters: {
          select: {
            id: true,
            chapterNumber: true,
            status: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}
