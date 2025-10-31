"use client";

import { Button } from "@/components/ui/button";
import { PlusIcon, PencilIcon, TrashIcon, BookOpen } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { deleteBookDraft } from "./actions";
import { toast } from "sonner";
import { AVAILABLE_MODELS } from "@/config/models";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type BookDraft = {
  id: string;
  authorId: string;
  author: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  bookTitle: string;
  createdAt: string;
  updatedAt: string;
};

type Book = {
  id: string;
  title: string;
  status: string;
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
    status: string;
    currentChapter: number;
    totalChapters: number;
    model: string | null;
  } | null;
  bookChapters: Array<{
    id: string;
    chapterNumber: number;
    status: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export default function BooksPage() {
  const [deletingDraftId, setDeletingDraftId] = useState<string | null>(null);
  const {
    data: drafts,
    error: draftsError,
    isLoading: draftsLoading,
    mutate: mutateDrafts,
  } = useSWR<BookDraft[]>("/api/admin/book-drafts", fetcher);
  const {
    data: books,
    error: booksError,
    isLoading: booksLoading,
  } = useSWR<Book[]>("/api/admin/books", fetcher, {
    refreshInterval: 10000, // Refresh every 10 seconds
  });

  const handleDelete = async (draftId: string) => {
    try {
      const result = await deleteBookDraft(draftId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Draft deleted successfully!");
        mutateDrafts();
        setDeletingDraftId(null);
      }
    } catch (error) {
      console.error("Error deleting draft:", error);
      toast.error("Failed to delete draft");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "generating":
        return <Badge variant="secondary">Generating</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProgress = (book: Book) => {
    const completedChapters = book.bookChapters.filter(
      (ch) => ch.status === "completed"
    ).length;
    const totalChapters = book.generationJob?.totalChapters || 0;
    const percentage =
      totalChapters > 0
        ? Math.round((completedChapters / totalChapters) * 100)
        : 0;
    return { completedChapters, totalChapters, percentage };
  };

  const getModelName = (modelId: string | null | undefined) => {
    if (!modelId) return "Unknown";
    const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
    return model?.name || modelId;
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Books</h1>
          <p className="text-muted-foreground mt-1">
            Generate and manage books
          </p>
        </div>
        <Link href="/admin/books/new">
          <Button>
            <PlusIcon />
            Generate Book
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="generated" className="mt-6">
        <TabsList>
          <TabsTrigger value="generated">Generated</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
        </TabsList>

        <TabsContent value="generated">
          {booksLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-lg">Loading books...</div>
            </div>
          )}

          {booksError && (
            <div className="text-red-500">
              Error loading books: {booksError.message}
            </div>
          )}

          {!booksLoading && !booksError && (
            <Card className="py-2 px-2 pt-0 mt-4">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!books || books.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-muted-foreground"
                        >
                          No generated books found
                        </TableCell>
                      </TableRow>
                    ) : (
                      books.map((book) => {
                        const progress = getProgress(book);
                        return (
                          <TableRow key={book.id}>
                            <TableCell className="font-medium  whitespace-break-spaces">
                              {book.title || "Untitled"}
                            </TableCell>
                            <TableCell>{book.author.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getModelName(book.generationJob?.model)}
                              </Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(book.status)}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span className="text-sm">
                                  {progress.completedChapters} /{" "}
                                  {progress.totalChapters} chapters
                                </span>
                                <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${progress.percentage}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {progress.percentage}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{book.user.name}</TableCell>
                            <TableCell>
                              {new Date(book.updatedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Link href={`/admin/books/${book.id}`}>
                                <Button variant="outline" size="sm">
                                  <BookOpen className="h-4 w-4 mr-2" />
                                  Read
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="drafts">
          {draftsLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-lg">Loading drafts...</div>
            </div>
          )}

          {draftsError && (
            <div className="text-red-500">
              Error loading drafts: {draftsError.message}
            </div>
          )}

          {!draftsLoading && !draftsError && (
            <Card className="py-2 px-2 pt-0 mt-4">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!drafts || drafts.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground"
                        >
                          No drafts found
                        </TableCell>
                      </TableRow>
                    ) : (
                      drafts.map((draft) => (
                        <TableRow key={draft.id}>
                          <TableCell className="whitespace-break-spaces">
                            {draft.bookTitle || "Untitled"}
                          </TableCell>
                          <TableCell>{draft.author.name}</TableCell>
                          <TableCell>{draft.user.name}</TableCell>
                          <TableCell>
                            {new Date(draft.updatedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Link href={`/admin/books/new?id=${draft.id}`}>
                                <Button variant="outline" size="sm">
                                  <PencilIcon className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                              </Link>
                              <AlertDialog
                                open={deletingDraftId === draft.id}
                                onOpenChange={(open) =>
                                  !open && setDeletingDraftId(null)
                                }
                              >
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setDeletingDraftId(draft.id)}
                                  >
                                    <TrashIcon className="h-4 w-4 mr-2" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Are you sure?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will
                                      permanently delete the draft.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(draft.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
