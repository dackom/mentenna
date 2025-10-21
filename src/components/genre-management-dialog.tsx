"use client";

import { useState, useEffect } from "react";
import { Genre1, Genre2 } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Genre1Form } from "@/app/admin/genres/components/genre1-form";
import { Genre2Form } from "@/app/admin/genres/components/genre2-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusIcon, SettingsIcon } from "lucide-react";
import { toast } from "sonner";

type Genre1WithGenre2 = Genre1 & {
  genre2Options: Genre2[];
};

interface GenreManagementDialogProps {
  trigger?: React.ReactNode;
  onGenresUpdated?: () => void;
}

export function GenreManagementDialog({
  trigger,
  onGenresUpdated,
}: GenreManagementDialogProps) {
  const [open, setOpen] = useState(false);
  const [genres, setGenres] = useState<Genre1WithGenre2[]>([]);
  const [activeTab, setActiveTab] = useState<"genre1" | "genre2">("genre1");
  const [showForm, setShowForm] = useState(false);

  const fetchGenres = async () => {
    try {
      const response = await fetch("/api/admin/genres/genre1");
      if (!response.ok) throw new Error("Failed to fetch genres");
      const data = await response.json();
      setGenres(data.genres);
    } catch (error) {
      toast.error("Failed to load genres");
      console.error(error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchGenres();
    }
  }, [open]);

  const handleCreateGenre1 = async (data: { name: string; writes: string }) => {
    try {
      const response = await fetch("/api/admin/genres/genre1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create genre");

      toast.success("Genre created successfully");
      setShowForm(false);
      fetchGenres();
      onGenresUpdated?.();
    } catch (error) {
      toast.error("Failed to create genre");
      console.error(error);
    }
  };

  const handleCreateGenre2 = async (data: {
    name: string;
    genre1Id: string;
  }) => {
    try {
      const response = await fetch("/api/admin/genres/genre2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create sub-genre");

      toast.success("Sub-genre created successfully");
      setShowForm(false);
      fetchGenres();
      onGenresUpdated?.();
    } catch (error) {
      toast.error("Failed to create sub-genre");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <SettingsIcon className="mr-2 h-4 w-4" />
            Manage Genres
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Genre Management</DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "genre1" | "genre2")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="genre1">Genres</TabsTrigger>
            <TabsTrigger value="genre2">Sub-Genres</TabsTrigger>
          </TabsList>

          <TabsContent value="genre1" className="space-y-4">
            {!showForm ? (
              <>
                <Button
                  onClick={() => setShowForm(true)}
                  size="sm"
                  className="w-full"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Genre
                </Button>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {["Fiction", "Non-fiction", "Speculative"].map((writes) => (
                      <div key={writes}>
                        <h3 className="font-semibold mb-2">{writes}</h3>
                        <div className="space-y-1 mb-4">
                          {genres
                            .filter((g) => g.writes === writes)
                            .map((genre) => (
                              <div
                                key={genre.id}
                                className="text-sm p-2 rounded bg-muted"
                              >
                                {genre.name}
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({genre.genre2Options.length} sub-genres)
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <Genre1Form
                onSubmit={handleCreateGenre1}
                onCancel={() => setShowForm(false)}
                submitLabel="Create Genre"
              />
            )}
          </TabsContent>

          <TabsContent value="genre2" className="space-y-4">
            {!showForm ? (
              <>
                <Button
                  onClick={() => setShowForm(true)}
                  size="sm"
                  className="w-full"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Sub-Genre
                </Button>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {genres.map((genre1) => (
                      <div key={genre1.id}>
                        <h3 className="font-semibold text-sm mb-1">
                          {genre1.name}
                          <span className="text-xs text-muted-foreground ml-2">
                            ({genre1.writes})
                          </span>
                        </h3>
                        <div className="space-y-1 mb-3 ml-4">
                          {genre1.genre2Options.map((genre2) => (
                            <div
                              key={genre2.id}
                              className="text-sm p-2 rounded bg-muted"
                            >
                              {genre2.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <Genre2Form
                genre1Options={genres.map((g) => ({
                  id: g.id,
                  name: g.name,
                  writes: g.writes,
                }))}
                onSubmit={handleCreateGenre2}
                onCancel={() => setShowForm(false)}
                submitLabel="Create Sub-Genre"
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
