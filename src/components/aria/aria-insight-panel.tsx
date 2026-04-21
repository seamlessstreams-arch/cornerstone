"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AriaInsightPanelProps {
  context: string;
  sourceContent: string;
  suggestedPrompts?: string[];
}

export function AriaInsightPanel({ context, sourceContent, suggestedPrompts = [] }: AriaInsightPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function runAria(customPrompt?: string) {
    const question = (customPrompt ?? prompt).trim();
    if (!question) return;

    setLoading(true);
    try {
      const res = await fetch("/api/v1/aria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "assist",
          style: "reflective_practice",
          page_context: context,
          source_content: sourceContent,
          question,
        }),
      });
      const data = await res.json();
      setResult(data?.data?.response ?? "No response returned.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-sky-500" />
          ARIA Insight Assistant
        </div>
        <div className="text-xs text-slate-500">
          ARIA outputs are draft suggestions for professional review. ARIA does not auto-finalise decisions.
        </div>
        {suggestedPrompts.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {suggestedPrompts.map((item) => (
              <button
                key={item}
                className="rounded-full border px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
                onClick={() => runAria(item)}
              >
                {item}
              </button>
            ))}
          </div>
        )}
        <textarea
          className="h-24 w-full rounded-md border p-2 text-sm"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask ARIA for analysis, pattern reflection, or manager summary..."
        />
        <Button size="sm" onClick={() => runAria()} disabled={loading || !prompt.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
          Run ARIA Insight
        </Button>
        {result && (
          <div className="rounded-md border bg-slate-50 p-3 text-xs whitespace-pre-wrap leading-relaxed">
            {result}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
