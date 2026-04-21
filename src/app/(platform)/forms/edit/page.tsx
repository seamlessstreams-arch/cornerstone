"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { FormRenderer } from "@/components/forms/form-renderer";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import type { FormTemplate } from "@/lib/forms/types";
import { useToast } from "@/components/ui/toast";

function FormEditContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const templateCode = searchParams.get("template");

  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch template
  useEffect(() => {
    if (!templateCode) {
      setError("No template specified");
      setIsLoading(false);
      return;
    }

    async function fetchTemplate() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/forms/templates?code=${templateCode}`);
        if (!response.ok) throw new Error("Template not found");

        const data = await response.json();
        setTemplate(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load template");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTemplate();
  }, [templateCode]);

  const handleSubmit = async (data: Record<string, unknown>, isDraft: boolean) => {
    try {
      setIsSaving(true);

      const response = await fetch("/api/forms/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template?.id,
          values: data,
          isDraft,
        }),
      });

      if (!response.ok) throw new Error("Failed to save form");

      // Show success message and redirect
      toast(`Form ${isDraft ? "saved as draft" : "submitted"} successfully!`, "success");
      router.push(`/forms`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save form", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageShell title="Loading...">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          <span className="ml-2 text-slate-600">Loading form...</span>
        </div>
      </PageShell>
    );
  }

  if (error || !template) {
    return (
      <PageShell title="Error">
        <div className="rounded-lg bg-red-50 border border-red-200 p-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Form</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push("/forms")}
              >
                Back to Forms
              </Button>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={template.name}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">{template.category}</p>
            <p className="text-slate-500 text-sm mt-1">{template.description}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isSaving}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Form Renderer */}
        <FormRenderer
          template={template}
          onSubmit={handleSubmit}
          isLoading={isSaving}
        />
      </div>
    </PageShell>
  );
}

export default function FormEditPage() {
  return (
    <Suspense
      fallback={
        <PageShell title="Loading...">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-600">Loading form...</span>
          </div>
        </PageShell>
      }
    >
      <FormEditContent />
    </Suspense>
  );
}
