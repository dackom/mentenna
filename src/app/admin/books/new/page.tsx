"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Separator } from "@/components/ui/separator";
import type {
  Author,
  Genre1,
  Genre2,
  WritingStyle,
  Personality,
  AuthorWritingGenre,
  AuthorPersonality,
} from "@prisma/client";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

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

export default function BooksPage() {
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>("");
  const [expandAuthorDetails, setExpandAuthorDetails] =
    useState<boolean>(false);

  const {
    data: authors,
    error,
    isLoading,
  } = useSWR<AuthorWithRelations[]>("/api/admin/authors", fetcher);

  console.log(authors);
  const selectedAuthor = authors?.find(
    (author) => author.id === selectedAuthorId
  );

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
                    <div>
                      <div className="space-y-3">
                        {selectedAuthor.writingGenres.map((genre, index) => (
                          <div key={index} className="">
                            <h3 className="text-lg font-semibold mb-3">
                              Writes: {genre.writes}
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
                    <Label htmlFor="book-title">Subgenre</Label>
                    <Input id="subgenre" placeholder="Subgenre" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="book-title">Microtopic / tag</Label>
                    <Input id="microtopic" placeholder="Microtopic / tag" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="book-title">Reader avatar</Label>
                    <Textarea id="reader-avatar" placeholder="Reader avatar" />
                  </div>
                  <div className="flex justify-evenly gap-4">
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="book-title">Chapters</Label>
                      <Slider id="chapters" min={1} max={20} step={1} />
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="book-title">Word count per chapter</Label>
                      <Slider id="word-count" min={500} max={5000} step={100} />
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="book-title">Word count total</Label>
                      <Slider
                        id="word-count-total"
                        min={1000}
                        max={100000}
                        step={1000}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reading-grade">Reading grade</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reading grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
