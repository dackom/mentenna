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

export default function NewAuthorPage() {
  const router = useRouter();

  const handleSubmit = async (data: AuthorFormData) => {
    try {
      const response = await fetch("/api/admin/authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create author");
      }

      toast.success("Author created successfully!");
      router.push("/admin/authors");
      router.refresh();
    } catch (error) {
      console.error("Error creating author:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create author"
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
          <CardTitle>Create New Author</CardTitle>
          <CardDescription>
            Add a new author to the database. Only the name is required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthorForm
            onSubmit={handleSubmit}
            onCancel={() => router.push("/admin/authors")}
            submitLabel="Create Author"
          />
        </CardContent>
      </Card>
    </div>
  );
}

