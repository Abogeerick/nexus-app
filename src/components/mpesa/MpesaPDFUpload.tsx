"use client";

import { useState, useRef, useCallback } from "react";
import type { ChangeEvent } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadState {
  status: "idle" | "uploading" | "processing" | "success" | "error";
  progress: number;
  message: string;
  stats?: {
    total: number;
    successful: number;
    failed: number;
    duplicates: number;
  };
}

export function MpesaPDFUpload({ onSuccess }: { onSuccess?: () => void }) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    progress: 0,
    message: "",
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadState({
        status: "error",
        progress: 0,
        message: "Please upload a PDF file",
      });
      return;
    }

    // Start upload
    setUploadState({
      status: "uploading",
      progress: 10,
      message: "Uploading PDF...",
    });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("format", "PDF");
      formData.append("skipDuplicates", "false"); // No duplicate detection for PDFs

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadState((prev) =>
          prev.status === "uploading"
            ? { ...prev, progress: Math.min(prev.progress + 5, 40) }
            : prev
        );
      }, 200);

      const response = await fetch("/api/mpesa/parse", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      // Processing phase
      setUploadState({
        status: "processing",
        progress: 50,
        message: "Extracting transactions...",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Success
      setUploadState({
        status: "success",
        progress: 100,
        message: `Successfully imported ${data.summary.total} transactions!`,
        stats: data.summary,
      });

      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (error) {
      setUploadState({
        status: "error",
        progress: 0,
        message: error instanceof Error ? error.message : "Upload failed",
      });
    }
  }, [onSuccess]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files[0]) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files[0]) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const reset = () => {
    setUploadState({
      status: "idle",
      progress: 0,
      message: "",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Upload M-PESA Statement
          </h3>
          <p className="text-green-50 text-sm mt-1">
            Upload your official M-PESA PDF statement to analyze your transactions
          </p>
        </div>

        {/* Upload Area */}
        <div className="p-6">
          {uploadState.status === "idle" && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200",
                isDragging
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20 scale-105"
                  : "border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              )}
            >
              <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Drop your PDF here or click to browse
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Supports M-PESA PDF statements only
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {(uploadState.status === "uploading" || uploadState.status === "processing") && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                <span className="text-lg font-medium text-gray-700 dark:text-gray-200">
                  {uploadState.message}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                {uploadState.progress}% complete
              </p>
            </div>
          )}

          {uploadState.status === "success" && uploadState.stats && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
              <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
                Upload Successful!
              </h4>
              <p className="text-gray-600 dark:text-gray-300">{uploadState.message}</p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {uploadState.stats.total}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {uploadState.stats.successful}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Successfully Imported</div>
                </div>
              </div>

              <button
                onClick={reset}
                className="mt-4 px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Upload Another Statement
              </button>
            </div>
          )}

          {uploadState.status === "error" && (
            <div className="text-center space-y-4">
              <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
              <h4 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Failed</h4>
              <p className="text-red-600 dark:text-red-400">{uploadState.message}</p>

              <button
                onClick={reset}
                className="mt-4 px-6 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        {uploadState.status === "idle" && (
          <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">How to get your statement:</h4>
            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
              <li>Dial *234# on your M-PESA registered phone</li>
              <li>Select "M-PESA Statement"</li>
              <li>Choose your preferred date range</li>
              <li>Enter your email address</li>
              <li>Check your email and unlock the PDF (password is your ID number)</li>
              <li>Upload the unlocked PDF here</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}


