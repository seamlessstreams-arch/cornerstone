"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { EVIDENCE_TYPES, EVIDENCE_TYPE_LABELS } from "@/lib/evidence/types";

interface EvidenceUploaderProps {
  formRecordId: string;
  candidateId?: string;
  defaultEvidenceType?: string;
  onUploadComplete?: (evidenceId: string, fileName: string) => void;
  compact?: boolean;
}

export function EvidenceUploader({
  formRecordId,
  candidateId,
  defaultEvidenceType,
  onUploadComplete,
  compact = false,
}: EvidenceUploaderProps) {
  const [evidenceType, setEvidenceType] = useState(defaultEvidenceType || EVIDENCE_TYPES.ADDITIONAL_EVIDENCE);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      // Validate size (max 20MB)
      if (selected.size > 20 * 1024 * 1024) {
        setError("File must be under 20MB");
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("evidenceType", evidenceType);
      formData.append("formRecordId", formRecordId);
      if (candidateId) {
        formData.append("linkedCandidateId", candidateId);
      }

      const response = await fetch("/api/phase3/evidence/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      setSuccess(`${file.name} uploaded successfully`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      if (onUploadComplete) {
        onUploadComplete(data.evidenceId, file.name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      if (dropped.size > 20 * 1024 * 1024) {
        setError("File must be under 20MB");
        return;
      }
      setFile(dropped);
      setError(null);
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <select
            value={evidenceType}
            onChange={(e) => setEvidenceType(e.target.value)}
            className="flex-none px-2 py-1 text-sm border rounded bg-white"
          >
            {Object.entries(EVIDENCE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="flex-1 text-sm"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xlsx,.xls"
          />
          <Button
            size="sm"
            onClick={handleUpload}
            disabled={uploading || !file}
          >
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {success && <p className="text-xs text-green-600">{success}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white">
      <h3 className="font-semibold text-gray-900">Upload Evidence</h3>

      {/* Evidence Type */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Evidence Type</label>
        <select
          value={evidenceType}
          onChange={(e) => setEvidenceType(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg bg-white text-sm"
        >
          {Object.entries(EVIDENCE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        {file ? (
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">📎</div>
            <p className="text-sm text-gray-600">
              Drag and drop a file, or <span className="text-blue-600 underline">browse</span>
            </p>
            <p className="text-xs text-gray-400">PDF, DOC, DOCX, JPG, PNG, XLSX up to 20MB</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xlsx,.xls"
        />
      </div>

      {/* Status messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded px-3 py-2 text-sm text-green-700">
          ✓ {success}
        </div>
      )}

      {/* Upload button */}
      <Button
        onClick={handleUpload}
        disabled={uploading || !file}
        className="w-full"
      >
        {uploading ? "Uploading…" : "Upload Evidence"}
      </Button>
    </div>
  );
}
