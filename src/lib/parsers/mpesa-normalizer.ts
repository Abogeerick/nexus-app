/**
 * MPESA Transaction Normalizer
 *
 * Converts raw parsed transactions into normalized format
 * - Standard dates
 * - Clean amounts
 * - Categorized types
 * - Hash generation for duplicate detection
 */

import {
  RawMpesaTransaction,
  NormalizedMpesaTransaction,
  MpesaTransactionType,
  ParseError,
  MpesaStatementFormat,
} from "@/types/mpesa";
import crypto from "crypto";

export function normalizeMpesaTransactions(
  rawTransactions: RawMpesaTransaction[]
): { normalized: NormalizedMpesaTransaction[]; errors: ParseError[] } {
  const normalized: NormalizedMpesaTransaction[] = [];
  const errors: ParseError[] = [];

  for (let i = 0; i < rawTransactions.length; i++) {
    try {
      const norm = normalizeTransaction(rawTransactions[i]);
      if (norm) {
        normalized.push(norm);
      } else {
        errors.push({
          line: i + 1,
          rawText: rawTransactions[i].originalText || "",
          error: "Failed to normalize transaction",
          severity: "error",
        });
      }
    } catch (error) {
      errors.push({
        line: i + 1,
        rawText: rawTransactions[i].originalText || "",
        error: error instanceof Error ? error.message : "Unknown normalization error",
        severity: "error",
      });
    }
  }

  return { normalized, errors };
}

function normalizeTransaction(
  raw: RawMpesaTransaction
): NormalizedMpesaTransaction | null {
  // Must have transaction code and amount
  if (!raw.transactionCode || !raw.amount || raw.amount <= 0) {
    return null;
  }

  const parseErrors: string[] = [];

  // Parse date
  const transactionDate = parseDate(raw.date, raw.time);
  if (!transactionDate) {
    parseErrors.push("Could not parse transaction date");
    return null;
  }

  // Determine transaction type
  const type = determineTransactionType(raw);
  const isIncome = isIncomeTransaction(type);

  // Determine counterparty
  const counterpartyName = determineCounterparty(raw, type);

  // Clean merchant name
  const merchantName = raw.merchantName || null;
  const normalizedMerchantName = merchantName ? cleanMerchantName(merchantName) : null;

  // Build description
  const description = buildDescription(raw, type, counterpartyName);

  // Generate hash for duplicate detection
  const transactionHash = generateTransactionHash(raw, transactionDate);

  // Calculate confidence
  const confidence = calculateConfidence(raw, parseErrors);

  return {
    transactionCode: raw.transactionCode,
    transactionHash,
    amount: Math.abs(raw.amount),
    balanceAfter: raw.balance || null,
    currency: "KES",
    transactionDate,
    timestamp: transactionDate.getTime(),
    type,
    category: categorizeTransaction(type, merchantName),
    isIncome,
    counterpartyName,
    counterpartyPhone: normalizePhone(raw.phoneNumber),
    merchantName,
    normalizedMerchantName,
    paybillNumber: raw.paybillNumber || null,
    tillNumber: raw.tillNumber || null,
    accountNumber: raw.accountNumber || null,
    description,
    source: raw.source || MpesaStatementFormat.MANUAL,
    originalText: raw.originalText || "",
    confidence,
    parseErrors,
  };
}

/**
 * Parse date from various formats
 */
function parseDate(dateStr: string | Date | undefined, timeStr?: string): Date | null {
  if (!dateStr) return null;

  if (dateStr instanceof Date) return dateStr;

  try {
    // Try parsing directly
    let date = new Date(dateStr);

    if (isNaN(date.getTime())) {
      // Try common M-PESA formats: DD/MM/YY or DD/MM/YYYY
      const parts = dateStr.split(/[\/\-]/);
      if (parts.length === 3) {
        let [day, month, year] = parts.map((p) => parseInt(p, 10));

        // Convert 2-digit year to 4-digit
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }

        date = new Date(year, month - 1, day);
      }
    }

    // Add time if provided
    if (timeStr && !isNaN(date.getTime())) {
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
        const meridiem = timeMatch[4];

        // Convert to 24-hour format
        if (meridiem) {
          if (meridiem.toUpperCase() === "PM" && hours < 12) hours += 12;
          if (meridiem.toUpperCase() === "AM" && hours === 12) hours = 0;
        }

        date.setHours(hours, minutes, seconds);
      }
    }

    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Determine transaction type from raw data
 */
function determineTransactionType(raw: RawMpesaTransaction): MpesaTransactionType {
  const rawType = (raw.rawType || "").toLowerCase();

  // Check explicit type mappings
  if (rawType.includes("receiv")) {
    if (raw.sender && /agent/i.test(raw.sender)) {
      return MpesaTransactionType.RECEIVED_FROM_AGENT;
    }
    return MpesaTransactionType.RECEIVED_FROM_PERSON;
  }

  if (rawType.includes("sent")) {
    if (raw.recipient && /agent/i.test(raw.recipient)) {
      return MpesaTransactionType.SENT_TO_AGENT;
    }
    return MpesaTransactionType.SENT_TO_PERSON;
  }

  if (rawType.includes("paybill") || raw.paybillNumber) {
    return MpesaTransactionType.PAYBILL;
  }

  if (rawType.includes("buygoods") || rawType.includes("buy goods") || raw.tillNumber) {
    return MpesaTransactionType.BUY_GOODS;
  }

  if (rawType.includes("withdraw")) {
    if (rawType.includes("atm")) {
      return MpesaTransactionType.WITHDRAW_AT_ATM;
    }
    return MpesaTransactionType.WITHDRAW_AT_AGENT;
  }

  if (rawType.includes("airtime")) {
    if (rawType.includes("other")) {
      return MpesaTransactionType.AIRTIME_FOR_OTHER;
    }
    return MpesaTransactionType.AIRTIME_PURCHASE;
  }

  if (rawType.includes("fuliza")) {
    if (rawType.includes("repay")) {
      return MpesaTransactionType.FULIZA_REPAYMENT;
    }
    return MpesaTransactionType.FULIZA_LOAN;
  }

  if (rawType.includes("revers")) {
    return MpesaTransactionType.REVERSAL_RECEIVED;
  }

  if (rawType.includes("payment") || rawType.includes("paid")) {
    if (raw.tillNumber) return MpesaTransactionType.BUY_GOODS;
    if (raw.paybillNumber) return MpesaTransactionType.PAYBILL;
    return MpesaTransactionType.LIPA_NA_MPESA;
  }

  return MpesaTransactionType.UNKNOWN;
}

/**
 * Check if transaction type is income
 */
function isIncomeTransaction(type: MpesaTransactionType): boolean {
  return [
    MpesaTransactionType.RECEIVED_FROM_PERSON,
    MpesaTransactionType.RECEIVED_FROM_BUSINESS,
    MpesaTransactionType.RECEIVED_FROM_AGENT,
    MpesaTransactionType.REVERSAL_RECEIVED,
    MpesaTransactionType.FULIZA_LOAN,
  ].includes(type);
}

/**
 * Determine counterparty name
 */
function determineCounterparty(raw: RawMpesaTransaction, type: MpesaTransactionType): string {
  if (raw.sender) return cleanName(raw.sender);
  if (raw.recipient) return cleanName(raw.recipient);
  if (raw.merchantName) return cleanName(raw.merchantName);

  // Default names based on type
  if (type === MpesaTransactionType.WITHDRAW_AT_ATM) return "ATM Withdrawal";
  if (type === MpesaTransactionType.WITHDRAW_AT_AGENT) return "M-PESA Agent";
  if (type === MpesaTransactionType.AIRTIME_PURCHASE) return "Safaricom Airtime";

  return "Unknown";
}

/**
 * Clean merchant name (remove noise, standardize)
 */
export function cleanMerchantName(name: string): string {
  return cleanName(name)
    .replace(/\bLTD\b\.?/gi, "Ltd")
    .replace(/\bLIMITED\b/gi, "Limited")
    .replace(/\bCO\b\.?/gi, "Co")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Clean person/merchant name
 */
function cleanName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ") // Multiple spaces to single
    .replace(/[^\w\s\-&]/g, "") // Remove special chars except dash and ampersand
    .toUpperCase();
}

/**
 * Normalize phone number
 */
function normalizePhone(phone: string | undefined): string | null {
  if (!phone) return null;

  // Remove non-digits
  const cleaned = phone.replace(/\D/g, "");

  // Kenya format: 254XXXXXXXXX
  if (cleaned.startsWith("254") && cleaned.length === 12) {
    return cleaned;
  }

  // Add country code if missing
  if (cleaned.length === 10 && cleaned.startsWith("0")) {
    return "254" + cleaned.substring(1);
  }

  if (cleaned.length === 9) {
    return "254" + cleaned;
  }

  return cleaned || null;
}

/**
 * Build human-readable description
 */
function buildDescription(
  raw: RawMpesaTransaction,
  type: MpesaTransactionType,
  counterparty: string
): string {
  const amount = `KES ${raw.amount?.toLocaleString() || "0"}`;

  switch (type) {
    case MpesaTransactionType.RECEIVED_FROM_PERSON:
    case MpesaTransactionType.RECEIVED_FROM_BUSINESS:
      return `Received ${amount} from ${counterparty}`;
    case MpesaTransactionType.SENT_TO_PERSON:
      return `Sent ${amount} to ${counterparty}`;
    case MpesaTransactionType.PAYBILL:
      return `Paid ${amount} to ${counterparty}${raw.accountNumber ? ` (Acc: ${raw.accountNumber})` : ""}`;
    case MpesaTransactionType.BUY_GOODS:
      return `Bought goods ${amount} at ${counterparty}${raw.tillNumber ? ` (Till: ${raw.tillNumber})` : ""}`;
    case MpesaTransactionType.WITHDRAW_AT_AGENT:
      return `Withdrew ${amount} at ${counterparty}`;
    case MpesaTransactionType.WITHDRAW_AT_ATM:
      return `Withdrew ${amount} at ATM`;
    case MpesaTransactionType.AIRTIME_PURCHASE:
      return `Bought ${amount} airtime`;
    default:
      return `${type} - ${amount}`;
  }
}

/**
 * Categorize transaction for analytics
 */
function categorizeTransaction(type: MpesaTransactionType, merchantName: string | null): string {
  // AI will improve this, but provide basic categorization
  if (type === MpesaTransactionType.AIRTIME_PURCHASE) return "Utilities";
  if (type === MpesaTransactionType.WITHDRAW_AT_AGENT || type === MpesaTransactionType.WITHDRAW_AT_ATM)
    return "Cash Withdrawal";
  if (type === MpesaTransactionType.FULIZA_LOAN || type === MpesaTransactionType.FULIZA_REPAYMENT)
    return "Loan";

  // Merchant-based categorization
  if (merchantName) {
    const lower = merchantName.toLowerCase();
    if (/supermarket|grocery|shop|store|mart/i.test(lower)) return "Groceries";
    if (/restaurant|cafe|food|eat/i.test(lower)) return "Dining";
    if (/fuel|petrol|gas|station/i.test(lower)) return "Fuel";
    if (/pharmacy|hospital|clinic|health/i.test(lower)) return "Healthcare";
    if (/school|university|college|education/i.test(lower)) return "Education";
  }

  // Default categories by type
  if (type === MpesaTransactionType.RECEIVED_FROM_PERSON) return "Income";
  if (type === MpesaTransactionType.SENT_TO_PERSON) return "Transfer";

  return "Other";
}

/**
 * Generate hash for duplicate detection
 */
function generateTransactionHash(raw: RawMpesaTransaction, date: Date): string {
  // Hash based on: transaction code + date + amount
  const hashInput = `${raw.transactionCode}|${date.toISOString()}|${raw.amount}`;
  return crypto.createHash("sha256").update(hashInput).digest("hex").substring(0, 16);
}

/**
 * Calculate confidence score (0-1)
 */
function calculateConfidence(raw: RawMpesaTransaction, errors: string[]): number {
  let score = 1.0;

  // Penalize for missing fields
  if (!raw.balance) score -= 0.1;
  if (!raw.date) score -= 0.2;
  if (!raw.phoneNumber && !raw.merchantName) score -= 0.1;
  if (errors.length > 0) score -= 0.1 * errors.length;

  // Penalize for unknown type
  if (raw.rawType === "Unknown") score -= 0.2;

  return Math.max(0, Math.min(1, score));
}

