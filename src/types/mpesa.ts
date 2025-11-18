/**
 * MPESA Transaction Types
 *
 * Comprehensive type definitions for MPESA transactions
 */

export enum MpesaTransactionType {
  // Money received
  RECEIVED_FROM_PERSON = "RECEIVED_FROM_PERSON",
  RECEIVED_FROM_BUSINESS = "RECEIVED_FROM_BUSINESS",
  RECEIVED_FROM_AGENT = "RECEIVED_FROM_AGENT",
  REVERSAL_RECEIVED = "REVERSAL_RECEIVED",

  // Money sent
  SENT_TO_PERSON = "SENT_TO_PERSON",
  SENT_TO_BUSINESS = "SENT_TO_BUSINESS",
  SENT_TO_AGENT = "SENT_TO_AGENT",

  // Withdrawals
  WITHDRAW_AT_AGENT = "WITHDRAW_AT_AGENT",
  WITHDRAW_AT_ATM = "WITHDRAW_AT_ATM",

  // Payments
  PAYBILL = "PAYBILL",
  BUY_GOODS = "BUY_GOODS",
  LIPA_NA_MPESA = "LIPA_NA_MPESA",

  // Airtime & Bills
  AIRTIME_PURCHASE = "AIRTIME_PURCHASE",
  AIRTIME_FOR_OTHER = "AIRTIME_FOR_OTHER",
  FULIZA_LOAN = "FULIZA_LOAN",
  FULIZA_REPAYMENT = "FULIZA_REPAYMENT",

  // Other
  REVERSAL_SENT = "REVERSAL_SENT",
  UNKNOWN = "UNKNOWN",
}

export enum MpesaStatementFormat {
  CSV = "CSV",
  SMS = "SMS",
  TEXT = "TEXT",
  MANUAL = "MANUAL",
}

export interface RawMpesaTransaction {
  // Core fields (from all formats)
  transactionCode?: string; // e.g., "SH12ABC3XY"
  amount?: number;
  balance?: number;
  date?: Date | string;
  time?: string;

  // Parties involved
  recipient?: string; // Person/business who received money
  sender?: string; // Person/business who sent money
  merchantName?: string;
  phoneNumber?: string;

  // Business identifiers
  paybillNumber?: string;
  tillNumber?: string;
  accountNumber?: string;

  // Type identification
  type?: MpesaTransactionType | string;
  rawType?: string; // Original type string from source

  // Original text
  originalText?: string;
  source?: MpesaStatementFormat;

  // Metadata
  parseError?: string;
  confidence?: number; // 0-1, how confident we are in the parse
}

export interface NormalizedMpesaTransaction {
  // Unique identifiers
  transactionCode: string;
  transactionHash: string; // For duplicate detection

  // Financial data
  amount: number;
  balanceAfter: number | null;
  currency: string; // Default "KES"

  // Timestamp
  transactionDate: Date;
  timestamp: number; // Unix timestamp for easy comparison

  // Transaction type
  type: MpesaTransactionType;
  category: string; // Derived category (e.g., "Groceries", "Transport")
  isIncome: boolean; // True if money coming in

  // Parties
  counterpartyName: string; // Normalized name of other party
  counterpartyPhone: string | null;
  merchantName: string | null;
  normalizedMerchantName: string | null; // Cleaned merchant name

  // Business identifiers
  paybillNumber: string | null;
  tillNumber: string | null;
  accountNumber: string | null;

  // Metadata
  description: string; // Human-readable description
  source: MpesaStatementFormat;
  originalText: string;
  confidence: number;
  parseErrors: string[];

  // AI enhancements (optional)
  aiCategory?: string;
  aiMerchantName?: string;
  aiConfidence?: number;
  isAnomaly?: boolean;
  anomalyReason?: string;
}

export interface ParseResult {
  success: boolean;
  transactions: NormalizedMpesaTransaction[];
  errors: ParseError[];
  summary: ParseSummary;
}

export interface ParseError {
  line: number;
  rawText: string;
  error: string;
  severity: "warning" | "error";
}

export interface ParseSummary {
  total: number;
  successful: number;
  failed: number;
  duplicates: number;
  totalIncome: number;
  totalExpense: number;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  merchants: string[];
  categories: Record<string, number>;
}

export interface MerchantAlias {
  original: string;
  normalized: string;
  category?: string;
  confidence: number;
}

export interface DuplicateMatch {
  transaction: NormalizedMpesaTransaction;
  matchedTransaction: NormalizedMpesaTransaction;
  matchType: "exact" | "code" | "time-amount" | "hash";
  confidence: number;
}

export interface ClassificationResult {
  category: string;
  subcategory?: string;
  confidence: number;
  reasoning?: string;
}

export interface CleaningResult {
  original: RawMpesaTransaction;
  cleaned: RawMpesaTransaction;
  changes: string[];
  confidence: number;
}

