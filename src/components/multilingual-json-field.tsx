"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GlobeIcon, PlusIcon, TrashIcon, LanguagesIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AVAILABLE_LANGUAGES,
  getLanguageDisplayName,
} from "@/config/languages";

export type LanguageValue = Record<string, string>;

interface MultilingualJsonFieldProps {
  value?: LanguageValue | null;
  onChange?: (value: LanguageValue) => void;
  label?: string;
  description?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
  disabled?: boolean;
}

export function MultilingualJsonField({
  value,
  onChange,
  label,
  description,
  placeholder = "Enter text",
  multiline = false,
  rows = 3,
  className,
  disabled = false,
}: MultilingualJsonFieldProps) {
  const [open, setOpen] = React.useState(false);
  const [localValue, setLocalValue] = React.useState<LanguageValue>(
    value || {}
  );

  // Sync local value with prop value when it changes
  React.useEffect(() => {
    setLocalValue(value || {});
  }, [value]);

  const languages = Object.keys(localValue);
  const languageCount = languages.length;

  const handleAddLanguage = () => {
    // Find the first available language that hasn't been added yet
    const usedCodes = Object.keys(localValue);
    const availableLanguage = AVAILABLE_LANGUAGES.find(
      (lang) => !usedCodes.includes(lang.code)
    );

    if (availableLanguage) {
      setLocalValue((prev) => ({ ...prev, [availableLanguage.code]: "" }));
    }
  };

  const handleRemoveLanguage = (lang: string) => {
    setLocalValue((prev) => {
      const newValue = { ...prev };
      delete newValue[lang];
      return newValue;
    });
  };

  const handleLanguageCodeChange = (oldLang: string, newLang: string) => {
    if (oldLang === newLang) return;

    setLocalValue((prev) => {
      // Preserve order by reconstructing the object
      const newValue: LanguageValue = {};
      Object.keys(prev).forEach((key) => {
        if (key === oldLang) {
          newValue[newLang] = prev[oldLang];
        } else {
          newValue[key] = prev[key];
        }
      });
      return newValue;
    });
  };

  const handleLanguageValueChange = (lang: string, newValue: string) => {
    setLocalValue((prev) => ({ ...prev, [lang]: newValue }));
  };

  const handleSave = () => {
    onChange?.(localValue);
    setOpen(false);
  };

  const handleCancel = () => {
    setLocalValue(value || {});
    setOpen(false);
  };

  const getSummary = () => {
    if (languageCount === 0) {
      return <span className="text-muted-foreground">No languages added</span>;
    }

    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium">
          {languageCount} {languageCount === 1 ? "language" : "languages"}:
        </span>
        {languages.slice(0, 3).map((lang) => (
          <Badge key={lang} variant="outline">
            {lang.toUpperCase()}
          </Badge>
        ))}
        {languageCount > 3 && (
          <Badge variant="secondary">+{languageCount - 3} more</Badge>
        )}
      </div>
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </Label>
      )}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between h-auto min-h-[2.25rem] py-2"
            disabled={disabled}
          >
            <div className="flex items-center gap-2 flex-1">
              <LanguagesIcon className="size-4 opacity-70" />
              {getSummary()}
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {label ? `Edit ${label}` : "Edit Multilingual Content"}
            </DialogTitle>
            <DialogDescription>
              Add, edit, or remove language translations. Each entry consists of
              a language code and its corresponding text.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {languages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GlobeIcon className="size-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No languages added yet</p>
                <p className="text-xs mt-1">
                  Click the button below to add your first language
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {languages.map((lang, index) => (
                  <div
                    key={index}
                    className="flex gap-2 items-start p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2 items-start">
                        <div className="">
                          <Label
                            htmlFor={`lang-code-${index}`}
                            className="text-xs mb-2"
                          >
                            Language
                          </Label>
                          <Select
                            value={lang}
                            onValueChange={(newLang) =>
                              handleLanguageCodeChange(lang, newLang)
                            }
                          >
                            <SelectTrigger id={`lang-code-${index}`} size="sm">
                              <SelectValue>
                                {getLanguageDisplayName(lang)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {AVAILABLE_LANGUAGES.filter(
                                (availableLang) =>
                                  availableLang.code === lang ||
                                  !languages.includes(availableLang.code)
                              ).map((availableLang) => (
                                <SelectItem
                                  key={availableLang.code}
                                  value={availableLang.code}
                                >
                                  {availableLang.name} (
                                  {availableLang.nativeName})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <Label
                            htmlFor={`lang-value-${index}`}
                            className="text-xs mb-2"
                          >
                            Translation
                          </Label>
                          {multiline ? (
                            <textarea
                              id={`lang-value-${index}`}
                              value={localValue[lang] || ""}
                              onChange={(e) =>
                                handleLanguageValueChange(lang, e.target.value)
                              }
                              placeholder={placeholder}
                              rows={rows}
                              className={cn(
                                "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                                "resize-vertical"
                              )}
                            />
                          ) : (
                            <Input
                              id={`lang-value-${index}`}
                              value={localValue[lang] || ""}
                              onChange={(e) =>
                                handleLanguageValueChange(lang, e.target.value)
                              }
                              placeholder={placeholder}
                              className="h-8 text-sm"
                            />
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRemoveLanguage(lang)}
                          className="mt-5 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Remove language"
                        >
                          <TrashIcon className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddLanguage}
              className="w-full"
              disabled={languages.length >= AVAILABLE_LANGUAGES.length}
            >
              <PlusIcon className="size-4" />
              Add Language
              {languages.length >= AVAILABLE_LANGUAGES.length && (
                <span className="text-xs text-muted-foreground ml-2">
                  (All languages added)
                </span>
              )}
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
