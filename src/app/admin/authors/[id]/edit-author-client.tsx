"use client";

import { useRouter } from "next/navigation";
import { AuthorForm } from "@/components/author-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon } from "lucide-react";
import { toast } from "sonner";
import type { AuthorFormData } from "@/lib/validations/author";

interface EditAuthorClientProps {
  author: {
    id: string;
    name: string;
    continent?: string | null;
    field?: string | null;
    pronouns?: string | null;
    age?: string | null;
    location?: string | null;
    living?: string | null;
    writingStyle1Id?: string | null;
    writingStyle1?: { id: string; name: string } | null;
    writingStyle2Id?: string | null;
    writingStyle2?: { id: string; name: string } | null;
    ai_persona?: string | null;
    writingGenres?: Array<{
      id?: string;
      writes?: "Non-fiction" | "Fiction" | "Speculative" | null;
      genre_1?: string | null;
      genre_2?: string | null;
      genre_3?: string | null;
    }>;
    personalities?: Array<{
      personalityId: string;
      personality: {
        id: string;
        name: string;
      };
    }>;
  };
}

export function EditAuthorClient({ author }: EditAuthorClientProps) {
  const router = useRouter();

  const handleSubmit = async (data: AuthorFormData) => {
    try {
      const response = await fetch(`/api/authors/${author.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update author");
      }

      toast.success("Author updated successfully!");
      router.push("/admin/authors");
      router.refresh();
    } catch (error) {
      console.error("Error updating author:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update author"
      );
      throw error;
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <Button
        variant="ghost"
        onClick={() => router.push("/admin/authors")}
        className="mb-4"
      >
        <ChevronLeftIcon />
        Back to Authors
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Author</CardTitle>
          <CardDescription>
            Update the author information below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthorForm
            defaultValues={{
              name: author.name,
              continent: author.continent || "",
              field: author.field || "",
              pronouns: author.pronouns || "",
              age: author.age || "",
              location: author.location || "",
              living: author.living || "",
              personalityIds:
                author.personalities?.map((p) => p.personalityId) || [],
              writingStyle1Id: author.writingStyle1Id || "",
              writingStyle2Id: author.writingStyle2Id || "",
              ai_persona: author.ai_persona || "",
              writingGenres: author.writingGenres || [],
            }}
            onSubmit={handleSubmit}
            onCancel={() => router.push("/admin/authors")}
            submitLabel="Update Author"
          />
        </CardContent>
      </Card>
    </div>
  );
}
