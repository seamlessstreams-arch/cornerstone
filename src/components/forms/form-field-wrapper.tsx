"use client";

import { useState } from "react";
import type { FormField } from "@/lib/forms/types";
import { evaluateFieldRules, validateFieldValue } from "@/lib/forms/validation";
import { Input } from "@/components/ui/input";

interface FormFieldWrapperProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  formValues: Record<string, unknown>;
  disabled?: boolean;
}

export function FormFieldWrapper({
  field,
  value,
  onChange,
  formValues,
  disabled = false,
}: FormFieldWrapperProps) {
  const [touched, setTouched] = useState(false);
  const { visible, required, disabled: conditionallyDisabled } = evaluateFieldRules(
    field,
    formValues
  );
  const validation = touched ? validateFieldValue(value, field) : { valid: true, errors: [] };
  const isDisabled = disabled || conditionallyDisabled;

  if (!visible) {
    return null;
  }

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-sm font-medium text-slate-700">
        {field.label}
        {required && <span className="text-red-600">*</span>}
      </label>

      {field.description && (
        <p className="text-xs text-slate-500">{field.description}</p>
      )}

      <div className="relative">
        <FormFieldInput
          field={field}
          value={value}
          onChange={onChange}
          disabled={isDisabled}
          onBlur={() => setTouched(true)}
        />
      </div>

      {field.help_text && (
        <p className="text-xs text-slate-500 italic">{field.help_text}</p>
      )}

      {touched && validation.errors.length > 0 && (
        <ul className="mt-1 space-y-1">
          {validation.errors.map((error, idx) => (
            <li key={idx} className="text-xs text-red-600">
              {error}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FormFieldInput({
  field,
  value,
  onChange,
  disabled,
  onBlur,
}: {
  field: FormField;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled: boolean;
  onBlur: () => void;
}) {
  switch (field.field_type) {
    case "short_text":
      return (
        <Input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          onBlur={onBlur}
        />
      );

    case "long_text":
      return (
        <textarea
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          onBlur={onBlur}
          className="min-h-32 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
        />
      );

    case "date":
      return (
        <Input
          type="date"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          onBlur={onBlur}
        />
      );

    case "time":
      return (
        <Input
          type="time"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          onBlur={onBlur}
        />
      );

    case "datetime":
      return (
        <Input
          type="datetime-local"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          onBlur={onBlur}
        />
      );

    case "number":
      return (
        <Input
          type="number"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
          disabled={disabled}
          onBlur={onBlur}
        />
      );

    case "currency":
      return (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
            £
          </span>
          <Input
            type="number"
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
            step="0.01"
            disabled={disabled}
            onBlur={onBlur}
            className="pl-6"
          />
        </div>
      );

    case "yes_no":
      return (
        <select
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value === "true" ? true : e.target.value === "false" ? false : "")}
          disabled={disabled}
          onBlur={onBlur}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
        >
          <option value="">— Select —</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );

    case "checkbox":
      return (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            onBlur={onBlur}
            className="h-4 w-4 rounded border-slate-300 text-teal-700"
          />
          <span className="text-sm text-slate-700">{field.label}</span>
        </label>
      );

    case "radio":
    case "single_select":
      return (
        <select
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          onBlur={onBlur}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
        >
          <option value="">— Select —</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case "multi_select":
      return (
        <select
          multiple
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={(e) =>
            onChange(Array.from(e.target.selectedOptions, (opt) => opt.value))
          }
          disabled={disabled}
          onBlur={onBlur}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
        >
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case "file_upload":
    case "image_upload":
    case "document_upload":
    case "voice_note_upload":
      return (
        <Input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onChange(file);
          }}
          disabled={disabled}
          onBlur={onBlur}
        />
      );

    case "rich_text":
    case "ai_assisted_narrative":
    case "management_oversight_narrative":
      return (
        <textarea
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          onBlur={onBlur}
          className="min-h-40 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:border-teal-500 focus:outline-none"
        />
      );

    default:
      return (
        <Input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          onBlur={onBlur}
        />
      );
  }
}
