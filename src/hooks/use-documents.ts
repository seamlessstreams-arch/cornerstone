"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./use-api";
import type { Document, DocumentReadReceipt } from "@/types";

export interface DocumentsResponse {
  data: Document[];
  receipts: DocumentReadReceipt[];
  meta: { total: number; requires_sign: number; expiring_soon: number; expired: number };
}

export function useDocuments(params?: { category?: string; requires_read_sign?: boolean }) {
  const query = new URLSearchParams();
  if (params?.category) query.set("category", params.category);
  if (params?.requires_read_sign) query.set("requires_read_sign", "true");
  return useQuery({
    queryKey: ["documents", params],
    queryFn: () => api.get<DocumentsResponse>(`/documents?${query}`),
  });
}

export function useSignDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ docId, staffId }: { docId: string; staffId: string }) =>
      api.post(`/documents/${docId}/sign`, { staff_id: staffId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      category: string;
      description?: string;
      expiry_date?: string;
      requires_read_sign?: boolean;
      tags?: string;
    }) => api.post<{ data: Document }>("/documents", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}
