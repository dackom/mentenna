"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  authorSchema,
  type AuthorFormData,
  type GenreFormData,
} from "@/lib/validations/author";
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
import { Loader2Icon, PlusIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { MultiSelect } from "@/components/ui/multi-select";
import { Textarea } from "@/components/ui/textarea";
import { GenreManagementDialog } from "@/components/genre-management-dialog";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface AuthorFormProps {
  defaultValues?: Partial<AuthorFormData>;
  onSubmit: (data: AuthorFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function AuthorForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "Save Author",
}: AuthorFormProps) {
  const form = useForm<AuthorFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(authorSchema) as any,
    defaultValues: {
      name: defaultValues?.name || "",
      continent: defaultValues?.continent || "",
      field: defaultValues?.field || "",
      pronouns: defaultValues?.pronouns || "",
      age: defaultValues?.age || "",
      location: defaultValues?.location || "",
      living: defaultValues?.living || "",
      personalityIds: defaultValues?.personalityIds || [],
      writingStyle1Id: defaultValues?.writingStyle1Id || "",
      writingStyle2Id: defaultValues?.writingStyle2Id || "",
      ai_persona: defaultValues?.ai_persona || "",
      writingGenres: defaultValues?.writingGenres || [],
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  // State for dynamic genre rows
  const [genreRows, setGenreRows] = useState<GenreFormData[]>([
    {
      id: uuidv4(),
      writes: "",
      genre1Id: "",
      genre2Id: "",
      genre_3: "",
      genre_1: "",
      genre_2: "",
    },
  ]);

  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>(
    []
  );

  // Fetch writing styles using SWR
  const { data: writingStylesData, isLoading: loadingWritingStyles } = useSWR<{
    options: Array<{ id: string; name: string; group: string }>;
  }>("/api/genres?level=writing_styles", fetcher);

  const writingStyleOptions = writingStylesData?.options || [];

  // Fetch personalities using SWR
  const { data: personalitiesData, isLoading: loadingPersonalities } = useSWR<{
    options: Array<{ id: string; name: string }>;
  }>("/api/genres?level=personalities", fetcher);

  const personalityOptions = personalitiesData?.options || [];

  // State for AI persona generation
  const [generatingPersona, setGeneratingPersona] = useState(false);
  const [lastGenerationCost, setLastGenerationCost] = useState<{
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  } | null>(null);

  // Calculate cost in USD based on token usage
  // Pricing for gpt-3.5-turbo-16k: $3/M input tokens, $4/M output tokens
  const calculateCost = (usage: typeof lastGenerationCost): number | null => {
    if (!usage?.prompt_tokens || !usage?.completion_tokens) return null;

    const inputCost = (usage.prompt_tokens / 1_000_000) * 3.0;
    const outputCost = (usage.completion_tokens / 1_000_000) * 4.0;
    return inputCost + outputCost;
  };

  // State for genre options per row
  const [rowGenre1Options, setRowGenre1Options] = useState<
    Record<number, Array<{ id: string; name: string }>>
  >({});
  const [rowGenre2Options, setRowGenre2Options] = useState<
    Record<number, Array<{ id: string; name: string }>>
  >({});
  const [rowLoadingStates, setRowLoadingStates] = useState<
    Record<number, { genre1: boolean; genre2: boolean }>
  >({});

  // Sync genreRows with defaultValues when they change (for editing)
  useEffect(() => {
    if (
      defaultValues?.writingGenres &&
      defaultValues.writingGenres.length > 0
    ) {
      // Map the genres and ensure IDs are properly extracted from relations
      const mappedGenres = defaultValues.writingGenres.map((genre) => ({
        ...genre,
        // Extract IDs from genre relations if they exist
        genre1Id: genre.genre1Id || (genre as any).genre1?.id || "",
        genre2Id: genre.genre2Id || (genre as any).genre2?.id || "",
      }));
      setGenreRows(mappedGenres);
    }
  }, [defaultValues?.writingGenres]);

  // Sync personalities when defaultValues change (for editing)
  useEffect(() => {
    if (defaultValues?.personalityIds) {
      setSelectedPersonalities(defaultValues.personalityIds);
    } else {
      setSelectedPersonalities([]);
    }
  }, [defaultValues]);

  // Helper functions to fetch genre options for a specific row
  const fetchGenre1Options = async (rowIndex: number, writes: string) => {
    setRowLoadingStates((prev) => ({
      ...prev,
      [rowIndex]: { ...prev[rowIndex], genre1: true },
    }));
    try {
      const data = await fetcher(
        `/api/genres?level=genre_1&writes=${encodeURIComponent(writes)}`
      );
      setRowGenre1Options((prev) => ({
        ...prev,
        [rowIndex]: data.options || [],
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setRowLoadingStates((prev) => ({
        ...prev,
        [rowIndex]: { ...prev[rowIndex], genre1: false },
      }));
    }
  };

  const fetchGenre2Options = async (rowIndex: number, genre1Id: string) => {
    setRowLoadingStates((prev) => ({
      ...prev,
      [rowIndex]: { ...prev[rowIndex], genre2: true },
    }));
    try {
      const data = await fetcher(
        `/api/genres?level=genre_2&genre1Id=${encodeURIComponent(genre1Id)}`
      );
      setRowGenre2Options((prev) => ({
        ...prev,
        [rowIndex]: data.options || [],
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setRowLoadingStates((prev) => ({
        ...prev,
        [rowIndex]: { ...prev[rowIndex], genre2: false },
      }));
    }
  };

  // Initialize genre options for existing rows on mount
  useEffect(() => {
    const initGenres = defaultValues?.writingGenres;
    if (initGenres) {
      initGenres.forEach((genre, index) => {
        if (genre.writes) {
          fetchGenre1Options(index, genre.writes);
          // Extract genre1Id from either the direct field or the relation
          const genre1Id = genre.genre1Id || (genre as any).genre1?.id;
          if (genre1Id) {
            fetchGenre2Options(index, genre1Id);
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues?.writingGenres]);

  // Functions to manage genre rows
  const addGenreRow = () => {
    setGenreRows([
      ...genreRows,
      {
        id: uuidv4(),
        writes: "",
        genre1Id: "",
        genre2Id: "",
        genre_3: "",
        genre_1: "",
        genre_2: "",
      },
    ]);
  };

  const removeGenreRow = (index: number) => {
    setGenreRows(genreRows.filter((_, i) => i !== index));
    // Clean up options state for this row
    const newGenre1 = { ...rowGenre1Options };
    const newGenre2 = { ...rowGenre2Options };
    const newLoading = { ...rowLoadingStates };
    delete newGenre1[index];
    delete newGenre2[index];
    delete newLoading[index];
    setRowGenre1Options(newGenre1);
    setRowGenre2Options(newGenre2);
    setRowLoadingStates(newLoading);
  };

  const updateGenreRow = (
    index: number,
    field: keyof GenreFormData,
    value: string
  ) => {
    const updated = [...genreRows];
    updated[index] = { ...updated[index], [field]: value };

    // Handle cascading resets
    if (field === "writes") {
      updated[index].genre1Id = "";
      updated[index].genre2Id = "";
      updated[index].genre_3 = "";
      updated[index].genre_1 = "";
      updated[index].genre_2 = "";
      setRowGenre2Options((prev) => ({ ...prev, [index]: [] }));
      if (value) {
        fetchGenre1Options(index, value);
      }
    } else if (field === "genre1Id") {
      updated[index].genre2Id = "";
      updated[index].genre_3 = "";
      updated[index].genre_2 = "";
      if (value) {
        fetchGenre2Options(index, value);
      }
    } else if (field === "genre2Id") {
      updated[index].genre_3 = "";
    }

    setGenreRows(updated);
  };

  const handleFormSubmit = async (
    data: Omit<AuthorFormData, "writingGenres" | "personalityIds">
  ) => {
    // Include genre rows in submission
    const filteredGenres = genreRows.filter(
      (row) => row.writes || row.genre1Id || row.genre2Id || row.genre_3
    );

    const submissionData: AuthorFormData = {
      ...data,
      personalityIds: selectedPersonalities,
      writingGenres: filteredGenres,
    };
    await onSubmit(submissionData);
  };

  const handleGeneratePersona = async () => {
    setGeneratingPersona(true);
    try {
      // Get current form values
      const formValues = form.getValues();

      const response = await fetch("/api/generate-persona", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formValues.name,
          pronouns: formValues.pronouns,
          age: formValues.age,
          continent: formValues.continent,
          location: formValues.location,
          field: formValues.field,
          writingGenres: genreRows,
          personalityIds: selectedPersonalities,
          writingStyle1Id: formValues.writingStyle1Id,
          writingStyle2Id: formValues.writingStyle2Id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate persona");
      }

      const data = await response.json();

      // Set the generated persona in the form
      form.setValue("ai_persona", data.persona);

      // Store usage information if available
      if (data.usage) {
        setLastGenerationCost(data.usage);
      }
    } catch (error) {
      console.error("Error generating persona:", error);
      alert("Failed to generate AI persona. Please try again.");
    } finally {
      setGeneratingPersona(false);
    }
  };

  return (
    <form
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSubmit={handleSubmit(handleFormSubmit as (data: any) => Promise<void>)}
      className="space-y-6"
    >
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Basic Information
        </h3>

        <div className="space-y-2">
          <Label htmlFor="name">
            Author Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            {...register("name")}
            aria-invalid={!!errors.name}
            placeholder="Enter author name"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pronouns">Pronouns</Label>
            <Input
              id="pronouns"
              {...register("pronouns")}
              placeholder="e.g., he/him, she/her, they/them"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              {...register("age")}
              placeholder="e.g., 45, 30s, elderly"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="continent">Continent</Label>
            <Input
              id="continent"
              {...register("continent")}
              placeholder="e.g., Europe, Asia, North America"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              {...register("location")}
              placeholder="e.g., New York, Paris, Tokyo"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="field">Field</Label>
          <Input
            id="field"
            {...register("field")}
            placeholder="e.g., Literature, Science, Philosophy"
          />
        </div>
      </div>

      {/* Writing Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="living">Living</Label>
          <Input
            id="living"
            {...register("living")}
            placeholder="e.g., Currently living, Deceased"
          />
        </div>

        <div className="flex justify-between items-center mt-12 mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Writing Genres
          </h3>
          <GenreManagementDialog
            onGenresUpdated={() => {
              // Refresh genre options for all rows
              genreRows.forEach((row, index) => {
                if (row.writes) {
                  fetchGenre1Options(index, row.writes);
                  if (row.genre1Id) {
                    fetchGenre2Options(index, row.genre1Id);
                  }
                }
              });
            }}
          />
        </div>

        <div className="space-y-4">
          {genreRows.map((row, index) => (
            <div key={row.id || index} className="flex gap-2 items-end">
              <div className="grid gap-2 md:grid-cols-4 flex-1">
                <div className="space-y-2">
                  <Label htmlFor={`writes-${index}`}>Writes</Label>
                  <Select
                    value={row.writes || ""}
                    onValueChange={(value) =>
                      updateGenreRow(
                        index,
                        "writes",
                        value as "Non-fiction" | "Fiction" | "Speculative"
                      )
                    }
                  >
                    <SelectTrigger id={`writes-${index}`} className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Non-fiction">Non-fiction</SelectItem>
                      <SelectItem value="Fiction">Fiction</SelectItem>
                      <SelectItem value="Speculative">Speculative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`genre_1-${index}`}>Primary genre</Label>
                  <Select
                    value={row.genre1Id || ""}
                    onValueChange={(value) =>
                      updateGenreRow(index, "genre1Id", value)
                    }
                    disabled={!row.writes}
                  >
                    <SelectTrigger id={`genre_1-${index}`} className="w-full">
                      <SelectValue
                        placeholder={
                          !row.writes
                            ? "Select 'Writes' first"
                            : rowLoadingStates[index]?.genre1
                              ? "Loading..."
                              : rowGenre1Options[index]?.length === 0
                                ? "No genres"
                                : "Select genre"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(rowGenre1Options[index] || []).length === 0 ? (
                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                          No genres available
                        </div>
                      ) : (
                        (rowGenre1Options[index] || []).map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`genre_2-${index}`}>Secondary genre</Label>
                  <Select
                    value={row.genre2Id || ""}
                    onValueChange={(value) =>
                      updateGenreRow(index, "genre2Id", value)
                    }
                    disabled={!row.genre1Id}
                  >
                    <SelectTrigger id={`genre_2-${index}`} className="w-full">
                      <SelectValue
                        placeholder={
                          !row.genre1Id
                            ? "Select Genre 1"
                            : rowLoadingStates[index]?.genre2
                              ? "Loading..."
                              : rowGenre2Options[index]?.length === 0
                                ? "No sub-genres"
                                : "Select sub-genre"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(rowGenre2Options[index] || []).length === 0 ? (
                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                          No sub-genres available
                        </div>
                      ) : (
                        (rowGenre2Options[index] || []).map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`genre_3-${index}`}>Subgenre</Label>
                  <Input
                    id={`genre_3-${index}`}
                    value={row.genre_3 || ""}
                    onChange={(e) =>
                      updateGenreRow(index, "genre_3", e.target.value)
                    }
                    placeholder="Enter subgenre"
                  />
                </div>
              </div>

              {genreRows.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeGenreRow(index)}
                  className="mb-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <XIcon className="size-4" />
                </Button>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addGenreRow}
            className="w-full"
          >
            <PlusIcon className="size-4 mr-2" />
            Add more genres
          </Button>
        </div>
      </div>

      {/* Style & Persona */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-12">
          Style & Persona
        </h3>

        <div className="space-y-2">
          <Label htmlFor="personality">Personality Traits</Label>
          <MultiSelect
            options={personalityOptions}
            selected={selectedPersonalities}
            onChange={setSelectedPersonalities}
            placeholder={
              loadingPersonalities
                ? "Loading personalities..."
                : "Select personality traits"
            }
            disabled={loadingPersonalities}
          />
          <p className="text-xs text-muted-foreground">
            Select one or more personality traits that describe the author
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="writingStyle1Id">Writing Style 1</Label>
            <Select
              value={form.watch("writingStyle1Id") || ""}
              onValueChange={(value) => form.setValue("writingStyle1Id", value)}
              disabled={loadingWritingStyles}
            >
              <SelectTrigger id="writingStyle1Id" className="w-full">
                <SelectValue
                  placeholder={
                    loadingWritingStyles
                      ? "Loading..."
                      : writingStyleOptions.length === 0
                        ? "No styles available"
                        : "Select writing style"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {writingStyleOptions.length === 0 ? (
                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                    No writing styles available
                  </div>
                ) : (
                  writingStyleOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      [{option.group}] {option.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="writingStyle2Id">Writing Style 2</Label>
            <Select
              value={form.watch("writingStyle2Id") || ""}
              onValueChange={(value) => form.setValue("writingStyle2Id", value)}
              disabled={loadingWritingStyles}
            >
              <SelectTrigger id="writingStyle2Id" className="w-full">
                <SelectValue
                  placeholder={
                    loadingWritingStyles
                      ? "Loading..."
                      : writingStyleOptions.length === 0
                        ? "No styles available"
                        : "Select writing style"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {writingStyleOptions.length === 0 ? (
                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                    No writing styles available
                  </div>
                ) : (
                  writingStyleOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      [{option.group}] {option.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai_persona">
            AI Persona{" "}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGeneratePersona}
              disabled={generatingPersona}
              title="Generate AI Persona"
            >
              {generatingPersona ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                "Generate AI Persona"
              )}
            </Button>
          </Label>
          <Textarea
            id="ai_persona"
            {...register("ai_persona")}
            placeholder="AI persona description"
            rows={6}
          />
          {lastGenerationCost && (
            <p className="text-xs text-muted-foreground">
              Last generation: {lastGenerationCost.total_tokens || 0} tokens
              {lastGenerationCost.prompt_tokens &&
                lastGenerationCost.completion_tokens && (
                  <>
                    {" "}
                    ({lastGenerationCost.prompt_tokens} prompt +{" "}
                    {lastGenerationCost.completion_tokens} completion)
                  </>
                )}
              {calculateCost(lastGenerationCost) !== null && (
                <>
                  <br />• Cost estimate: $
                  {calculateCost(lastGenerationCost)!.toFixed(6)} (might be
                  completely wrong, do not rely on this)
                </>
              )}
            </p>
          )}
          {errors.ai_persona && (
            <p className="text-sm text-destructive">
              {errors.ai_persona.message}
            </p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2Icon className="animate-spin" />}
          {submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
