import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const AVAILABLE_MODELS = [
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "$0.15/M input tokens | $0.60/M output tokens",
    provider: "OpenAI",
  },
  {
    id: "google/gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    description: "$0.10/M input tokens | $0.40/M output tokens",
    provider: "Google",
  },
  {
    id: "deepseek/deepseek-chat-v3-0324",
    name: "DeepSeek Chat v3.0324",
    description: "$0.24/M input tokens | $0.84/M output tokens",
    provider: "DeepSeek",
  },
  {
    id: "x-ai/grok-4-fast",
    name: "Grok 4 Fast",
    description: "$0.20/M input tokens | $0.50/M output tokens",
    provider: "xAI",
  },
];

export default function GenerativeTextarea({
  label,
  prompt,
  value,
  setValue,
}: {
  label: string;
  prompt: string;
  value: string;
  setValue: (value: string) => void;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [state, setState] = useState<"idle" | "generating" | "generated">(
    "idle"
  );
  const [responses, setResponses] = useState<
    {
      response: string;
      loading: boolean;
      error: string | null;
      model: string;
    }[]
  >([]);

  useEffect(() => {
    setGeneratedPrompt(prompt);
  }, [prompt]);

  const toggleModel = (modelId: string) => {
    setSelectedModels((prev) => {
      if (prev.includes(modelId)) {
        return prev.filter((id) => id !== modelId);
      }
      return [...prev, modelId];
    });
  };

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(selectedModels, generatedPrompt);
    // Initialize responses placeholders so responses.map has items to render
    setResponses(
      selectedModels.map(() => ({
        response: "",
        loading: true,
        error: null,
        model: "",
      }))
    );
    const promises = selectedModels.map(async (modelId, index) => {
      try {
        const response = await fetch("/api/admin/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: generatedPrompt, model: modelId }),
        });

        if (!response.ok) throw new Error("Failed to generate response");

        const data = await response.json();

        setResponses((prev) =>
          prev.map((r, i) =>
            i === index
              ? { ...r, response: data.text, loading: false, model: modelId }
              : r
          )
        );
        console.log("responses", responses);
      } catch {
        setResponses((prev) =>
          prev.map((r, i) =>
            i === index
              ? { ...r, loading: false, error: "Failed to generate response" }
              : r
          )
        );
      }
    });

    setState("generating");
    await Promise.all(promises);
    setState("generated");
  };

  useEffect(() => {
    setState("idle");
    setResponses([]);
    setGeneratedPrompt(prompt);
    setSelectedModels([]);
  }, [isDialogOpen]);

  return (
    <div className="space-y-2">
      <div className="flex  gap-2">
        <Label>{label}</Label>
        <Button
          onClick={() => setIsDialogOpen(true)}
          size="sm"
          className="gap-2 p-0 text-xs"
        >
          <Sparkles className="h-4 w-4" />
          Generate Response
        </Button>
      </div>
      <Textarea value={value} onChange={(e) => setValue(e.target.value)} />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {state === "generated" && (
          <DialogContent className="w-[90vw] !max-w-[90vw]">
            <DialogHeader>
              <DialogTitle>Pick a response:</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-2 max-h-[90vh] overflow-y-auto">
              {responses.map((response, index) => {
                const modelInfo = AVAILABLE_MODELS.find(
                  (m) => m.id === response.model
                );
                return (
                  <div
                    key={index}
                    className="border p-4 rounded-md cursor-pointer hover:bg-accent/50"
                    onClick={() => {
                      setValue(response.response);
                      setIsDialogOpen(false);
                    }}
                  >
                    <div className="text-sm font-medium">
                      {modelInfo?.name}:
                    </div>
                    {response.response}
                  </div>
                );
              })}
            </div>
          </DialogContent>
        )}
        {(state === "idle" || state === "generating") && (
          <DialogContent className="w-[90vw] !max-w-[90vw]">
            <form onSubmit={handleGenerate} className="space-y-2">
              <DialogHeader>
                <DialogTitle>Generate {label}</DialogTitle>
              </DialogHeader>
              Prompt:
              <Textarea
                value={generatedPrompt}
                onChange={(e) => setGeneratedPrompt(e.target.value)}
                placeholder={
                  "Enter a prompt to generate a response. This will be used to generate the response."
                }
              />
              Choose models:
              <div className="flex flex-col gap-1">
                {AVAILABLE_MODELS.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => toggleModel(model.id)}
                    className={cn(
                      "cursor-pointer p-2 rounded-md border text-sm flex gap-2 items-center justify-between",
                      selectedModels.includes(model.id) &&
                        "bg-primary text-white"
                    )}
                  >
                    {model.name} ({model.provider})
                    <span className="text-xs text-muted-foreground">
                      {model.description}
                    </span>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button
                  className="gap-2"
                  disabled={!generatedPrompt || selectedModels.length === 0}
                >
                  <Sparkles className="h-4 w-4" /> Generate
                </Button>
              </DialogFooter>
            </form>
            {state === "generating" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 backdrop-blur-xs rounded-md">
                <Loader2 className="h-12 w-12 animate-spin" />
              </div>
            )}
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
