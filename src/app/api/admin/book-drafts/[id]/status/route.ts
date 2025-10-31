import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Try to find by bookId first (if id is a book), then fallback to bookDraftId
    const book = await prisma.book.findFirst({
      where: {
        OR: [{ id }, { bookDraftId: id }],
      },
      include: {
        generationJob: true,
        bookChapters: {
          orderBy: {
            chapterNumber: "asc",
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const job = book.generationJob;
    const chapters = book.bookChapters;

    return NextResponse.json({
      status: job?.status || "no_job",
      currentChapter: job?.currentChapter || 0,
      totalChapters: job?.totalChapters || book.chapters,
      error: job?.errorMessage || null,
      bookStatus: book.status,
      chapters: chapters.map((ch) => ({
        chapterNumber: ch.chapterNumber,
        status: ch.status,
        wordCount: ch.wordCount,
        hasContent: !!ch.content,
      })),
    });
  } catch (error) {
    console.error("Error fetching book status:", error);
    return NextResponse.json(
      { error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}
