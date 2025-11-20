"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Filter,
  RefreshCw,
  CheckCircle,
} from "lucide-react";

interface ExportOptions {
  format: "csv" | "json" | "excel";
  dateRange: {
    start?: string;
    end?: string;
  };
  includeFields: string[];
  filterByCategory?: string;
  filterByType?: "all" | "income" | "expense";
}

export default function MpesaExportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "csv",
    dateRange: {},
    includeFields: [
      "transactionCode",
      "transactionDate",
      "amount",
      "type",
      "category",
      "isIncome",
      "counterpartyName",
      "merchantName",
      "description",
    ],
    filterByType: "all",
  });
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const exportToCSV = (data: any[]) => {
    if (data.length === 0) return;

    const headers = exportOptions.includeFields;
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((field) => {
            const value = row[field];
            if (value === null || value === undefined) return "";
            if (typeof value === "string" && value.includes(",")) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            if (value instanceof Date) {
              return value.toISOString();
            }
            return String(value);
          })
          .join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mpesa-transactions-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = (data: any[]) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mpesa-transactions-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = async (data: any[]) => {
    // For Excel export, we'll use CSV format (can be opened in Excel)
    // In a production app, you might want to use a library like xlsx
    exportToCSV(data);
  };

  const handleExport = async () => {
    setLoading(true);
    setExportSuccess(false);

    try {
      const params = new URLSearchParams({
        period: exportOptions.dateRange.start && exportOptions.dateRange.end ? "custom" : "all",
        ...(exportOptions.dateRange.start && { startDate: exportOptions.dateRange.start }),
        ...(exportOptions.dateRange.end && { endDate: exportOptions.dateRange.end }),
        ...(exportOptions.filterByCategory && { category: exportOptions.filterByCategory }),
        ...(exportOptions.filterByType !== "all" && {
          isIncome: exportOptions.filterByType === "income" ? "true" : "false",
        }),
      });

      const response = await fetch(`/api/mpesa/transactions?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch transactions");

      const data = await response.json();
      const transactions = data.transactions || [];

      // Filter fields
      const filteredData = transactions.map((t: any) => {
        const filtered: any = {};
        exportOptions.includeFields.forEach((field) => {
          filtered[field] = t[field];
        });
        return filtered;
      });

      // Export based on format
      switch (exportOptions.format) {
        case "csv":
          exportToCSV(filteredData);
          break;
        case "json":
          exportToJSON(filteredData);
          break;
        case "excel":
          await exportToExcel(filteredData);
          break;
      }

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleField = (field: string) => {
    setExportOptions((prev) => ({
      ...prev,
      includeFields: prev.includeFields.includes(field)
        ? prev.includeFields.filter((f) => f !== field)
        : [...prev.includeFields, field],
    }));
  };

  const allFields = [
    { key: "transactionCode", label: "Transaction Code" },
    { key: "transactionDate", label: "Date" },
    { key: "amount", label: "Amount" },
    { key: "type", label: "Type" },
    { key: "category", label: "Category" },
    { key: "isIncome", label: "Is Income" },
    { key: "counterpartyName", label: "Counterparty" },
    { key: "merchantName", label: "Merchant" },
    { key: "normalizedMerchantName", label: "Normalized Merchant" },
    { key: "description", label: "Description" },
    { key: "balanceAfter", label: "Balance After" },
    { key: "paybillNumber", label: "Paybill Number" },
    { key: "tillNumber", label: "Till Number" },
  ];

  if (status === "loading") {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={session?.user ? { name: session.user.name, email: session.user.email } : undefined}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
                <Download className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Export Transactions</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Export your M-PESA transactions in various formats
                </p>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Format</h2>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setExportOptions({ ...exportOptions, format: "csv" })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  exportOptions.format === "csv"
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                }`}
              >
                <FileText className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium text-gray-900 dark:text-white">CSV</p>
              </button>
              <button
                onClick={() => setExportOptions({ ...exportOptions, format: "json" })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  exportOptions.format === "json"
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                }`}
              >
                <FileText className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium text-gray-900 dark:text-white">JSON</p>
              </button>
              <button
                onClick={() => setExportOptions({ ...exportOptions, format: "excel" })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  exportOptions.format === "excel"
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                }`}
              >
                <FileSpreadsheet className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium text-gray-900 dark:text-white">Excel</p>
              </button>
            </div>
          </div>

          {/* Date Range */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Date Range (Optional)
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={exportOptions.dateRange.start || ""}
                  onChange={(e) =>
                    setExportOptions({
                      ...exportOptions,
                      dateRange: { ...exportOptions.dateRange, start: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={exportOptions.dateRange.end || ""}
                  onChange={(e) =>
                    setExportOptions({
                      ...exportOptions,
                      dateRange: { ...exportOptions.dateRange, end: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transaction Type
                </label>
                <select
                  value={exportOptions.filterByType}
                  onChange={(e) =>
                    setExportOptions({
                      ...exportOptions,
                      filterByType: e.target.value as "all" | "income" | "expense",
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Transactions</option>
                  <option value="income">Income Only</option>
                  <option value="expense">Expenses Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fields Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select Fields to Export
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {allFields.map((field) => (
                <label
                  key={field.key}
                  className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={exportOptions.includeFields.includes(field.key)}
                    onChange={() => toggleField(field.key)}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Export Button */}
          <div className="flex gap-4">
            <button
              onClick={handleExport}
              disabled={loading || exportOptions.includeFields.length === 0}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Export Transactions
                </>
              )}
            </button>
          </div>

          {exportSuccess && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-green-800 dark:text-green-200">Export completed successfully!</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}


