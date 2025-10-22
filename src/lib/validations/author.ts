import { z } from "zod";

const writesOptions = ["Non-fiction", "Fiction", "Speculative"] as const;

export const genreSchema = z.object({
  id: z.string().optional(),
  writes: z.enum(writesOptions).optional().nullable().or(z.literal("")),
  genre1Id: z.string().uuid().optional().nullable().or(z.literal("")),
  genre2Id: z.string().uuid().optional().nullable().or(z.literal("")),
  genre_3: z.string().optional().nullable().or(z.literal("")),
  // Legacy fields - keep for backwards compatibility during migration
  genre_1: z.string().optional().nullable().or(z.literal("")),
  genre_2: z.string().optional().nullable().or(z.literal("")),
});

export const authorSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  continent: z.string().optional().nullable().or(z.literal("")),
  field: z.string().optional().nullable().or(z.literal("")),
  pronouns: z.string().optional().nullable().or(z.literal("")),
  age: z.string().optional().nullable().or(z.literal("")),
  location: z.string().optional().nullable().or(z.literal("")),
  living: z.string().optional().nullable().or(z.literal("")),
  personalityIds: z.array(z.string().uuid()).optional().default([]),
  writingStyle1Id: z.string().uuid().optional().nullable().or(z.literal("")),
  writingStyle2Id: z.string().uuid().optional().nullable().or(z.literal("")),
  ai_persona: z.string().optional().nullable().or(z.literal("")),
  writingGenres: z.array(genreSchema).default([]),
});

export const authorUpdateSchema = authorSchema.partial().extend({
  writingGenres: z.array(genreSchema).optional(),
});

export type AuthorFormData = z.infer<typeof authorSchema>;
export type GenreFormData = z.infer<typeof genreSchema>;
