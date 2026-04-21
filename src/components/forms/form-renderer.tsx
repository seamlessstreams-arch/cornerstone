"use client";

import React, { useState } from "react";
import type { FormField, FormSection, FormTemplate } from "@/lib/forms/types";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { Button } from "@/components/ui/button";

interface FormRendererProps {
  template: FormTemplate;
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>, isDraft: boolean) => Promise<void>;
  isLoading?: boolean;
}

export function FormRenderer({
  template,
  initialValues = {},
  onSubmit,
  isLoading = false,
}: FormRendererProps) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent, isDraft: boolean) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(values, isDraft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const sections = template.latest_version?.schema?.sections || [];

  return (
    <form className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {sections.map((section: FormSection) => (
        <section key={section.id} className="space-y-4 border-b border-slate-100 pb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
            {section.description && (
              <p className="mt-1 text-sm text-slate-600">{section.description}</p>
            )}
          </div>

          <div className="space-y-6 pl-2">
            {section.fields
              .sort((a, b) => a.field_order - b.field_order)
              .map((field: FormField) => (
                <FormFieldWrapper
                  key={field.id}
                  field={field}
                  value={values[field.field_key]}
                  onChange={(newValue) =>
                    setValues((prev) => ({
                      ...prev,
                      [field.field_key]: newValue,
                    }))
                  }
                  formValues={values}
                  disabled={loading || isLoading}
                />
              ))}
          </div>
        </section>
      ))}

      <div className="flex gap-2 pt-4">
        <Button
          onClick={(e) => handleSubmit(e, false)}
          disabled={loading || isLoading}
          className="bg-teal-700 hover:bg-teal-800"
        >
          {loading ? "Saving..." : "Save & Submit"}
        </Button>
        <Button
          onClick={(e) => handleSubmit(e, true)}
          variant="outline"
          disabled={loading || isLoading}
        >
          Save as Draft
        </Button>
      </div>
    </form>
  );
}
