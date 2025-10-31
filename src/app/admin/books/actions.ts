"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export async function saveBookDraft(data: {
  draftId?: string | null;
  authorId: string;
  selectedGenreId: string | null;
  chapters: number;
  wordCountTotal: number;
  readingGrade: string;
  subgenre: string;
  microtopic: string;
  readerAvatar: string;
  bookTitle: string;
  bookSynopsis: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: "Unauthorized", data: null };
    }

    if (data.draftId) {
      // Update existing draft
      const draft = await prisma.bookDraft.update({
        where: {
          id: data.draftId,
        },
        data: {
          authorId: data.authorId,
          selectedGenreId: data.selectedGenreId,
          chapters: data.chapters,
          wordCountTotal: data.wordCountTotal,
          readingGrade: data.readingGrade,
          subgenre: data.subgenre,
          microtopic: data.microtopic,
          readerAvatar: data.readerAvatar,
          bookTitle: data.bookTitle,
          bookSynopsis: data.bookSynopsis,
        },
      });

      return { error: null, data: { id: draft.id } };
    } else {
      // Create new draft
      const draft = await prisma.bookDraft.create({
        data: {
          id: uuidv4(),
          userId: session.user.id,
          authorId: data.authorId,
          selectedGenreId: data.selectedGenreId,
          chapters: data.chapters,
          wordCountTotal: data.wordCountTotal,
          readingGrade: data.readingGrade,
          subgenre: data.subgenre,
          microtopic: data.microtopic,
          readerAvatar: data.readerAvatar,
          bookTitle: data.bookTitle,
          bookSynopsis: data.bookSynopsis,
        },
      });

      return { error: null, data: { id: draft.id } };
    }
  } catch (error) {
    console.error("Error saving book draft:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to save draft",
      data: null,
    };
  }
}

export async function deleteBookDraft(draftId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    await prisma.bookDraft.delete({
      where: {
        id: draftId,
      },
    });

    return { error: null };
  } catch (error) {
    console.error("Error deleting book draft:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to delete draft",
    };
  }
}

export async function startBookGeneration(draftId: string, model: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { error: "Unauthorized", data: null };
    }

    // Ensure BookDraft exists
    const draft = await prisma.bookDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft) {
      return { error: "Book draft not found", data: null };
    }

    // Note: Multiple books can be generated from the same draft
    // Each generation creates a new Book and BookGenerationJob record

    // Create Book record from draft data
    const book = await prisma.book.create({
      data: {
        id: uuidv4(),
        bookDraftId: draftId,
        userId: draft.userId,
        authorId: draft.authorId,
        selectedGenreId: draft.selectedGenreId,
        title: draft.bookTitle,
        synopsis: draft.bookSynopsis,
        chapters: draft.chapters,
        wordCountTotal: draft.wordCountTotal,
        readingGrade: draft.readingGrade,
        subgenre: draft.subgenre,
        microtopic: draft.microtopic,
        readerAvatar: draft.readerAvatar,
        status: "generating",
      },
    });

    // Create BookGenerationJob with status "pending"
    const job = await prisma.bookGenerationJob.create({
      data: {
        id: uuidv4(),
        bookId: book.id,
        model: model,
        status: "pending",
        currentChapter: 0,
        totalChapters: draft.chapters,
      },
    });

    return { error: null, data: { bookId: book.id, jobId: job.id } };
  } catch (error) {
    console.error("Error starting book generation:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to start generation",
      data: null,
    };
  }
}
