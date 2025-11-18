/**
 * Merchant Name Normalizer
 *
 * Cleans and standardizes merchant names from MPESA transactions
 * Detects common aliases and maps them to canonical names
 */

import { MerchantAlias } from "@/types/mpesa";

// Common Kenyan merchant aliases
const MERCHANT_ALIASES: Record<string, string> = {
  // Supermarkets
  "NAIVAS": "Naivas Supermarket",
  "NAIVAS SUPERMARKET": "Naivas Supermarket",
  "NAIVAS SUPERMRKT": "Naivas Supermarket",
  "CARREFOUR": "Carrefour",
  "CARREFOUR KENYA": "Carrefour",
  "QUICKMART": "QuickMart Supermarket",
  "QUICK MART": "QuickMart Supermarket",
  "TUSKYS": "Tuskys Supermarket",
  "CHANDARANA": "Chandarana Foodplus",

  // Restaurants
  "KFC": "KFC Kenya",
  "KFC KENYA": "KFC Kenya",
  "JAVA": "Java House",
  "JAVA HOUSE": "Java House",
  "ARTCAFFE": "ArtCaffe",
  "GALITOS": "Galito's",
  "STEERS": "Steers",
  "DOMINOS": "Domino's Pizza",
  "DOMINOS PIZZA": "Domino's Pizza",

  // Utilities
  "KPLC": "Kenya Power (KPLC)",
  "KENYA POWER": "Kenya Power (KPLC)",
  "SAFARICOM": "Safaricom",
  "SAFARICOM PLC": "Safaricom",
  "AIRTEL": "Airtel Kenya",
  "AIRTEL KENYA": "Airtel Kenya",
  "TELKOM": "Telkom Kenya",
  "ZUKU": "Zuku",
  "DSTV": "DStv",
  "GOTV": "GOtv",

  // Transport
  "UBER": "Uber",
  "UBER KENYA": "Uber",
  "BOLT": "Bolt",
  "BOLT KENYA": "Bolt",
  "TOTAL": "Total Energies",
  "SHELL": "Shell",
  "KENOL": "Kenol Kobil",

  // Healthcare
  "GOODLIFE PHARMACY": "Goodlife Pharmacy",
  "GOODLIFE": "Goodlife Pharmacy",
  "AGA KHAN": "Aga Khan Hospital",
  "NAIROBI HOSPITAL": "Nairobi Hospital",

  // Online
  "JUMIA": "Jumia Kenya",
  "JUMIA KENYA": "Jumia Kenya",
  "NETFLIX": "Netflix",
  "SHOWMAX": "Showmax",
  "SPOTIFY": "Spotify",

  // Betting
  "SPORTPESA": "SportPesa",
  "BETIKA": "Betika",
  "MCHEZA": "Mcheza",
};

// Noise words to remove
const NOISE_WORDS = [
  "LTD",
  "LIMITED",
  "CO",
  "COMPANY",
  "KENYA",
  "NAIROBI",
  "MOMBASA",
  "KISUMU",
  "THE",
  "A",
  "AN",
  "AND",
  "&",
  ".",
  ",",
];

/**
 * Normalize a merchant name
 */
export function normalizeMerchantName(rawName: string): MerchantAlias {
  if (!rawName) {
    return {
      original: rawName,
      normalized: "Unknown Merchant",
      confidence: 0,
    };
  }

  // Step 1: Clean the name
  let cleaned = rawName
    .trim()
    .toUpperCase()
    .replace(/[^\w\s&\-]/g, "") // Remove special chars except &, -
    .replace(/\s+/g, " "); // Normalize spaces

  // Step 2: Check for exact alias match
  if (MERCHANT_ALIASES[cleaned]) {
    return {
      original: rawName,
      normalized: MERCHANT_ALIASES[cleaned],
      confidence: 1.0,
    };
  }

  // Step 3: Check for partial matches
  for (const [alias, canonical] of Object.entries(MERCHANT_ALIASES)) {
    if (cleaned.includes(alias) || alias.includes(cleaned)) {
      return {
        original: rawName,
        normalized: canonical,
        confidence: 0.85,
      };
    }
  }

  // Step 4: Remove noise words and format nicely
  const words = cleaned.split(" ");
  const filteredWords = words.filter((word) => !NOISE_WORDS.includes(word));

  const normalized = filteredWords
    .map((word) => {
      // Capitalize first letter, lowercase rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");

  return {
    original: rawName,
    normalized: normalized || "Unknown Merchant",
    confidence: 0.6,
  };
}

/**
 * Batch normalize merchant names
 */
export function batchNormalizeMerchants(names: (string | null)[]): MerchantAlias[] {
  return names.map((name) => normalizeMerchantName(name || ""));
}

/**
 * Find similar merchants (for grouping and analytics)
 */
export function findSimilarMerchants(
  merchantName: string,
  allMerchants: string[]
): string[] {
  const normalized = normalizeMerchantName(merchantName).normalized.toLowerCase();
  const similar: string[] = [];

  for (const merchant of allMerchants) {
    const merchantNormalized = normalizeMerchantName(merchant).normalized.toLowerCase();

    // Check if names are similar
    if (
      merchantNormalized === normalized ||
      merchantNormalized.includes(normalized) ||
      normalized.includes(merchantNormalized)
    ) {
      similar.push(merchant);
    }
  }

  return similar;
}

/**
 * Extract merchant category from name
 */
export function inferCategoryFromMerchant(merchantName: string): string | null {
  const normalized = merchantName.toUpperCase();

  const categoryKeywords: Record<string, string[]> = {
    Groceries: ["SUPERMARKET", "MART", "GROCERY", "FOOD"],
    Dining: ["RESTAURANT", "CAFE", "COFFEE", "PIZZA", "CHICKEN", "BURGER"],
    Transport: ["FUEL", "PETROL", "TAXI", "UBER", "BOLT", "PARKING"],
    Utilities: ["KPLC", "WATER", "INTERNET", "AIRTIME", "POWER"],
    Healthcare: ["PHARMACY", "HOSPITAL", "CLINIC", "MEDICAL"],
    Shopping: ["SHOP", "STORE", "FASHION", "ELECTRONICS"],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        return category;
      }
    }
  }

  return null;
}

/**
 * Get merchant spending summary
 */
export function getMerchantSpendingSummary(
  transactions: Array<{
    normalizedMerchantName: string | null;
    amount: number;
    isIncome: boolean;
  }>
): Array<{
  merchant: string;
  totalSpent: number;
  transactionCount: number;
  averageTransaction: number;
}> {
  const merchantStats = new Map<
    string,
    { totalSpent: number; transactionCount: number }
  >();

  // Only count expenses
  const expenses = transactions.filter((t) => !t.isIncome);

  for (const transaction of expenses) {
    const merchant = transaction.normalizedMerchantName || "Unknown";

    if (!merchantStats.has(merchant)) {
      merchantStats.set(merchant, { totalSpent: 0, transactionCount: 0 });
    }

    const stats = merchantStats.get(merchant)!;
    stats.totalSpent += transaction.amount;
    stats.transactionCount++;
  }

  // Convert to array and calculate averages
  const result = Array.from(merchantStats.entries()).map(([merchant, stats]) => ({
    merchant,
    totalSpent: stats.totalSpent,
    transactionCount: stats.transactionCount,
    averageTransaction: stats.totalSpent / stats.transactionCount,
  }));

  // Sort by total spent (descending)
  result.sort((a, b) => b.totalSpent - a.totalSpent);

  return result;
}

/**
 * Detect recurring merchants (subscriptions, regular payments)
 */
export function detectRecurringMerchants(
  transactions: Array<{
    normalizedMerchantName: string | null;
    amount: number;
    transactionDate: Date;
  }>,
  minOccurrences: number = 3
): Array<{
  merchant: string;
  frequency: number;
  averageAmount: number;
  isLikelySubscription: boolean;
}> {
  const merchantData = new Map<
    string,
    { amounts: number[]; dates: Date[] }
  >();

  for (const transaction of transactions) {
    const merchant = transaction.normalizedMerchantName || "Unknown";

    if (!merchantData.has(merchant)) {
      merchantData.set(merchant, { amounts: [], dates: [] });
    }

    const data = merchantData.get(merchant)!;
    data.amounts.push(transaction.amount);
    data.dates.push(transaction.transactionDate);
  }

  const recurring = [];

  for (const [merchant, data] of merchantData.entries()) {
    if (data.amounts.length >= minOccurrences) {
      const averageAmount = data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length;

      // Check if amounts are similar (subscription indicator)
      const amountVariance =
        data.amounts.reduce((sum, amount) => sum + Math.abs(amount - averageAmount), 0) /
        data.amounts.length;
      const isLikelySubscription = amountVariance / averageAmount < 0.1; // < 10% variance

      recurring.push({
        merchant,
        frequency: data.amounts.length,
        averageAmount,
        isLikelySubscription,
      });
    }
  }

  // Sort by frequency
  recurring.sort((a, b) => b.frequency - a.frequency);

  return recurring;
}

