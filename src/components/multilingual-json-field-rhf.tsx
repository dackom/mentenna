"use client";

import * as React from "react";
import {
  MultilingualJsonField,
  LanguageValue,
} from "./multilingual-json-field";
import { Controller, Control, FieldPath, FieldValues } from "react-hook-form";

/**
 * React Hook Form wrapper for MultilingualJsonField
 *
 * @example
 * ```tsx
 * import { useForm } from "react-hook-form"
 * import { MultilingualJsonFieldRHF } from "@/components/multilingual-json-field-rhf"
 *
 * interface FormData {
 *   description: Record<string, string>
 * }
 *
 * function MyForm() {
 *   const { control, handleSubmit } = useForm<FormData>({
 *     defaultValues: {
 *       description: {}
 *     }
 *   })
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <MultilingualJsonFieldRHF
 *         name="description"
 *         control={control}
 *         label="Description"
 *         multiline
 *       />
 *     </form>
 *   )
 * }
 * ```
 */

interface MultilingualJsonFieldRHFProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
  control: Control<TFieldValues>;
  label?: string;
  description?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
  disabled?: boolean;
  defaultValue?: LanguageValue;
}

export function MultilingualJsonFieldRHF<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  defaultValue = {},
  ...props
}: MultilingualJsonFieldRHFProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={defaultValue as TFieldValues[TName]}
      render={({ field }) => (
        <MultilingualJsonField
          {...props}
          value={field.value as LanguageValue}
          onChange={field.onChange}
        />
      )}
    />
  );
}
