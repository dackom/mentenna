import { prisma } from "./db";
import type { ChapterContext, GenerationConfig } from "./types";

export async function buildChapterPrompt(
  bookId: string,
  chapterNumber: number
): Promise<string> {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      author: {
        include: {
          writingGenres: {
            include: {
              genre1: true,
              genre2: true,
            },
          },
        },
      },
      bookChapters: {
        where: {
          chapterNumber: {
            lt: chapterNumber,
          },
          status: "completed",
        },
        orderBy: {
          chapterNumber: "asc",
        },
      },
    },
  });

  if (!book) {
    throw new Error(`Book ${bookId} not found`);
  }

  const selectedGenre = book.author.writingGenres.find(
    (g) => g.id === book.selectedGenreId
  );

  // Build chapter summaries
  const chapterSummaries = book.bookChapters
    .map((ch) => `Chapter ${ch.chapterNumber}: ${ch.summary}`)
    .join("\n");

  // Get previous chapter ending (last paragraph)
  const previousChapter = book.bookChapters
    .filter((ch) => ch.chapterNumber === chapterNumber - 1)
    .pop();

  const previousChapterEnding = previousChapter
    ? extractLastParagraph(previousChapter.content)
    : "";

  const wordsPerChapter = Math.floor(book.wordCountTotal / book.chapters);

  return `You are writing a book as if it was written by an AI writer.

Book Title: ${book.title}

Book Synopsis:
${book.synopsis}

AI Writer Avatar's Personality: ${book.author.ai_persona || "Not specified"}

Writing Style: ${selectedGenre?.genre1?.writes || "Not specified"}
Primary Genre: ${selectedGenre?.genre1?.name || "Not specified"}
Secondary Genre: ${selectedGenre?.genre2?.name || "Not specified"}

Focus on Subgenre: ${book.subgenre}
Addressing Topics Like: ${book.microtopic}

Reader Avatar: ${book.readerAvatar}

Reading Level: Grade ${book.readingGrade}

${chapterSummaries ? `\nPrevious Chapters Summary:\n${chapterSummaries}\n` : ""}

${previousChapterEnding ? `\nPrevious Chapter Ending (Chapter ${chapterNumber - 1}):\n${previousChapterEnding}\n` : ""}

Now write Chapter ${chapterNumber}:
- Approximately ${wordsPerChapter} words
${chapterNumber === 1 ? "- This is the opening chapter of the book" : "- Continue the story naturally from where the previous chapter ended"}
- Follow the book's synopsis and maintain consistency with previous chapters
- Maintain the writing style and tone established in earlier chapters
- Ensure the chapter is appropriate for Grade ${book.readingGrade} reading level`;
}

function extractLastParagraph(content: string): string {
  const paragraphs = content
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0);
  return paragraphs[paragraphs.length - 1] || "";
}

export async function generateChapter(
  prompt: string,
  config: GenerationConfig
): Promise<{ content: string; usage?: any }> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Mentenna",
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("OpenRouter API error:", errorData);
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  if (!content) {
    throw new Error("No content generated");
  }

  return {
    content,
    usage: data.usage,
  };
}

export async function generateChapterSummary(
  chapterContent: string,
  config: GenerationConfig
): Promise<string> {
  const summaryPrompt = `Please provide a concise summary (approximately 200 words) of the following chapter:

${chapterContent}

Summary:`;

  const result = await generateChapter(summaryPrompt, {
    ...config,
    maxTokens: 500, // Smaller token limit for summary
  });

  return result.content;
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}
