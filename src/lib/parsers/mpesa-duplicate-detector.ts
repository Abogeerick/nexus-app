/**
 * MPESA Duplicate Detection
 *
 * Detects duplicate transactions using multiple strategies:
 * 1. Exact transaction code match
 * 2. Timestamp ±30 seconds + amount match
 * 3. Amount + phone number + date match
 * 4. Transaction hash match
 */

import { NormalizedMpesaTransaction, DuplicateMatch } from "@/types/mpesa";

export interface DuplicateDetectionOptions {
  timeWindowSeconds?: number; // Default: 30 seconds
  enableHashMatch?: boolean; // Default: true
  enableAmountPhoneMatch?: boolean; // Default: true
}

/**
 * Find duplicates in a batch of transactions
 * @param transactions - Array of normalized transactions
 * @param existingTransactions - Previously saved transactions to check against
 * @param options - Detection options
 * @returns Array of duplicate matches
 */
export function findDuplicates(
  transactions: NormalizedMpesaTransaction[],
  existingTransactions: NormalizedMpesaTransaction[] = [],
  options: DuplicateDetectionOptions = {}
): DuplicateMatch[] {
  const {
    timeWindowSeconds = 30,
    enableHashMatch = true,
    enableAmountPhoneMatch = true,
  } = options;

  const duplicates: DuplicateMatch[] = [];
  const allTransactions = [...existingTransactions, ...transactions];

  // Build lookup indices for faster matching
  const codeIndex = buildCodeIndex(allTransactions);
  const hashIndex = buildHashIndex(allTransactions);
  const amountPhoneIndex = buildAmountPhoneIndex(allTransactions);

  let exactCodeDuplicates = 0;
  let hashDuplicates = 0;
  let timeAmountDuplicates = 0;

  for (const transaction of transactions) {
    // Strategy 1: Exact transaction code match + SAME amount and timestamp
    // NOTE: M-PESA reuses transaction codes for related transactions (main + charges + overdraft)
    // So we CANNOT just match by code alone - we need amount AND timestamp to match
    const codeMatches = codeIndex.get(transaction.transactionCode) || [];
    for (const match of codeMatches) {
      if (match === transaction) continue; // Skip self

      // Only mark as duplicate if code, amount, AND timestamp are exactly the same
      const matchTime = match.timestamp instanceof Date ? match.timestamp.getTime() : new Date(match.timestamp).getTime();
      const txnTime = transaction.timestamp instanceof Date ? transaction.timestamp.getTime() : new Date(transaction.timestamp).getTime();
      
      if (
        match.amount === transaction.amount &&
        Math.abs(matchTime - txnTime) < 1000 // Within 1 second
      ) {
        duplicates.push({
          transaction,
          matchedTransaction: match,
          matchType: "exact",
          confidence: 1.0,
        });
        exactCodeDuplicates++;
      }
    }

    // Strategy 2: Transaction hash match
    if (enableHashMatch) {
      const hashMatches = hashIndex.get(transaction.transactionHash) || [];
      for (const match of hashMatches) {
        if (match === transaction) continue;
        if (isDuplicateAlreadyRecorded(duplicates, transaction, match)) continue;

        duplicates.push({
          transaction,
          matchedTransaction: match,
          matchType: "hash",
          confidence: 0.95,
        });
        hashDuplicates++;
      }
    }

    // Strategy 3: Time + Amount match (±30 seconds)
    const timeMatches = findTimeAmountMatches(
      transaction,
      allTransactions,
      timeWindowSeconds
    );
    for (const match of timeMatches) {
      if (match === transaction) continue;
      if (isDuplicateAlreadyRecorded(duplicates, transaction, match)) continue;

      duplicates.push({
        transaction,
        matchedTransaction: match,
        matchType: "time-amount",
        confidence: 0.85,
      });
      timeAmountDuplicates++;
    }

    // Strategy 4: Amount + Phone + Date match
    if (enableAmountPhoneMatch && transaction.counterpartyPhone) {
      const key = `${transaction.amount}-${transaction.counterpartyPhone}-${getDateKey(transaction.transactionDate)}`;
      const phoneMatches = amountPhoneIndex.get(key) || [];

      for (const match of phoneMatches) {
        if (match === transaction) continue;
        if (isDuplicateAlreadyRecorded(duplicates, transaction, match)) continue;

        duplicates.push({
          transaction,
          matchedTransaction: match,
          matchType: "hash",
          confidence: 0.80,
        });
      }
    }
  }

  console.log(`🔍 Duplicate Detection Summary:`);
  console.log(`   - Exact code+amount+time duplicates: ${exactCodeDuplicates}`);
  console.log(`   - Hash match duplicates: ${hashDuplicates}`);
  console.log(`   - Time+amount duplicates: ${timeAmountDuplicates}`);
  console.log(`   - Total duplicate matches: ${duplicates.length}`);

  return duplicates;
}

/**
 * Build index by transaction code
 */
function buildCodeIndex(
  transactions: NormalizedMpesaTransaction[]
): Map<string, NormalizedMpesaTransaction[]> {
  const index = new Map<string, NormalizedMpesaTransaction[]>();

  for (const transaction of transactions) {
    const code = transaction.transactionCode;
    if (!index.has(code)) {
      index.set(code, []);
    }
    index.get(code)!.push(transaction);
  }

  return index;
}

/**
 * Build index by transaction hash
 */
function buildHashIndex(
  transactions: NormalizedMpesaTransaction[]
): Map<string, NormalizedMpesaTransaction[]> {
  const index = new Map<string, NormalizedMpesaTransaction[]>();

  for (const transaction of transactions) {
    const hash = transaction.transactionHash;
    if (!index.has(hash)) {
      index.set(hash, []);
    }
    index.get(hash)!.push(transaction);
  }

  return index;
}

/**
 * Build index by amount + phone + date
 */
function buildAmountPhoneIndex(
  transactions: NormalizedMpesaTransaction[]
): Map<string, NormalizedMpesaTransaction[]> {
  const index = new Map<string, NormalizedMpesaTransaction[]>();

  for (const transaction of transactions) {
    if (!transaction.counterpartyPhone) continue;

    const key = `${transaction.amount}-${transaction.counterpartyPhone}-${getDateKey(transaction.transactionDate)}`;

    if (!index.has(key)) {
      index.set(key, []);
    }
    index.get(key)!.push(transaction);
  }

  return index;
}

/**
 * Find transactions within time window with same amount
 */
function findTimeAmountMatches(
  transaction: NormalizedMpesaTransaction,
  allTransactions: NormalizedMpesaTransaction[],
  timeWindowSeconds: number
): NormalizedMpesaTransaction[] {
  const matches: NormalizedMpesaTransaction[] = [];
  const windowMs = timeWindowSeconds * 1000;

  for (const other of allTransactions) {
    if (other === transaction) continue;

    // Same amount
    if (Math.abs(other.amount - transaction.amount) > 0.01) continue;

    // Within time window
    const timeDiff = Math.abs(other.timestamp - transaction.timestamp);
    if (timeDiff <= windowMs) {
      matches.push(other);
    }
  }

  return matches;
}

/**
 * Get date key (YYYY-MM-DD) for grouping
 */
function getDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Check if duplicate match already recorded
 */
function isDuplicateAlreadyRecorded(
  duplicates: DuplicateMatch[],
  transaction: NormalizedMpesaTransaction,
  matchedTransaction: NormalizedMpesaTransaction
): boolean {
  return duplicates.some(
    (d) =>
      (d.transaction === transaction && d.matchedTransaction === matchedTransaction) ||
      (d.transaction === matchedTransaction && d.matchedTransaction === transaction)
  );
}

/**
 * Remove duplicates from transaction list (keep first occurrence)
 * @param transactions - Array of transactions
 * @param duplicates - Array of duplicate matches
 * @returns Filtered transactions without duplicates
 */
export function removeDuplicates(
  transactions: NormalizedMpesaTransaction[],
  duplicates: DuplicateMatch[]
): NormalizedMpesaTransaction[] {
  const toRemove = new Set<NormalizedMpesaTransaction>();

  // Mark duplicates for removal (keep matched transaction, remove duplicate)
  for (const dup of duplicates) {
    toRemove.add(dup.transaction);
  }

  return transactions.filter((t) => !toRemove.has(t));
}

/**
 * Get duplicate statistics
 */
export function getDuplicateStats(duplicates: DuplicateMatch[]): {
  total: number;
  byType: Record<string, number>;
  highConfidence: number;
} {
  const byType: Record<string, number> = {};
  let highConfidence = 0;

  for (const dup of duplicates) {
    byType[dup.matchType] = (byType[dup.matchType] || 0) + 1;
    if (dup.confidence >= 0.9) highConfidence++;
  }

  return {
    total: duplicates.length,
    byType,
    highConfidence,
  };
}

