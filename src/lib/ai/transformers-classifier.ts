/**
 * Transformers.js AI Classifier
 * 
 * Uses zero-shot classification with MobileBERT to categorize M-PESA transactions
 * Features:
 * - Offline/local inference (no API calls)
 * - Model caching (singleton pattern)
 * - Graceful fallback on errors
 * - Timeout handling
 */

import { pipeline } from "@xenova/transformers";
import { ClassificationResult } from "@/types/mpesa";

// Categories for zero-shot classification
const CATEGORIES = [
  "Groceries",
  "Dining",
  "Transport",
  "Utilities",
  "Healthcare",
  "Education",
  "Entertainment",
  "Shopping",
  "Financial",
  "Income",
  "Other",
];

// Global model cache (singleton)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let classifierInstance: any | null = null;
let isLoadingModel = false;
let modelLoadError: Error | null = null;

/**
 * Initialize and cache the classifier model
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getClassifier(): Promise<any | null> {
  // Return cached instance if available
  if (classifierInstance) {
    return classifierInstance;
  }

  // Return null if previous load failed
  if (modelLoadError) {
    console.warn("⚠️ Model loading previously failed, using fallback classifier");
    return null;
  }

  // Wait if model is currently loading
  if (isLoadingModel) {
    let attempts = 0;
    while (isLoadingModel && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    return classifierInstance;
  }

  // Load the model
  isLoadingModel = true;
  try {
    console.log("🤖 Loading AI classification model...");
    const startTime = Date.now();
    
    // Use MobileBERT for lightweight, fast inference
    classifierInstance = await pipeline(
      "zero-shot-classification",
      "Xenova/mobilebert-uncased-mnli",
      {
        quantized: true, // Use quantized version for faster inference
        revision: "main", // Use main branch for stability
        cache_dir: undefined, // Use default cache
      }
    );
    
    const loadTime = Date.now() - startTime;
    console.log(`✅ AI model loaded successfully in ${loadTime}ms`);
    
    isLoadingModel = false;
    return classifierInstance;
  } catch (error) {
    console.error("❌ Failed to load AI model:", error);
    console.error("💡 Tip: Try clearing the model cache and restart the server");
    console.error("💡 Cache location: C:\\Users\\OPTIVEN-LIMITED\\.cache\\huggingface");
    modelLoadError = error instanceof Error ? error : new Error("Unknown model loading error");
    isLoadingModel = false;
    return null;
  }
}

/**
 * Classify a single transaction using AI
 */
export async function classifyTransactionWithAI(
  merchantName: string | null,
  description: string,
  amount: number,
  transactionType: string
): Promise<ClassificationResult | null> {
  try {
    // Get or load the classifier
    const classifier = await getClassifier();
    if (!classifier) {
      return null; // Model not available, use fallback
    }

    // Prepare input text
    const inputText = prepareInputText(merchantName, description, amount, transactionType);
    
    // Set timeout for classification (5 seconds max)
    const classificationPromise = classify(classifier, inputText);
    const timeoutPromise = new Promise<null>((resolve) => 
      setTimeout(() => resolve(null), 5000)
    );
    
    const result = await Promise.race([classificationPromise, timeoutPromise]);
    
    if (!result) {
      console.warn("⏱️ AI classification timeout, using fallback");
      return null;
    }
    
    return result;
  } catch (error) {
    console.error("❌ AI classification error:", error);
    return null; // Fallback to rule-based
  }
}

/**
 * Perform the actual classification
 */
async function classify(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  classifier: any,
  inputText: string
): Promise<ClassificationResult | null> {
  try {
    const startTime = Date.now();
    
    // Run zero-shot classification
    const result = await classifier(inputText, CATEGORIES, {
      multi_label: false, // Single category selection
    });
    
    const inferenceTime = Date.now() - startTime;
    
    // Extract top prediction
    const topCategory = result.labels[0];
    const topScore = result.scores[0];
    
    // Log performance
    if (inferenceTime > 500) {
      console.warn(`⚠️ Slow AI inference: ${inferenceTime}ms`);
    }
    
    // Build reasoning
    const reasoning = buildReasoning(result.labels, result.scores);
    
    return {
      category: topCategory,
      confidence: topScore,
      reasoning,
    };
  } catch (error) {
    console.error("Classification error:", error);
    return null;
  }
}

/**
 * Prepare input text for the model
 */
function prepareInputText(
  merchantName: string | null,
  description: string,
  amount: number,
  transactionType: string
): string {
  // Build a rich, natural language description for the classifier
  const parts: string[] = [];
  
  // Start with a clear statement about what this is
  parts.push("This is a payment transaction");
  
  // Add merchant context if available
  if (merchantName) {
    const cleanMerchant = cleanText(merchantName);
    parts.push(`at ${cleanMerchant}`);
    
    // Add specific merchant type hints
    if (/supermarket|mart|store|shop/i.test(merchantName)) {
      parts.push("for food and household items");
    } else if (/restaurant|cafe|kfc|java|pizza|burger|chicken/i.test(merchantName)) {
      parts.push("for dining and food");
    } else if (/pharmacy|hospital|clinic|health/i.test(merchantName)) {
      parts.push("for medical supplies or healthcare");
    } else if (/school|university|college|academy/i.test(merchantName)) {
      parts.push("for education");
    } else if (/uber|bolt|taxi/i.test(merchantName)) {
      parts.push("for transportation");
    }
  }
  
  // Add transaction type context with better descriptions
  const typeContext = getTypeContext(transactionType);
  if (typeContext) {
    parts.push(typeContext);
  }
  
  // Add amount context
  if (amount > 10000) {
    parts.push("this is a large purchase");
  } else if (amount < 100) {
    parts.push("this is a small transaction");
  }
  
  // Join into a natural sentence
  return parts.join(", ") + ".";
}

/**
 * Clean text for model input
 */
function cleanText(text: string): string {
  return text
    .replace(/[^\w\s]/g, " ") // Remove special characters
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim()
    .toLowerCase();
}

/**
 * Get contextual description for transaction type
 */
function getTypeContext(transactionType: string): string | null {
  const type = transactionType.toLowerCase();
  
  if (type.includes("airtime")) return "for mobile phone airtime or data bundle";
  if (type.includes("withdraw")) return "withdrawing cash from ATM or agent";
  if (type.includes("fuliza")) return "mobile overdraft loan or credit service";
  if (type.includes("paybill")) return "paying a bill or service";
  if (type.includes("buygoods") || type.includes("buy_goods")) return "purchasing goods or services from a merchant";
  if (type.includes("received")) return "receiving money from another person";
  if (type.includes("sent")) return "sending money to another person";
  
  return null;
}

/**
 * Build human-readable reasoning from classification results
 */
function buildReasoning(labels: string[], scores: number[]): string {
  const topScore = scores[0];
  const secondScore = scores[1];
  const topLabel = labels[0];
  
  if (topScore > 0.8) {
    return `High confidence classification as ${topLabel}`;
  }
  
  if (topScore > 0.6) {
    return `Classified as ${topLabel} with moderate confidence`;
  }
  
  if (topScore - secondScore < 0.1) {
    return `Uncertain between ${topLabel} and ${labels[1]}`;
  }
  
  return `Best match: ${topLabel} (confidence: ${(topScore * 100).toFixed(1)}%)`;
}

/**
 * Batch classify multiple transactions
 * Processes sequentially to avoid memory issues
 */
export async function batchClassifyWithAI(
  transactions: Array<{
    merchantName: string | null;
    description: string;
    amount: number;
    transactionType: string;
  }>
): Promise<Array<ClassificationResult | null>> {
  const results: Array<ClassificationResult | null> = [];
  
  // Process sequentially to avoid overwhelming the system
  for (const transaction of transactions) {
    const result = await classifyTransactionWithAI(
      transaction.merchantName,
      transaction.description,
      transaction.amount,
      transaction.transactionType
    );
    results.push(result);
  }
  
  return results;
}

/**
 * Check if AI classifier is available
 */
export function isAIClassifierAvailable(): boolean {
  return classifierInstance !== null && modelLoadError === null;
}

/**
 * Get model status information
 */
export function getModelStatus(): {
  loaded: boolean;
  loading: boolean;
  error: string | null;
} {
  return {
    loaded: classifierInstance !== null,
    loading: isLoadingModel,
    error: modelLoadError?.message || null,
  };
}

/**
 * Preload the model (optional, can be called at app startup)
 */
export async function preloadModel(): Promise<boolean> {
  try {
    const classifier = await getClassifier();
    return classifier !== null;
  } catch (error) {
    console.error("Failed to preload model:", error);
    return false;
  }
}

