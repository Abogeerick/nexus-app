/**
 * MPESA Parser Orchestrator
 *
 * Main interface for parsing MPESA transactions from multiple sources
 * Coordinates CSV parser, text parser, normalizer, and duplicate detection
 */

import {
  MpesaStatementFormat,
  RawMpesaTransaction,
  NormalizedMpesaTransaction,
  ParseResult,
  ParseError,
  ParseSummary,
} from "@/types/mpesa";
import { parseMpesaCSV } from "./mpesa-csv";
import { parseMpesaText } from "./mpesa-text";
import { parseMpesaPDF } from "./mpesa-pdf";
import { normalizeMpesaTransactions } from "./mpesa-normalizer";
import { findDuplicates, removeDuplicates, getDuplicateStats } from "./mpesa-duplicate-detector";

export interface ParseOptions {
  format?: MpesaStatementFormat;
  autoDetectFormat?: boolean;
  skipDuplicates?: boolean;
  existingTransactions?: NormalizedMpesaTransaction[];
}

/**
 * Main entry point for parsing MPESA data
 * @param content - Raw content (CSV, text, or PDF Buffer)
 * @param options - Parsing options
 * @returns Parse result with transactions, errors, and summary
 */
export async function parseMpesaData(
  content: string | Buffer,
  options: ParseOptions = {}
): Promise<ParseResult> {
  const {
    format,
    autoDetectFormat = true,
    skipDuplicates = true,
    existingTransactions = [],
  } = options;

  const errors: ParseError[] = [];
  let rawTransactions: RawMpesaTransaction[] = [];

  // Step 1: Check if content is PDF (Buffer)
  const isPDF = Buffer.isBuffer(content);
  
  // Step 2: Detect format if not specified
  let detectedFormat: MpesaStatementFormat;
  if (format) {
    detectedFormat = format;
  } else if (isPDF) {
    detectedFormat = MpesaStatementFormat.PDF;
  } else {
    detectedFormat = autoDetectFormat ? detectFormat(content as string) : MpesaStatementFormat.TEXT;
  }

  // Step 3: Parse based on format
  try {
    if (isPDF) {
      // Parse PDF
      const result = await parseMpesaPDF(content as Buffer);
      rawTransactions = result.transactions;
      errors.push(...result.errors);
    } else if (detectedFormat === MpesaStatementFormat.CSV) {
      const result = parseMpesaCSV(content as string);
      rawTransactions = result.transactions;
      errors.push(...result.errors);
    } else if (detectedFormat === MpesaStatementFormat.SMS || detectedFormat === MpesaStatementFormat.TEXT) {
      const result = parseMpesaText(content as string);
      rawTransactions = result.transactions;
      errors.push(...result.errors);
    } else {
      const contentPreview = isPDF ? "[PDF Binary Data]" : (content as string).substring(0, 100);
      errors.push({
        line: 0,
        rawText: contentPreview,
        error: "Unsupported format or unable to detect format",
        severity: "error",
      });
    }
  } catch (error) {
    const contentPreview = isPDF ? "[PDF Binary Data]" : (content as string).substring(0, 100);
    errors.push({
      line: 0,
      rawText: contentPreview,
      error: error instanceof Error ? error.message : "Unknown parsing error",
      severity: "error",
    });
  }

  // Step 3: Normalize transactions (now with AI classification)
  let normalizedTransactions: NormalizedMpesaTransaction[] = [];
  if (rawTransactions.length > 0) {
    const normResult = await normalizeMpesaTransactions(rawTransactions);
    normalizedTransactions = normResult.normalized;
    errors.push(...normResult.errors);
  }

  // Step 4: Detect and handle duplicates
  // NOTE: Skip duplicate detection for PDF imports since M-PESA PDFs are official statements
  // where each row represents a unique financial event (even if codes repeat for Fuliza, charges, etc.)
  let duplicates: number = 0;
  if (skipDuplicates && normalizedTransactions.length > 0 && detectedFormat !== MpesaStatementFormat.PDF) {
    const duplicateMatches = findDuplicates(normalizedTransactions, existingTransactions);
    const stats = getDuplicateStats(duplicateMatches);
    duplicates = stats.highConfidence; // Count only high-confidence duplicates

    // Remove duplicates
    normalizedTransactions = removeDuplicates(normalizedTransactions, duplicateMatches);
    
    console.log(`🔍 Duplicate detection: Found ${duplicates} duplicates, ${normalizedTransactions.length} unique transactions remaining`);
  } else if (detectedFormat === MpesaStatementFormat.PDF) {
    console.log(`📄 PDF import: Skipping duplicate detection (official statement)`);
  }

  // Step 5: Generate summary
  const summary = generateSummary(normalizedTransactions, errors, duplicates);

  return {
    success: errors.filter((e) => e.severity === "error").length === 0,
    transactions: normalizedTransactions,
    errors,
    summary,
  };
}

/**
 * Auto-detect format from content
 */
function detectFormat(content: string): MpesaStatementFormat {
  const firstLine = content.split("\n")[0].toLowerCase();

  // Check for CSV headers
  if (
    firstLine.includes("receipt") ||
    firstLine.includes("completion") ||
    firstLine.includes("transaction id")
  ) {
    return MpesaStatementFormat.CSV;
  }

  // Check for common delimiters (commas with multiple fields)
  const commaCount = (firstLine.match(/,/g) || []).length;
  if (commaCount >= 3) {
    return MpesaStatementFormat.CSV;
  }

  // Check for M-PESA SMS patterns
  if (/\b[A-Z]{2}\d{2}[A-Z0-9]{6}\b/.test(content)) {
    return MpesaStatementFormat.SMS;
  }

  // Default to text
  return MpesaStatementFormat.TEXT;
}

/**
 * Generate parse summary
 */
function generateSummary(
  transactions: NormalizedMpesaTransaction[],
  errors: ParseError[],
  duplicates: number
): ParseSummary {
  const summary: ParseSummary = {
    total: transactions.length,
    successful: transactions.filter((t) => t.confidence >= 0.7).length,
    failed: errors.filter((e) => e.severity === "error").length,
    duplicates,
    totalIncome: 0,
    totalExpense: 0,
    dateRange: {
      start: null,
      end: null,
    },
    merchants: [],
    categories: {},
  };

  // Calculate totals
  for (const transaction of transactions) {
    if (transaction.isIncome) {
      summary.totalIncome += transaction.amount;
    } else {
      summary.totalExpense += transaction.amount;
    }

    // Track date range
    if (!summary.dateRange.start || transaction.transactionDate < summary.dateRange.start) {
      summary.dateRange.start = transaction.transactionDate;
    }
    if (!summary.dateRange.end || transaction.transactionDate > summary.dateRange.end) {
      summary.dateRange.end = transaction.transactionDate;
    }

    // Track merchants
    if (transaction.normalizedMerchantName && !summary.merchants.includes(transaction.normalizedMerchantName)) {
      summary.merchants.push(transaction.normalizedMerchantName);
    }

    // Track categories
    const category = transaction.category;
    summary.categories[category] = (summary.categories[category] || 0) + transaction.amount;
  }

  return summary;
}

/**
 * Parse a single manual transaction entry
 */
export async function parseManualTransaction(data: {
  amount: number;
  date: Date;
  type: string;
  description: string;
  merchant?: string;
  phone?: string;
}): Promise<NormalizedMpesaTransaction> {
  // Generate a pseudo transaction code for manual entries
  const transactionCode = `MAN${Date.now().toString(36).toUpperCase()}`;

  const raw: RawMpesaTransaction = {
    transactionCode,
    amount: data.amount,
    date: data.date,
    rawType: data.type,
    merchantName: data.merchant,
    phoneNumber: data.phone,
    originalText: data.description,
    source: MpesaStatementFormat.MANUAL,
  };

  // Normalize it (now async with AI classification)
  const result = await normalizeMpesaTransactions([raw]);

  if (result.normalized.length > 0) {
    return result.normalized[0];
  }

  throw new Error("Failed to create manual transaction");
}

