"use client";

import { useState } from "react";
import { AlertTriangle, Zap, CheckCircle2, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PatternSignal } from "@/types/intelligence";
import { useAutomatePatternTask, useResolvePatternAlert } from "@/hooks/use-intelligence";

const tone: Record<string, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

export function PatternAlertsPanel({ alerts, title = "Pattern Alerts" }: { alerts: PatternSignal[]; title?: string }) {
  const automate = useAutomatePatternTask();
  const resolve = useResolvePatternAlert();
  const [automatedIds, setAutomatedIds] = useState<Set<string>>(new Set());
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  const visibleAlerts = alerts.filter((a) => !resolvedIds.has(a.id) && a.status !== "resolved");

  async function handleAutomate(alert: PatternSignal) {
    const result = await automate.mutateAsync({
      alertId: alert.id,
      alertTitle: alert.title,
      alertDescription: alert.prompt,
      alertConfidence: alert.confidence,
      dueInDays: alert.confidence === "high" ? 2 : alert.confidence === "medium" ? 7 : 14,
    });
    if (result.taskId) {
      setAutomatedIds((prev) => new Set([...prev, alert.id]));
    }
  }

  async function handleResolve(alert: PatternSignal) {
    try {
      await resolve.mutateAsync({ alertId: alert.id, status: "resolved" });
    } catch {
      // Dynamic alerts can't be persisted — optimistically hide them anyway
    }
    setResolvedIds((prev) => new Set([...prev, alert.id]));
  }

  async function handleReview(alert: PatternSignal) {
    try {
      await resolve.mutateAsync({ alertId: alert.id, status: "reviewed" });
    } catch {
      // Dynamic alerts — ignore 404
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {title}
          </div>
          {visibleAlerts.length > 0 && (
            <Badge className="rounded-full text-[10px] bg-amber-100 text-amber-700">{visibleAlerts.length} active</Badge>
          )}
        </div>
        {visibleAlerts.length === 0 && <div className="text-xs text-slate-400">No emerging pattern alerts in the selected period.</div>}
        {visibleAlerts.map((alert) => {
          const isAutomated = automatedIds.has(alert.id);
          const isReviewed = alert.status === "reviewed";
          return (
            <div
              key={alert.id}
              className={`rounded-md border p-3 space-y-1.5 transition-opacity ${isReviewed ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-800">{alert.title}</div>
                <Badge className={`rounded-full text-[10px] shrink-0 ${tone[alert.confidence] ?? tone.low}`}>{alert.confidence}</Badge>
              </div>
              <div className="text-xs text-slate-600">{alert.prompt}</div>
              {alert.evidenceRefs.length > 0 && (
                <div className="text-[11px] text-slate-500">Evidence: {alert.evidenceRefs.join(", ")}</div>
              )}
              <div className="flex items-center gap-1.5 pt-0.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-[10px]"
                  disabled={isAutomated || automate.isPending}
                  onClick={() => handleAutomate(alert)}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  {isAutomated ? "Tasked" : "Automate"}
                </Button>
                {!isReviewed && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[10px] text-slate-500"
                    disabled={resolve.isPending}
                    onClick={() => handleReview(alert)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Mark reviewed
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[10px] text-emerald-600"
                  disabled={resolve.isPending}
                  onClick={() => handleResolve(alert)}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Resolve
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
