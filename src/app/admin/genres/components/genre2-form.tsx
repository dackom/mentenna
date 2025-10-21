"use client";

import { useState, useEffect } from "react";
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

const genre2Schema = z.object({
  name: z.string().min(1, "Name is required"),
  genre1Id: z.string().uuid("Invalid Genre1 selection"),
});

type Genre2FormData = z.infer<typeof genre2Schema>;

interface Genre2FormProps {
  defaultValues?: Genre2FormData;
  genre1Options: Array<{ id: string; name: string; writes: string }>;
  onSubmit: (data: Genre2FormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function Genre2Form({
  defaultValues,
  genre1Options,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: Genre2FormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<Genre2FormData>({
    resolver: zodResolver(genre2Schema),
    defaultValues: defaultValues || {
      name: "",
      genre1Id: "",
    },
  });

  const genre1Id = watch("genre1Id");

  const handleFormSubmit = async (data: Genre2FormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group genre1 options by writes
  const groupedOptions = genre1Options.reduce(
    (acc, option) => {
      if (!acc[option.writes]) {
        acc[option.writes] = [];
      }
      acc[option.writes].push(option);
      return acc;
    },
    {} as Record<string, typeof genre1Options>
  );

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="genre1Id">Parent Genre</Label>
        <Select
          value={genre1Id}
          onValueChange={(value) => setValue("genre1Id", value)}
        >
          <SelectTrigger id="genre1Id">
            <SelectValue placeholder="Select parent genre" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(groupedOptions).map(([writes, options]) => (
              <div key={writes}>
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                  {writes}
                </div>
                {options.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
        {errors.genre1Id && (
          <p className="text-sm text-red-500">{errors.genre1Id.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Sub-Genre Name</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="e.g., Contemporary romance, Hard science fiction"
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
