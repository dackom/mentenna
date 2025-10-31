export interface ChapterContext {
  synopsis: string;
  chapterSummaries: Array<{
    chapterNumber: number;
    summary: string;
  }>;
  previousChapterEnding: string;
  authorPersona: string;
  genreInfo: {
    writes: string;
    genre1: string | null;
    genre2: string | null;
  };
  readingGrade: string;
  subgenre: string;
  microtopic: string;
  readerAvatar: string;
  bookTitle: string;
  wordsPerChapter: number;
}

export interface GenerationConfig {
  model: string;
  maxTokens: number;
  temperature: number;
}
