"use client";

import { Fragment, useState } from "react";
import { Genre1, Genre2 } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronDown,
  ChevronRight,
  EditIcon,
  Trash2Icon,
  PlusIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Genre1WithGenre2 = Genre1 & {
  genre2Options: Genre2[];
};

interface GenreTableProps {
  genres: Genre1WithGenre2[];
  onEditGenre1: (genre: Genre1) => void;
  onDeleteGenre1: (id: string) => Promise<void>;
  onAddGenre2: (genre1Id: string) => void;
  onEditGenre2: (genre: Genre2) => void;
  onDeleteGenre2: (id: string) => Promise<void>;
}

export function GenreTable({
  genres,
  onEditGenre1,
  onDeleteGenre1,
  onAddGenre2,
  onEditGenre2,
  onDeleteGenre2,
}: GenreTableProps) {
  const [expandedGenres, setExpandedGenres] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: "genre1" | "genre2";
    id: string;
    name: string;
  }>({ open: false, type: "genre1", id: "", name: "" });

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedGenres);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedGenres(newExpanded);
  };

  const handleDelete = async () => {
    if (deleteDialog.type === "genre1") {
      await onDeleteGenre1(deleteDialog.id);
    } else {
      await onDeleteGenre2(deleteDialog.id);
    }
    setDeleteDialog({ open: false, type: "genre1", id: "", name: "" });
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Genre Name</TableHead>
            <TableHead className="w-32">Sub-Genres</TableHead>
            <TableHead className="w-32 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {genres.map((genre1) => (
            <Fragment key={genre1.id}>
              <TableRow>
                <TableCell>
                  {genre1.genre2Options.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(genre1.id)}
                      className="h-6 w-6 p-0"
                    >
                      {expandedGenres.has(genre1.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </TableCell>
                <TableCell className="font-medium">{genre1.name}</TableCell>
                <TableCell>{genre1.genre2Options.length}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAddGenre2(genre1.id)}
                      title="Add sub-genre"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditGenre1(genre1)}
                      title="Edit genre"
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setDeleteDialog({
                          open: true,
                          type: "genre1",
                          id: genre1.id,
                          name: genre1.name,
                        })
                      }
                      title="Delete genre"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              {expandedGenres.has(genre1.id) &&
                genre1.genre2Options.map((genre2) => (
                  <TableRow key={genre2.id} className="bg-muted/50">
                    <TableCell></TableCell>
                    <TableCell className="pl-8">
                      <span className="text-muted-foreground">└─</span>{" "}
                      {genre2.name}
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditGenre2(genre2)}
                          title="Edit sub-genre"
                        >
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDeleteDialog({
                              open: true,
                              type: "genre2",
                              id: genre2.id,
                              name: genre2.name,
                            })
                          }
                          title="Delete sub-genre"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              {deleteDialog.type === "genre1" ? "the genre" : "the sub-genre"}{" "}
              <strong>{deleteDialog.name}</strong>
              {deleteDialog.type === "genre1" && " and all its sub-genres"}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
