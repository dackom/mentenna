"use client";

import { useState } from "react";
import { Genre1, Genre2 } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenreTable } from "./components/genre-table";
import { Genre1Form } from "./components/genre1-form";
import { Genre2Form } from "./components/genre2-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

type Genre1WithGenre2 = Genre1 & {
  genre2Options: Genre2[];
};

type DialogState =
  | { open: false }
  | { open: true; type: "genre1"; mode: "create"; data: null }
  | { open: true; type: "genre1"; mode: "edit"; data: Genre1 }
  | { open: true; type: "genre2"; mode: "create"; data: { genre1Id: string } }
  | {
      open: true;
      type: "genre2";
      mode: "edit";
      data: Genre2 & { genre1Id: string };
    };

export default function GenresPage() {
  const { data, isLoading, mutate } = useSWR<{ genres: Genre1WithGenre2[] }>(
    "/api/admin/genres/genre1",
    fetcher,
    {
      onError: (error) => {
        toast.error("Failed to load genres");
        console.error(error);
      },
    }
  );
  const [dialog, setDialog] = useState<DialogState>({ open: false });
  const [activeTab, setActiveTab] = useState<string>("Fiction");

  const genres = data?.genres || [];

  const handleCreateGenre1 = async (data: { name: string; writes: string }) => {
    try {
      const response = await fetch("/api/admin/genres/genre1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create genre");

      toast.success("Genre created successfully");
      setDialog({ open: false });
      mutate();
    } catch (error) {
      toast.error("Failed to create genre");
      console.error(error);
    }
  };

  const handleUpdateGenre1 = async (
    id: string,
    data: { name: string; writes: string }
  ) => {
    try {
      const response = await fetch(`/api/admin/genres/genre1/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update genre");

      toast.success("Genre updated successfully");
      setDialog({ open: false });
      mutate();
    } catch (error) {
      toast.error("Failed to update genre");
      console.error(error);
    }
  };

  const handleDeleteGenre1 = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/genres/genre1/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete genre");

      toast.success("Genre deleted successfully");
      mutate();
    } catch (error) {
      toast.error("Failed to delete genre");
      console.error(error);
    }
  };

  const handleCreateGenre2 = async (data: {
    name: string;
    genre1Id: string;
    readingGrade?: string;
    chapterCount?: string;
    wordCount?: string;
    price?: string;
  }) => {
    try {
      const response = await fetch("/api/admin/genres/genre2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create sub-genre");

      toast.success("Sub-genre created successfully");
      setDialog({ open: false });
      mutate();
    } catch (error) {
      toast.error("Failed to create sub-genre");
      console.error(error);
    }
  };

  const handleUpdateGenre2 = async (
    id: string,
    data: {
      name: string;
      readingGrade?: string;
      chapterCount?: string;
      wordCount?: string;
      price?: string;
    }
  ) => {
    try {
      const response = await fetch(`/api/admin/genres/genre2/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update sub-genre");

      toast.success("Sub-genre updated successfully");
      setDialog({ open: false });
      mutate();
    } catch (error) {
      toast.error("Failed to update sub-genre");
      console.error(error);
    }
  };

  const handleDeleteGenre2 = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/genres/genre2/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete sub-genre");

      toast.success("Sub-genre deleted successfully");
      mutate();
    } catch (error) {
      toast.error("Failed to delete sub-genre");
      console.error(error);
    }
  };

  const filteredGenres = genres.filter((g) => g.writes === activeTab);

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container py-8 ">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Genre Management
          </h1>
          <p className="text-muted-foreground">
            Manage your genres and sub-genres
          </p>
        </div>
        <Button
          onClick={() =>
            setDialog({
              open: true,
              type: "genre1",
              mode: "create",
              data: null,
            })
          }
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Genre
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="Fiction">Fiction</TabsTrigger>
          <TabsTrigger value="Non-fiction">Non-fiction</TabsTrigger>
          <TabsTrigger value="Speculative">Speculative</TabsTrigger>
        </TabsList>

        <Card className="py-2 px-2 pt-0">
          <CardContent className="p-0">
            {["Fiction", "Non-fiction", "Speculative"].map((category) => (
              <TabsContent key={category} value={category} className="mt-4">
                <GenreTable
                  genres={filteredGenres}
                  onEditGenre1={(genre) =>
                    setDialog({
                      open: true,
                      type: "genre1",
                      mode: "edit",
                      data: genre,
                    })
                  }
                  onDeleteGenre1={handleDeleteGenre1}
                  onAddGenre2={(genre1Id) =>
                    setDialog({
                      open: true,
                      type: "genre2",
                      mode: "create",
                      data: { genre1Id },
                    })
                  }
                  onEditGenre2={(genre) =>
                    setDialog({
                      open: true,
                      type: "genre2",
                      mode: "edit",
                      data: { ...genre, genre1Id: genre.genre1Id },
                    })
                  }
                  onDeleteGenre2={handleDeleteGenre2}
                />
              </TabsContent>
            ))}
          </CardContent>
        </Card>
      </Tabs>

      <Dialog
        open={dialog.open}
        onOpenChange={(open) => !open && setDialog({ open: false })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog.open && dialog.type === "genre1"
                ? dialog.mode === "create"
                  ? "Add Genre"
                  : "Edit Genre"
                : dialog.open && dialog.type === "genre2"
                  ? dialog.mode === "create"
                    ? "Add Genre"
                    : "Edit Genre"
                  : ""}
            </DialogTitle>
          </DialogHeader>

          {dialog.open && dialog.type === "genre1" && (
            <Genre1Form
              defaultValues={
                dialog.mode === "edit"
                  ? {
                      name: dialog.data.name,
                      writes: dialog.data.writes as
                        | "Fiction"
                        | "Non-fiction"
                        | "Speculative",
                    }
                  : {
                      name: "",
                      writes: activeTab as
                        | "Fiction"
                        | "Non-fiction"
                        | "Speculative",
                    }
              }
              onSubmit={(data) =>
                dialog.mode === "create"
                  ? handleCreateGenre1(data)
                  : handleUpdateGenre1(dialog.data.id, data)
              }
              onCancel={() => setDialog({ open: false })}
            />
          )}

          {dialog.open && dialog.type === "genre2" && (
            <Genre2Form
              defaultValues={
                dialog.mode === "edit"
                  ? {
                      name: dialog.data.name,
                      genre1Id: dialog.data.genre1Id,
                      readingGrade: dialog.data.readingGrade || "",
                      chapterCount: dialog.data.chapterCount || "",
                      wordCount: dialog.data.wordCount || "",
                      price: dialog.data.price || "",
                    }
                  : {
                      name: "",
                      genre1Id: dialog.data.genre1Id,
                      readingGrade: "",
                      chapterCount: "",
                      wordCount: "",
                      price: "",
                    }
              }
              genre1Options={genres.map((g) => ({
                id: g.id,
                name: g.name,
                writes: g.writes,
              }))}
              onSubmit={(data) =>
                dialog.mode === "create"
                  ? handleCreateGenre2(data)
                  : handleUpdateGenre2(dialog.data.id, data)
              }
              onCancel={() => setDialog({ open: false })}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
