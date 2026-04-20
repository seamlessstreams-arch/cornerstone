"use client";

import React from "react";
import { Header } from "./header";
import { QuickCreateActions } from "@/components/common/quick-create-actions";
import type { QuickCreateContext } from "@/components/common/quick-create-modal";

interface PageShellProps {
  title: string;
  subtitle?: string;
  /** Custom action nodes rendered to the left of the create buttons */
  actions?: React.ReactNode;
  /** When provided, renders QuickCreateActions in the header with this context */
  quickCreateContext?: QuickCreateContext;
  /** Set to false to suppress the automatic QuickCreate buttons */
  showQuickCreate?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function PageShell({
  title,
  subtitle,
  actions,
  quickCreateContext,
  showQuickCreate = true,
  children,
  fullWidth = false,
}: PageShellProps) {
  const headerActions = (
    <>
      {actions}
      {showQuickCreate && (
        <QuickCreateActions context={quickCreateContext} />
      )}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header title={title} subtitle={subtitle} actions={headerActions} />
      <main className={`flex-1 p-6 ${fullWidth ? "" : "max-w-[1440px] mx-auto w-full"}`}>
        {children}
      </main>
    </div>
  );
}
