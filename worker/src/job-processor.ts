import { prisma } from "./db";
import {
  buildChapterPrompt,
  generateChapter,
  generateChapterSummary,
  countWords,
} from "./chapter-generator";
import { v4 as uuidv4 } from "uuid";

const DEFAULT_MAX_TOKENS = 12000;
const DEFAULT_TEMPERATURE = 0.7;
// Fallback model - should not be needed as all jobs should have model specified
// This is only used if job.model is null and env var is not set
const FALLBACK_MODEL = process.env.MODEL || "openai/gpt-4o-mini";

export async function processJob(jobId: string) {
  const job = await prisma.bookGenerationJob.findUnique({
    where: { id: jobId },
    include: {
      book: {
        include: {
          author: true,
        },
      },
    },
  });

  if (!job) {
    console.error(`Job ${jobId} not found`);
    return;
  }

  if (job.status !== "pending") {
    console.log(`Job ${jobId} is not pending (status: ${job.status})`);
    return;
  }

  // Update status to processing
  await prisma.bookGenerationJob.update({
    where: { id: jobId },
    data: {
      status: "processing",
      startedAt: new Date(),
    },
  });

  console.log(`Started processing job ${jobId} for book ${job.bookId}`);

  // Use model from job (required), with fallbacks only for legacy jobs
  if (!job.model) {
    console.error(
      `Job ${jobId} has no model specified. This should not happen. Using fallback: ${FALLBACK_MODEL}`
    );
  }
  const model = job.model || FALLBACK_MODEL;
  console.log(`Using model: ${model}`);

  const config = {
    model,
    maxTokens: DEFAULT_MAX_TOKENS,
    temperature: DEFAULT_TEMPERATURE,
  };

  try {
    // Process chapters sequentially
    for (
      let chapterNumber = job.currentChapter + 1;
      chapterNumber <= job.totalChapters;
      chapterNumber++
    ) {
      console.log(
        `Generating chapter ${chapterNumber}/${job.totalChapters} for job ${jobId}`
      );

      // Create chapter record with pending status
      const chapter = await prisma.bookChapter.upsert({
        where: {
          bookId_chapterNumber: {
            bookId: job.bookId,
            chapterNumber,
          },
        },
        update: {
          status: "generating",
        },
        create: {
          id: uuidv4(),
          bookId: job.bookId,
          chapterNumber,
          content: "",
          summary: "",
          wordCount: 0,
          status: "generating",
        },
      });

      try {
        // Build prompt with context
        const prompt = await buildChapterPrompt(job.bookId, chapterNumber);

        // Generate chapter
        const { content, usage } = await generateChapter(prompt, config);
        const wordCount = countWords(content);

        // Generate summary
        console.log(`Generating summary for chapter ${chapterNumber}`);
        const summary = await generateChapterSummary(content, config);

        // Update chapter with content
        await prisma.bookChapter.update({
          where: { id: chapter.id },
          data: {
            content,
            summary,
            wordCount,
            status: "completed",
          },
        });

        // Update job progress
        await prisma.bookGenerationJob.update({
          where: { id: jobId },
          data: {
            currentChapter: chapterNumber,
          },
        });

        console.log(
          `Completed chapter ${chapterNumber}/${job.totalChapters} (${wordCount} words)`
        );
      } catch (error) {
        console.error(`Error generating chapter ${chapterNumber}:`, error);
        await prisma.bookChapter.update({
          where: { id: chapter.id },
          data: {
            status: "failed",
            errorMessage:
              error instanceof Error ? error.message : "Unknown error",
          },
        });

        // Mark job as failed
        await prisma.bookGenerationJob.update({
          where: { id: jobId },
          data: {
            status: "failed",
            errorMessage: `Failed at chapter ${chapterNumber}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        });

        // Update book status to failed
        await prisma.book.update({
          where: { id: job.bookId },
          data: {
            status: "failed",
          },
        });

        throw error; // Stop processing
      }
    }

    // Mark job as completed
    await prisma.bookGenerationJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    });

    // Update book status to completed
    await prisma.book.update({
      where: { id: job.bookId },
      data: {
        status: "completed",
      },
    });

    console.log(`Successfully completed job ${jobId}`);
  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);
    // Job status already updated in error handler above
  }
}

export async function findPendingJob(): Promise<string | null> {
  const job = await prisma.bookGenerationJob.findFirst({
    where: {
      status: "pending",
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return job?.id || null;
}
