"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type {
  Author,
  Genre1,
  Genre2,
  WritingStyle,
  Personality,
  AuthorWritingGenre,
  AuthorPersonality,
} from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import GenerativeTextarea from "@/components/generative-textarea";
import { saveBookDraft, startBookGeneration } from "../actions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AVAILABLE_MODELS } from "@/config/models";

// Type for Author with all relations included (matches API response)
type AuthorWithRelations = Author & {
  writingGenres: (AuthorWritingGenre & {
    genre1: Genre1 | null;
    genre2: Genre2 | null;
  })[];
  personalities: (AuthorPersonality & {
    personality: Personality;
  })[];
  writingStyle1: WritingStyle | null;
  writingStyle2: WritingStyle | null;
  updatedAt: Date;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function GenerateBooksPage() {
  const searchParams = useSearchParams();
  const [draftId, setDraftId] = useState<string | null>(null);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>("");
  const [expandAuthorDetails, setExpandAuthorDetails] =
    useState<boolean>(false);
  const [selectedGenreId, setSelectedGenreId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<number>(10);
  const [wordCountTotal, setWordCountTotal] = useState<number>(0);
  const [readingGrade, setReadingGrade] = useState<string>("");
  const [subgenre, setSubgenre] = useState<string>("");
  const [microtopic, setMicrotopic] = useState<string>("");
  const [selectedGenre, setSelectedGenre] = useState<any | null>(null);
  const [readerAvatar, setReaderAvatar] = useState<string>("");
  const [bookTitle, setBookTitle] = useState<string>("");
  const [bookSynopsis, setBookSynopsis] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>(
    AVAILABLE_MODELS[0]?.id || ""
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const {
    data: authors,
    error,
    isLoading,
  } = useSWR<AuthorWithRelations[]>("/api/admin/authors", fetcher);

  const selectedAuthor = authors?.find(
    (author) => author.id === selectedAuthorId
  );

  // Save draft function
  const saveDraft = useCallback(
    async (immediate = false) => {
      if (!selectedAuthorId) return;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      const performSave = async () => {
        setIsSaving(true);
        try {
          const result = await saveBookDraft({
            draftId,
            authorId: selectedAuthorId,
            selectedGenreId,
            chapters,
            wordCountTotal,
            readingGrade,
            subgenre,
            microtopic,
            readerAvatar,
            bookTitle,
            bookSynopsis,
          });

          if (result.error) {
            console.error("Error saving draft:", result.error);
            toast.error("Failed to save draft");
          } else if (result.data?.id) {
            setDraftId(result.data.id);
            if (immediate) {
              toast.success("Draft saved successfully!");
            }
          }
        } finally {
          setIsSaving(false);
        }
      };

      if (immediate) {
        await performSave();
        return;
      }

      // Debounce save by 500ms
      saveTimeoutRef.current = setTimeout(performSave, 500);
    },
    [
      draftId,
      selectedAuthorId,
      selectedGenreId,
      chapters,
      wordCountTotal,
      readingGrade,
      subgenre,
      microtopic,
      readerAvatar,
      bookTitle,
      bookSynopsis,
    ]
  );

  // Load draft from query param
  useEffect(() => {
    const draftIdFromQuery = searchParams.get("id");
    if (draftIdFromQuery && draftIdFromQuery !== draftId) {
      fetch(`/api/admin/book-drafts/${draftIdFromQuery}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setDraftId(data.id);
            setSelectedAuthorId(data.authorId);
            setSelectedGenreId(data.selectedGenreId);
            setChapters(data.chapters);
            setWordCountTotal(data.wordCountTotal);
            setReadingGrade(data.readingGrade || "");
            setSubgenre(data.subgenre || "");
            setMicrotopic(data.microtopic || "");
            setReaderAvatar(data.readerAvatar || "");
            setBookTitle(data.bookTitle || "");
            setBookSynopsis(data.bookSynopsis || "");
          }
        })
        .catch((error) => {
          console.error("Error loading draft:", error);
        });
    }
  }, [searchParams, draftId]);

  // Update selectedGenre when genre is selected
  useEffect(() => {
    if (selectedAuthor && selectedGenreId) {
      const genre = selectedAuthor.writingGenres.find(
        (g) => g.id === selectedGenreId
      );
      if (genre) {
        setSelectedGenre(genre);
      }
    }
  }, [selectedAuthor, selectedGenreId]);

  // Auto-save on field changes
  useEffect(() => {
    if (selectedAuthorId) {
      saveDraft();
    }
    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    selectedAuthorId,
    selectedGenreId,
    chapters,
    wordCountTotal,
    readingGrade,
    subgenre,
    microtopic,
    readerAvatar,
    bookTitle,
    bookSynopsis,
    saveDraft,
  ]);

  if (isLoading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Generate New Book</h1>
        <div className="flex items-center justify-center py-8">
          <div className="text-lg">Loading authors...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Generate New Book</h1>
        <div className="text-red-500">
          Error loading authors: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Generate New Book by </h1>
        <Select value={selectedAuthorId} onValueChange={setSelectedAuthorId}>
          <SelectTrigger className="">
            <SelectValue placeholder="Select an author..." />
          </SelectTrigger>
          <SelectContent>
            {authors?.map((author) => (
              <SelectItem key={author.id} value={author.id}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage
                      src={
                        process.env.NEXT_PUBLIC_AVATAR_URL_PREFIX +
                          `/api/avatars/${author.image}` || ""
                      }
                    />
                    <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {author.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-6">
        {/* Selected Author Details */}
        {selectedAuthor && (
          <>
            <Card className="gap-0">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={`${process.env.NEXT_PUBLIC_AVATAR_URL_PREFIX}/api/avatars/${selectedAuthor.image}`}
                    />
                    <AvatarFallback className="text-lg">
                      {selectedAuthor.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">
                      {selectedAuthor.name}
                    </CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setExpandAuthorDetails(!expandAuthorDetails)}
                  >
                    {expandAuthorDetails ? (
                      <ChevronUpIcon className="w-4 h-4" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "transition-all duration-300 flex flex-col gap-6",
                    expandAuthorDetails
                      ? "h-auto opacity-100"
                      : "h-0 opacity-0 overflow-hidden "
                  )}
                >
                  <div>
                    <div>
                      <strong>Pronouns:</strong> {selectedAuthor.pronouns}
                    </div>
                    <div>
                      <strong>Age:</strong> {selectedAuthor.age}
                    </div>
                    <div>
                      <strong>Location:</strong> {selectedAuthor.location}
                    </div>
                    <div>
                      <strong>Continent:</strong> {selectedAuthor.continent}
                    </div>
                    <div>
                      <strong>Field:</strong> {selectedAuthor.field}
                    </div>
                    <div>
                      <strong>Living:</strong> {selectedAuthor.living}
                    </div>
                  </div>

                  {/* Writing Genres */}
                  {selectedAuthor.writingGenres.length > 0 && (
                    <div className="">
                      <div className="space-y-2">
                        {selectedAuthor.writingGenres.map((genre, index) => (
                          <div key={index} className="border p-2 rounded-md">
                            <h3 className="text-lg font-semibold mb-3">
                              {genre.writes}
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {genre.genre1 && (
                                <Badge>{genre.genre1.name}</Badge>
                              )}
                              {genre.genre2 && (
                                <Badge variant="secondary">
                                  {genre.genre2.name}
                                </Badge>
                              )}
                              {genre.genre_3 && (
                                <Badge variant="outline">{genre.genre_3}</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Writing Styles */}
                  {(selectedAuthor.writingStyle1 ||
                    selectedAuthor.writingStyle2) && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">
                        Writing Styles
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedAuthor.writingStyle1 && (
                          <Badge variant="default">
                            {selectedAuthor.writingStyle1.name}
                          </Badge>
                        )}
                        {selectedAuthor.writingStyle2 && (
                          <Badge variant="default">
                            {selectedAuthor.writingStyle2.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Personalities */}
                  {selectedAuthor.personalities.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">
                        Personalities
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedAuthor.personalities.map((personality) => (
                          <Badge
                            key={personality.personality.id}
                            variant="outline"
                          >
                            {personality.personality.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">AI Persona</h3>
                    <div>{selectedAuthor.ai_persona}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Book options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="book-title">Pick a genre:</Label>
                    {selectedAuthor.writingGenres.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedAuthor.writingGenres.map((genre, index) => (
                          <div
                            key={index}
                            className={cn(
                              "border p-2 rounded-md cursor-pointer",
                              selectedGenreId === genre.id
                                ? "bg-primary/80 text-primary-foreground"
                                : ""
                            )}
                            onClick={() => {
                              setSelectedGenreId(genre.id);
                              setChapters(
                                parseInt(
                                  genre.genre2?.chapterCount?.split("-")[0] ||
                                    "10"
                                )
                              );
                              setWordCountTotal(
                                parseInt(
                                  genre.genre2?.wordCount?.split("-")[0] ||
                                    "10000"
                                )
                              );
                              setReadingGrade(
                                genre.genre2?.readingGrade || "N/A"
                              );
                              setSelectedGenre(genre);
                            }}
                          >
                            <h3 className="text-lg font-semibold mb-3">
                              {genre.writes}
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {genre.genre1 && (
                                <Badge>{genre.genre1.name}</Badge>
                              )}
                              {genre.genre2 && (
                                <Badge variant="secondary">
                                  {genre.genre2.name}
                                </Badge>
                              )}
                              {genre.genre_3 && (
                                <Badge variant="outline">{genre.genre_3}</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="book-title">Subgenre</Label>
                      <Input
                        id="subgenre"
                        placeholder="Subgenre"
                        value={subgenre}
                        onChange={(e) => setSubgenre(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="book-title">Microtopic / tag</Label>
                      <Input
                        id="microtopic"
                        placeholder="Microtopic / tag"
                        value={microtopic}
                        onChange={(e) => setMicrotopic(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 w-1/4">
                      <Label htmlFor="book-title">Reading grade</Label>
                      <Input
                        id="reading-grade"
                        placeholder="Reading grade"
                        value={readingGrade}
                        onChange={(e) => setReadingGrade(e.target.value)}
                      />
                      <span className="text-muted-foreground text-sm">
                        (suggested:{" "}
                        {selectedGenre?.genre2?.readingGrade || "N/A"})
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-evenly gap-4">
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="book-title">Chapters - {chapters}</Label>
                      <Slider
                        id="chapters"
                        min={1}
                        max={60}
                        step={1}
                        value={[chapters]}
                        onValueChange={(value) => setChapters(value[0])}
                      />
                      <span className="text-muted-foreground text-sm">
                        (suggested:{" "}
                        {selectedGenre?.genre2?.chapterCount || "N/A"})
                      </span>
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="book-title">
                        Word count total - {wordCountTotal}
                      </Label>
                      <Slider
                        id="word-count-total"
                        min={10000}
                        max={200000}
                        step={1000}
                        value={[wordCountTotal]}
                        onValueChange={(value) => setWordCountTotal(value[0])}
                      />
                      <span className="text-muted-foreground text-sm">
                        (suggested: {selectedGenre?.genre2?.wordCount || "N/A"})
                      </span>
                    </div>
                  </div>
                  <GenerativeTextarea
                    value={readerAvatar}
                    setValue={setReaderAvatar}
                    onAccept={saveDraft}
                    label="Reader avatar"
                    prompt={`Create an ideal very specific reader avatar based on:

- AI writer avatar personality: ${selectedAuthor.ai_persona}

- Writing style: ${selectedGenre?.writes}

- Primary genre: ${selectedGenre?.genre1?.name} 

- Secondary genre: ${selectedGenre?.genre2?.name}

- Subgenre: ${subgenre}

- Microtopic / tag: ${microtopic}

- Reading grade: ${readingGrade}

With an idea who would be the absolute best fit for reading this book so that the entire book and direct response copy on the book sales page is written specifically for them and they can easily find it and identify.

Return only the avatar, no other text.
`}
                  />

                  <GenerativeTextarea
                    value={bookTitle}
                    setValue={setBookTitle}
                    onAccept={saveDraft}
                    label="Book title"
                    prompt={`Create an appealing, click bait style title of the book that this reader avatar will immediately identify with and desire to buy based on: 

- AI writer avatar personality: ${selectedAuthor.ai_persona}

- Reader avatar ${readerAvatar}

- Writing style ${selectedGenre?.writes}

- Primary genre ${selectedGenre?.genre1?.name}

- Secondary genre ${selectedGenre?.genre2?.name}

- Subgenre ${subgenre}

- Microtopic ${microtopic}

- Reading grade ${readingGrade}

Return only the title, no other text.
`}
                  />

                  <GenerativeTextarea
                    value={bookSynopsis}
                    setValue={setBookSynopsis}
                    onAccept={saveDraft}
                    label="Book synopsis"
                    prompt={`Create a book synopsis that acts as a direct responce copy, directed to the reader avatar directly with an intention of them buying the book immediately, that they will quickly identify with, giving them a sense of urgency to buy the book. In the synopsis, have a SEO optimization in mind and write in a way that optimizes for all search intents connected to this writer avatar, book topic etc. and possible long tale phrases around those terms for:

- Writer avatar: ${selectedAuthor.ai_persona}

- Writing style: ${selectedGenre?.writes}

- Primary genre: ${selectedGenre?.genre1?.name}

- Secondary genre: ${selectedGenre?.genre2?.name}

- Subgenre: ${subgenre}

- Microtopic: ${microtopic}

- Reader avatar: ${readerAvatar}

- Book title: ${bookTitle}

Return only the synopsis, no other text.

`}
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6 flex justify-between">
                <Button
                  onClick={() => saveDraft(true)}
                  disabled={!selectedAuthorId || isSaving}
                  variant="outline"
                >
                  {isSaving ? "Saving..." : "Save Draft"}
                </Button>
                <Dialog
                  open={isGenerateDialogOpen}
                  onOpenChange={setIsGenerateDialogOpen}
                >
                  <DialogTrigger>
                    <Button>Generate Book</Button>
                  </DialogTrigger>
                  <DialogContent className="w-[90vw] !max-w-[90vw] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{bookTitle}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="model-select">Select Model</Label>
                        <Select
                          value={selectedModel}
                          onValueChange={setSelectedModel}
                        >
                          <SelectTrigger id="model-select" className="mt-2">
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABLE_MODELS.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {model.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {model.description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Final book prompt:</Label>
                        <Textarea
                          className="mt-2 max-h-[50vh] overflow-y-auto"
                          value={`Write a book as if it was written by 

- AI writer avatar's personality: ${selectedAuthor.ai_persona}

- Book title: ${bookTitle}

- Book synopsis: ${bookSynopsis}

- Using a writing style: ${selectedGenre?.writes}

- Using a (Primary genre): ${selectedGenre?.genre1?.name} 

- And a (Secondary genre): ${selectedGenre?.genre2?.name} 

- Focus on (Subgenre): ${subgenre}

- Addressing topics like: (Microtopic/tag): ${microtopic} 

- With a Reader avatar in mind: ${readerAvatar}

- Writing in a way that is understandable for a Grade ${readingGrade} level  

- And generate a book that will have ${chapters} chapters

- Each chapter consisting of a minimum of ${wordCountTotal / chapters} words

- And a total word count of minimum ${wordCountTotal} words`}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={async () => {
                          if (!draftId) {
                            toast.error("Please save the draft first");
                            return;
                          }
                          if (!selectedModel) {
                            toast.error("Please select a model");
                            return;
                          }
                          const result = await startBookGeneration(
                            draftId,
                            selectedModel
                          );
                          if (result.error) {
                            toast.error(result.error);
                          } else {
                            toast.success("Book generation started!");
                            setIsGenerateDialogOpen(false);
                            router.push(`/admin/books`);
                          }
                        }}
                      >
                        Generate Book
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
