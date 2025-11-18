/**
 * MPESA Transaction Classifier
 *
 * AI-powered transaction categorization
 * Phase 1: Rule-based classification (works offline, fast)
 * Phase 2: Can be extended with transformers.js for ML-based classification
 */

import { ClassificationResult } from "@/types/mpesa";

// Category rules with keywords and patterns
const CATEGORY_RULES = {
  Groceries: {
    keywords: [
      "supermarket",
      "grocery",
      "mart",
      "naivas",
      "carrefour",
      "quickmart",
      "tuskys",
      "chandarana",
      "cleanshelf",
      "food",
      "vegetables",
      "fruits",
    ],
    tillPatterns: [],
  },
  Dining: {
    keywords: [
      "restaurant",
      "cafe",
      "coffee",
      "pizza",
      "chicken",
      "burger",
      "kfc",
      "java",
      "artcaffe",
      "dominos",
      "subway",
      "galitos",
      "steers",
      "eat",
      "dining",
      "hotel",
    ],
    tillPatterns: [],
  },
  Transport: {
    keywords: [
      "uber",
      "bolt",
      "taxi",
      "matatu",
      "bus",
      "fuel",
      "petrol",
      "diesel",
      "total",
      "shell",
      "kenol",
      "parking",
      "transport",
    ],
    tillPatterns: [],
  },
  Utilities: {
    keywords: [
      "kplc",
      "electricity",
      "water",
      "nairobi water",
      "internet",
      "safaricom",
      "airtel",
      "telkom",
      "airtime",
      "data",
      "zuku",
      "dstv",
      "gotv",
      "startimes",
    ],
    tillPatterns: [],
  },
  Healthcare: {
    keywords: [
      "pharmacy",
      "hospital",
      "clinic",
      "medical",
      "doctor",
      "health",
      "aga khan",
      "nairobi hospital",
      "meridian",
      "avenue",
      "goodlife",
    ],
    tillPatterns: [],
  },
  Education: {
    keywords: [
      "school",
      "university",
      "college",
      "academy",
      "tuition",
      "education",
      "books",
      "stationery",
    ],
    tillPatterns: [],
  },
  Entertainment: {
    keywords: [
      "cinema",
      "movie",
      "imax",
      "prestige",
      "netflix",
      "showmax",
      "spotify",
      "youtube",
      "game",
      "betting",
      "sportpesa",
      "betika",
    ],
    tillPatterns: [],
  },
  Shopping: {
    keywords: [
      "jumia",
      "amazon",
      "shop",
      "store",
      "fashion",
      "clothes",
      "shoes",
      "electronics",
      "bata",
      "zara",
    ],
    tillPatterns: [],
  },
  Financial: {
    keywords: [
      "bank",
      "loan",
      "fuliza",
      "credit",
      "investment",
      "savings",
      "insurance",
      "cic",
      "britam",
      "jubilee",
      "kcb",
      "equity",
      "coop",
    ],
    tillPatterns: [],
  },
  "Rent & Bills": {
    keywords: ["rent", "lease", "landlord", "tenant", "caretaker"],
    tillPatterns: [],
  },
};

/**
 * Classify a transaction based on merchant name and description
 */
export function classifyTransaction(
  merchantName: string | null,
  description: string,
  type: string
): ClassificationResult {
  // Special cases based on transaction type
  if (type === "AIRTIME_PURCHASE" || type === "AIRTIME_FOR_OTHER") {
    return {
      category: "Utilities",
      subcategory: "Airtime",
      confidence: 1.0,
      reasoning: "Airtime purchase transaction",
    };
  }

  if (type === "WITHDRAW_AT_AGENT" || type === "WITHDRAW_AT_ATM") {
    return {
      category: "Cash Withdrawal",
      confidence: 1.0,
      reasoning: "Cash withdrawal transaction",
    };
  }

  if (type === "FULIZA_LOAN") {
    return {
      category: "Financial",
      subcategory: "Loan",
      confidence: 1.0,
      reasoning: "Fuliza loan transaction",
    };
  }

  if (type === "FULIZA_REPAYMENT") {
    return {
      category: "Financial",
      subcategory: "Loan Repayment",
      confidence: 1.0,
      reasoning: "Fuliza repayment transaction",
    };
  }

  // Handle charges and fees
  if (type === "Charge" || 
      merchantName?.toLowerCase().includes("transfer fee") ||
      merchantName?.toLowerCase().includes("safaricom fee") ||
      description?.toLowerCase().includes("charge")) {
    return {
      category: "Financial",
      subcategory: "Fees & Charges",
      confidence: 0.95,
      reasoning: "Safaricom transaction charge or fee",
    };
  }

  if (type === "RECEIVED_FROM_PERSON") {
    return {
      category: "Income",
      subcategory: "Personal Transfer",
      confidence: 0.9,
      reasoning: "Money received from person",
    };
  }

  if (type === "SENT_TO_PERSON") {
    return {
      category: "Transfer",
      subcategory: "Personal Transfer",
      confidence: 0.9,
      reasoning: "Money sent to person",
    };
  }

  // Combine merchant name and description for analysis
  const text = `${merchantName || ""} ${description}`.toLowerCase();

  // Check each category
  let bestMatch: ClassificationResult = {
    category: "Other",
    confidence: 0.3,
    reasoning: "No matching category found",
  };

  for (const [category, rules] of Object.entries(CATEGORY_RULES)) {
    let matches = 0;
    let totalKeywords = rules.keywords.length;

    for (const keyword of rules.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        matches++;
      }
    }

    if (matches > 0) {
      const confidence = Math.min(0.6 + matches * 0.15, 0.95);

      if (confidence > bestMatch.confidence) {
        bestMatch = {
          category,
          confidence,
          reasoning: `Matched ${matches} keyword(s) for ${category}`,
        };
      }
    }
  }

  return bestMatch;
}

/**
 * Batch classify multiple transactions
 */
export function batchClassify(
  transactions: Array<{
    merchantName: string | null;
    description: string;
    type: string;
  }>
): ClassificationResult[] {
  return transactions.map((t) =>
    classifyTransaction(t.merchantName, t.description, t.type)
  );
}

/**
 * Suggest category improvements based on user corrections
 * This learns from user feedback (future: can train a simple model)
 */
export function learnFromCorrection(
  originalCategory: string,
  correctedCategory: string,
  merchantName: string,
  description: string
): void {
  // Future: Store user corrections in a learning database
  // For now, this is a placeholder for ML integration
  console.log("Learning from correction:", {
    originalCategory,
    correctedCategory,
    merchantName,
    description,
  });
}

/**
 * Get category statistics for insights
 */
export function getCategoryStats(
  transactions: Array<{ category: string; amount: number; isIncome: boolean }>
): Record<string, { count: number; total: number; percentage: number }> {
  const stats: Record<string, { count: number; total: number }> = {};
  let totalAmount = 0;

  // Only count expenses for percentage calculation
  const expenses = transactions.filter((t) => !t.isIncome);

  for (const transaction of expenses) {
    const category = transaction.category;
    if (!stats[category]) {
      stats[category] = { count: 0, total: 0 };
    }
    stats[category].count++;
    stats[category].total += transaction.amount;
    totalAmount += transaction.amount;
  }

  // Calculate percentages
  const result: Record<string, { count: number; total: number; percentage: number }> = {};
  for (const [category, data] of Object.entries(stats)) {
    result[category] = {
      ...data,
      percentage: totalAmount > 0 ? (data.total / totalAmount) * 100 : 0,
    };
  }

  return result;
}

