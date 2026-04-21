"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { FormTemplateSelector } from "@/components/forms/form-template-selector";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { FormTemplate } from "@/lib/forms/types";

export default function NewFormPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);

  const handleSelectTemplate = (template: FormTemplate) => {
    setSelectedTemplate(template);
  };

  const handleStartForm = () => {
    if (!selectedTemplate) return;

    // Navigate to form editor with template
    const params = new URLSearchParams({
      template: selectedTemplate.code,
    });

    router.push(`/forms/edit?${params.toString()}`);
  };

  return (
    <PageShell
      title="Create New Form"
    >
      <div className="space-y-6">
        {/* Back button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Select a Template
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Choose a form template to get started
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Template Selector */}
        <FormTemplateSelector
          onSelect={handleSelectTemplate}
          selectedTemplateId={selectedTemplate?.id}
        />

        {/* Selected Template Info & Actions */}
        {selectedTemplate && (
          <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900">
                  {selectedTemplate.name}
                </h4>
                <p className="text-sm text-slate-600 mt-0.5">
                  {selectedTemplate.description}
                </p>
              </div>
              <Button
                onClick={handleStartForm}
                className="bg-teal-700 hover:bg-teal-800"
              >
                Start Form
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
