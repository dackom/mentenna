"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DeleteAuthorDialog } from "@/components/delete-author-dialog";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";

type Author = {
  id: string;
  name: string;
  continent?: string | null;
  field?: string | null;
  pronouns?: string | null;
  age?: string | null;
  location?: string | null;
  living?: string | null;
  personality?: string | null;
  writing_style_1?: string | null;
  writing_style_2?: string | null;
  ai_persona?: string | null;
  writingGenres?: Array<{
    id: string;
    writes?: "Non-fiction" | "Fiction" | "Speculative" | null;
    genre1?: { id: string; name: string } | null;
    genre2?: { id: string; name: string } | null;
    genre_3?: string | null;
    // Legacy fields for backwards compatibility
    genre_1?: string | null;
    genre_2?: string | null;
  }>;
  createdAt: Date;
};

interface AuthorsClientProps {
  initialAuthors: Author[];
}

export function AuthorsClient({ initialAuthors }: AuthorsClientProps) {
  const router = useRouter();
  const [deletingAuthor, setDeletingAuthor] = React.useState<Author | null>(
    null
  );

  const handleDelete = async () => {
    if (!deletingAuthor) return;

    try {
      const response = await fetch(`/api/authors/${deletingAuthor.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete author");
      }

      toast.success("Author deleted successfully!");
      router.refresh();
    } catch (error) {
      console.error("Error deleting author:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete author"
      );
      throw error;
    }
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Authors</h1>
          <p className="text-muted-foreground">
            Manage your authors and their information
          </p>
        </div>
        <Button onClick={() => router.push("/admin/authors/new")}>
          <PlusIcon />
          Add Author
        </Button>
      </div>

      <Card className="py-2 px-2">
        <CardContent className="p-0">
          {initialAuthors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No authors found. Create your first author to get started.
              </p>
              <Button onClick={() => router.push("/admin/authors/new")}>
                <PlusIcon />
                Create First Author
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Personalities</TableHead>
                    <TableHead>Writes</TableHead>
                    <TableHead>Genre</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialAuthors.map((author) => (
                    <TableRow key={author.id}>
                      <TableCell className="font-medium">
                        {author.name}
                      </TableCell>
                      <TableCell>
                        {author.personality ? (
                          <div className="flex gap-1 flex-wrap items-center">
                            {(() => {
                              const personalities = author.personality
                                .split(";")
                                .filter((p) => p.trim());
                              const firstPersonality = personalities[0]?.trim();
                              const remainingCount = personalities.length - 1;

                              return (
                                <>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {firstPersonality}
                                  </Badge>
                                  {remainingCount > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      +{remainingCount}
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {author.writingGenres &&
                        author.writingGenres.length > 0 ? (
                          <div className="flex gap-1 flex-wrap items-center">
                            <Badge variant="secondary">
                              {author.writingGenres[0].writes}
                            </Badge>
                            {author.writingGenres.length > 1 && (
                              <span className="text-xs text-muted-foreground">
                                +{author.writingGenres.length - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {author.writingGenres &&
                        author.writingGenres.length > 0 ? (
                          (() => {
                            const firstGenre = author.writingGenres[0];
                            // Use new genre relations or fall back to legacy string fields
                            const genre1Name =
                              firstGenre.genre1?.name || firstGenre.genre_1;
                            const genre2Name =
                              firstGenre.genre2?.name || firstGenre.genre_2;

                            if (!genre1Name) {
                              return (
                                <span className="text-muted-foreground">—</span>
                              );
                            }

                            return (
                              <div className="flex gap-1 flex-wrap items-center">
                                <Badge variant="outline" className="text-xs">
                                  {genre1Name}
                                </Badge>
                                {genre2Name && (
                                  <Badge variant="outline" className="text-xs">
                                    {genre2Name}
                                  </Badge>
                                )}
                                {author.writingGenres.length > 1 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{author.writingGenres.length - 1}
                                  </span>
                                )}
                              </div>
                            );
                          })()
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              router.push(`/admin/authors/${author.id}`)
                            }
                          >
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeletingAuthor(author)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <TrashIcon className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {deletingAuthor && (
        <DeleteAuthorDialog
          open={!!deletingAuthor}
          onOpenChange={(open) => !open && setDeletingAuthor(null)}
          authorName={deletingAuthor.name}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
