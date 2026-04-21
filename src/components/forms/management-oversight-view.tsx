"use client";

import { useState } from "react";
import type { ManagementOversight } from "@/lib/forms/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface ManagementOversightViewProps {
  oversight: ManagementOversight;
  onApprove?: () => void;
  onReturn?: () => void;
  onEscalate?: () => void;
  editable?: boolean;
}

export function ManagementOversightView({
  oversight,
  onApprove,
  onReturn,
  onEscalate,
  editable = false,
}: ManagementOversightViewProps) {
  const [expanded, setExpanded] = useState(false);

  const statusIcons = {
    pending: <Clock className="h-4 w-4 text-amber-600" />,
    approved: <CheckCircle className="h-4 w-4 text-green-600" />,
    rejected: <AlertTriangle className="h-4 w-4 text-red-600" />,
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div
          className="cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {statusIcons[oversight.sign_off_status]}
              <div>
                <h4 className="font-semibold text-slate-900">Management Oversight</h4>
                <p className="text-xs text-slate-500">
                  {new Date(oversight.submitted_at || new Date()).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-500 capitalize">
              {oversight.sign_off_status}
            </span>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
            {oversight.narrative && (
              <div>
                <h5 className="text-sm font-medium text-slate-700">Narrative</h5>
                <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">
                  {oversight.narrative}
                </p>
              </div>
            )}

            {oversight.analysis && (
              <div>
                <h5 className="text-sm font-medium text-slate-700">Analysis</h5>
                <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">
                  {oversight.analysis}
                </p>
              </div>
            )}

            {oversight.concerns_identified && (
              <div className="rounded-lg bg-red-50 p-3">
                <h5 className="text-sm font-medium text-red-900">Concerns Identified</h5>
                <p className="mt-1 text-sm text-red-700 whitespace-pre-wrap">
                  {oversight.concerns_identified}
                </p>
              </div>
            )}

            {oversight.actions_required && (
              <div className="rounded-lg bg-amber-50 p-3">
                <h5 className="text-sm font-medium text-amber-900">Actions Required</h5>
                <p className="mt-1 text-sm text-amber-700 whitespace-pre-wrap">
                  {oversight.actions_required}
                </p>
                {oversight.action_timescale && (
                  <p className="mt-2 text-xs text-amber-600">
                    Timescale: {oversight.action_timescale}
                  </p>
                )}
              </div>
            )}

            {oversight.safeguarding_escalation_needed && (
              <div className="rounded-lg border-2 border-red-300 bg-red-50 p-3">
                <p className="text-sm font-semibold text-red-900">
                  ⚠️ Safeguarding escalation required
                </p>
              </div>
            )}

            {editable && oversight.sign_off_status === "pending" && (
              <div className="flex gap-2 pt-4 border-t border-slate-100">
                {onApprove && (
                  <Button
                    size="sm"
                    onClick={onApprove}
                    className="bg-green-700 hover:bg-green-800"
                  >
                    Approve
                  </Button>
                )}
                {onReturn && (
                  <Button size="sm" variant="outline" onClick={onReturn}>
                    Return for Amendment
                  </Button>
                )}
                {onEscalate && (
                  <Button size="sm" variant="outline" onClick={onEscalate}>
                    Escalate
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
