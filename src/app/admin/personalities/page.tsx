"use client";

import { useEffect, useState } from "react";
import { Personality } from "@prisma/client";
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
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

type DialogState =
  | { open: false }
  | { open: true; mode: "create"; data: null }
  | { open: true; mode: "edit"; data: Personality };

export default function PersonalitiesPage() {
  const { data, isLoading, mutate } = useSWR<{ personalities: Personality[] }>(
    "/api/admin/personalities",
    fetcher,
    {
      onError: (error) => {
        toast.error("Failed to load personalities");
        console.error(error);
      },
    }
  );
  const [dialog, setDialog] = useState<DialogState>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    personality: Personality | null;
  }>({ open: false, personality: null });
  const [formData, setFormData] = useState({ name: "" });
  const [submitting, setSubmitting] = useState(false);

  const personalities = data?.personalities || [];

  useEffect(() => {
    if (dialog.open && dialog.mode === "edit") {
      setFormData({ name: dialog.data.name });
    } else {
      setFormData({ name: "" });
    }
  }, [dialog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (dialog.open && dialog.mode === "create") {
        const response = await fetch("/api/admin/personalities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create personality");
        }

        toast.success("Personality created successfully");
      } else if (dialog.open && dialog.mode === "edit") {
        const response = await fetch(
          `/api/admin/personalities/${dialog.data.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update personality");
        }

        toast.success("Personality updated successfully");
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
    if (!deleteDialog.personality) return;

    try {
      const response = await fetch(
        `/api/admin/personalities/${deleteDialog.personality.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete personality");

      toast.success("Personality deleted successfully");
      setDeleteDialog({ open: false, personality: null });
      mutate();
    } catch (error) {
      toast.error("Failed to delete personality");
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
            Personality Management
          </h1>
          <p className="text-muted-foreground">Manage author personalities</p>
        </div>
        <Button
          onClick={() => setDialog({ open: true, mode: "create", data: null })}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Personality
        </Button>
      </div>

      <Card className="py-2 px-2 pt-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personalities.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="text-center text-muted-foreground"
                  >
                    No personalities found
                  </TableCell>
                </TableRow>
              ) : (
                personalities.map((personality) => (
                  <TableRow key={personality.id}>
                    <TableCell>{personality.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setDialog({
                              open: true,
                              mode: "edit",
                              data: personality,
                            })
                          }
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setDeleteDialog({ open: true, personality })
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog.open && dialog.mode === "create"
                ? "Add Personality"
                : "Edit Personality"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Personality Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Analytical, Romantic, Compassionate"
                required
                autoFocus
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
          !open && setDeleteDialog({ open: false, personality: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the personality &quot;
              {deleteDialog.personality?.name}&quot;. This action cannot be
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
