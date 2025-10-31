"use client";

import { use } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AVAILABLE_MODELS } from "@/config/models";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Book = {
  id: string;
  title: string;
  synopsis: string;
  author: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  generationJob?: {
    model: string | null;
  } | null;
  bookChapters: Array<{
    id: string;
    chapterNumber: number;
    content: string;
  }>;
};

export default function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    data: book,
    error,
    isLoading,
  } = useSWR<Book>(`/api/admin/books/${id}`, fetcher);

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center py-16">
          <div className="text-lg">Loading book...</div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center py-16">
          <div className="text-lg text-red-500">
            {error?.message || "Book not found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-6">
        <Link href="/admin/books">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Books
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-3xl">{book.title}</CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-muted-foreground">By {book.author.name}</p>
            {book.generationJob?.model && (
              <Badge variant="outline">
                {AVAILABLE_MODELS.find(
                  (m) => m.id === book.generationJob?.model
                )?.name || book.generationJob.model}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-slate max-w-none">
            <h3 className="text-xl font-semibold mb-2">Synopsis</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {book.synopsis}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {book.bookChapters.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                No chapters available yet. The book is still being generated.
              </p>
            </CardContent>
          </Card>
        ) : (
          book.bookChapters.map((chapter, index) => (
            <Card key={chapter.id}>
              <CardHeader>
                <CardTitle>Chapter {chapter.chapterNumber}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-slate max-w-none whitespace-pre-wrap">
                  {chapter.content}
                </div>
              </CardContent>
              {index < book.bookChapters.length - 1 && (
                <div className="h-8 border-b" />
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
