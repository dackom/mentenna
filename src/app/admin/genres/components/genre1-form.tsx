"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2Icon } from "lucide-react";

const genre1Schema = z.object({
  name: z.string().min(1, "Name is required"),
  writes: z.enum(["Fiction", "Non-fiction", "Speculative"]),
});

type Genre1FormData = z.infer<typeof genre1Schema>;

interface Genre1FormProps {
  defaultValues?: Genre1FormData;
  onSubmit: (data: Genre1FormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function Genre1Form({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: Genre1FormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<Genre1FormData>({
    resolver: zodResolver(genre1Schema),
    defaultValues: defaultValues || {
      name: "",
      writes: "Fiction",
    },
  });

  const writes = watch("writes");

  const handleFormSubmit = async (data: Genre1FormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="writes">Category</Label>
        <Select
          value={writes}
          onValueChange={(value) =>
            setValue(
              "writes",
              value as "Fiction" | "Non-fiction" | "Speculative"
            )
          }
        >
          <SelectTrigger id="writes">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Fiction">Fiction</SelectItem>
            <SelectItem value="Non-fiction">Non-fiction</SelectItem>
            <SelectItem value="Speculative">Speculative</SelectItem>
          </SelectContent>
        </Select>
        {errors.writes && (
          <p className="text-sm text-red-500">{errors.writes.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Genre Name</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="e.g., Romance, Science fiction"
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && (
            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
          )}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
