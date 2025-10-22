"use client";

import { useEffect, useState } from "react";
import { WritingStyle } from "@prisma/client";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

type DialogState =
  | { open: false }
  | { open: true; mode: "create"; data: null }
  | { open: true; mode: "edit"; data: WritingStyle };

export default function WritingStylesPage() {
  const { data, isLoading, mutate } = useSWR<{ writingStyles: WritingStyle[] }>(
    "/api/admin/writing-styles",
    fetcher,
    {
      onError: (error) => {
        toast.error("Failed to load writing styles");
        console.error(error);
      },
    }
  );
  const [dialog, setDialog] = useState<DialogState>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    writingStyle: WritingStyle | null;
  }>({ open: false, writingStyle: null });
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const writingStyles = data?.writingStyles || [];

  useEffect(() => {
    if (dialog.open && dialog.mode === "edit") {
      setFormData({
        name: dialog.data.name,
        description: dialog.data.description,
      });
    } else {
      setFormData({ name: "", description: "" });
    }
  }, [dialog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (dialog.open && dialog.mode === "create") {
        const response = await fetch("/api/admin/writing-styles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create writing style");
        }

        toast.success("Writing style created successfully");
      } else if (dialog.open && dialog.mode === "edit") {
        const response = await fetch(
          `/api/admin/writing-styles/${dialog.data.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update writing style");
        }

        toast.success("Writing style updated successfully");
      }

      setDialog({ open: false });
      mutate();
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.writingStyle) return;

    try {
      const response = await fetch(
        `/api/admin/writing-styles/${deleteDialog.writingStyle.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete writing style");

      toast.success("Writing style deleted successfully");
      setDeleteDialog({ open: false, writingStyle: null });
      mutate();
    } catch (error) {
      toast.error("Failed to delete writing style");
      console.error(error);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="container py-8 ">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Writing Style Management
          </h1>
          <p className="text-muted-foreground">Manage writing styles</p>
        </div>
        <Button
          onClick={() => setDialog({ open: true, mode: "create", data: null })}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Writing Style
        </Button>
      </div>

      <Card className="py-2 px-2 pt-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {writingStyles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    No writing styles found
                  </TableCell>
                </TableRow>
              ) : (
                writingStyles.map((writingStyle) => (
                  <TableRow key={writingStyle.id}>
                    <TableCell className="font-medium">
                      {writingStyle.name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {writingStyle.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setDialog({
                              open: true,
                              mode: "edit",
                              data: writingStyle,
                            })
                          }
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setDeleteDialog({ open: true, writingStyle })
                          }
                        >
                          <TrashIcon className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialog.open}
        onOpenChange={(open) => !open && setDialog({ open: false })}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialog.open && dialog.mode === "create"
                ? "Add Writing Style"
                : "Edit Writing Style"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Writing Style Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Expository, Descriptive, Narrative"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the writing style and how to apply it..."
                required
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialog({ open: false })}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Saving..."
                  : dialog.open && dialog.mode === "create"
                    ? "Create"
                    : "Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ open: false, writingStyle: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the writing style &quot;
              {deleteDialog.writingStyle?.name}&quot;. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
