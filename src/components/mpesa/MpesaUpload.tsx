"use client";

/**
 * MPESA Upload Component
 *
 * Handles file upload (CSV, text) and manual text paste
 * Shows parsing progress and results
 */

import { useState } from "react";
import { MpesaStatementFormat } from "@/types/mpesa";

export default function MpesaUpload() {
  const [uploadMode, setUploadMode] = useState<"file" | "text" | "manual">("file");
  const [format, setFormat] = useState<MpesaStatementFormat | "auto">("auto");
  const [textContent, setTextContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      // Check if it's a PDF file
      const isPDF = file.type === "application/pdf" || file.name.endsWith(".pdf");

      if (isPDF) {
        // Send PDF as FormData
        await parsePDFFile(file);
      } else {
        // Read text file content
        const content = await file.text();
        // Send to API
        await parseContent(content);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextUpload = async () => {
    if (!textContent.trim()) {
      setError("Please paste some content");
      return;
    }

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      await parseContent(textContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse content");
    } finally {
      setIsUploading(false);
    }
  };

  const parseContent = async (content: string) => {
    const response = await fetch("/api/mpesa/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        format: format === "auto" ? undefined : format,
        skipDuplicates: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to parse transactions");
    }

    setResult(data);
  };

  const parsePDFFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("format", format === "auto" ? "PDF" : format);
    formData.append("skipDuplicates", "true");

    const response = await fetch("/api/mpesa/parse", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to parse PDF");
    }

    setResult(data);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-800/50">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Import Transactions
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Upload M-PESA CSV, SMS backup, or paste transaction text
        </p>
      </div>

      <div className="p-6">
        {/* Upload Mode Selection */}
        <div className="mb-6 flex space-x-2">
          <button
            onClick={() => setUploadMode("file")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              uploadMode === "file"
                ? "bg-emerald-500 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            }`}
          >
            📁 Upload File
          </button>
          <button
            onClick={() => setUploadMode("text")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              uploadMode === "text"
                ? "bg-emerald-500 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            }`}
          >
            📝 Paste Text
          </button>
        </div>

        {/* Format Selection */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Format
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          >
            <option value="auto">Auto-detect</option>
            <option value="PDF">PDF</option>
            <option value="CSV">CSV</option>
            <option value="SMS">SMS</option>
            <option value="TEXT">Text</option>
          </select>
        </div>

        {/* File Upload */}
        {uploadMode === "file" && (
          <div className="mb-6">
            <label className="block">
              <div className="flex h-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-emerald-500 hover:bg-emerald-50 dark:border-slate-600 dark:bg-slate-700/50 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/20">
                <div className="text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Click to select file or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                    PDF, CSV, TXT, or SMS backup file
                  </p>
                </div>
              </div>
              <input
                type="file"
                accept=".pdf,.csv,.txt,.text"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Text Paste */}
        {uploadMode === "text" && (
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Paste Transaction Text
            </label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste M-PESA SMS messages or CSV content here..."
              rows={10}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              disabled={isUploading}
            />
            <button
              onClick={handleTextUpload}
              disabled={isUploading || !textContent.trim()}
              className="mt-3 w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? "Parsing..." : "Parse Transactions"}
            </button>
          </div>
        )}

        {/* Loading State */}
        {isUploading && (
          <div className="mb-4 flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
            <span className="ml-3 text-sm text-slate-600 dark:text-slate-400">
              Parsing transactions...
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Success Result */}
        {result && result.success && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 dark:bg-emerald-900/20 dark:border-emerald-800">
            <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">
              ✅ Successfully imported {result.summary.successful} transactions
            </h3>
            <div className="mt-2 space-y-1 text-sm text-emerald-700 dark:text-emerald-400">
              <p>• Total: {result.summary.total}</p>
              <p>• Duplicates skipped: {result.summary.duplicates}</p>
              <p>• Income: KES {result.summary.totalIncome.toLocaleString()}</p>
              <p>• Expense: KES {result.summary.totalExpense.toLocaleString()}</p>
              {result.errors.length > 0 && (
                <p className="text-orange-600">• Warnings: {result.errors.length}</p>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm text-emerald-700 underline hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Upload more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

