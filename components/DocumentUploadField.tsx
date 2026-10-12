"use client";

import { useState } from "react";
import { DocumentIcon, TrashIcon } from "@heroicons/react/24/outline";
import { UploadButton } from "@/utils/uploadthing";
import type { UploadedDocument, UploadCategory } from "@/server/types/uploads";

interface DocumentUploadFieldProps {
  category: UploadCategory;
  documents: UploadedDocument[];
  onChange: (documents: UploadedDocument[]) => void;
  label: string;
  helpText: string;
  multiple?: boolean;
}

function formatFileSize(size: number) {
  return size < 1024 * 1024
    ? `${Math.ceil(size / 1024)} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentUploadField({
  category,
  documents,
  onChange,
  label,
  helpText,
  multiple = false,
}: DocumentUploadFieldProps) {
  const [error, setError] = useState("");
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const endpoint = category === "pitchDeck" ? "pitchDeck" : "certificates";

  const removeDocument = async (key: string) => {
    setRemovingKey(key);
    setError("");
    try {
      const response = await fetch("/api/uploads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Could not remove this file.");
      }
      onChange(documents.filter((document) => document.key !== key));
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Could not remove this file."
      );
    } finally {
      setRemovingKey(null);
    }
  };

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
        {label}
      </p>
      <p className="mt-1 text-xs text-slate-400">{helpText}</p>

      {documents.length > 0 && (
        <ul className="mt-3 space-y-2">
          {documents.map((document) => (
            <li
              key={document.key}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
            >
              <DocumentIcon
                aria-hidden="true"
                className="h-5 w-5 shrink-0 text-teal-300"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-white">
                  {document.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  {formatFileSize(document.size)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => void removeDocument(document.key)}
                disabled={removingKey !== null}
                aria-label={`Remove ${document.name}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-400/10 hover:text-rose-300 disabled:opacity-50"
              >
                <TrashIcon aria-hidden="true" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {(!documents.length || (multiple && documents.length < 3)) && (
        <div className="mt-3">
          <UploadButton
            endpoint={endpoint}
            config={{ mode: "auto" }}
            onClientUploadComplete={(uploadedFiles) => {
              const newDocuments = uploadedFiles.map((file) => ({
                key: file.key,
                name: file.name,
                size: file.size,
              }));
              onChange(
                multiple
                  ? [...documents, ...newDocuments].slice(0, 3)
                  : newDocuments.slice(0, 1)
              );
              setError("");
            }}
            onUploadError={(uploadError) => setError(uploadError.message)}
            appearance={{
              button:
                "min-h-11 rounded-xl bg-teal-400 px-4 py-2 text-xs font-bold text-slate-950 after:bg-teal-300",
              allowedContent: "mt-2 text-[10px] text-slate-400",
            }}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
