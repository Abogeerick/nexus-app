/**
 * MPESA PDF Parser
 *
 * Parses MPESA PDF statements downloaded from Safaricom portal
 * Extracts text from PDF and then parses transactions
 */

import { RawMpesaTransaction, MpesaStatementFormat, ParseError } from "@/types/mpesa";

/**
 * Parse MPESA PDF file
 * @param pdfBuffer - PDF file as Buffer
 * @returns Array of raw transactions and errors
 */
export async function parseMpesaPDF(
  pdfBuffer: Buffer
): Promise<{ transactions: RawMpesaTransaction[]; errors: ParseError[] }> {
  const transactions: RawMpesaTransaction[] = [];
  const errors: ParseError[] = [];

  try {
    // Use pdf2json (Node.js native) with enhanced diagnostics
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const PDFParser = require("pdf2json");
    
    console.log("📄 Starting PDF extraction with pdf2json...");
    
    const extractText = (): Promise<{text: string, pageCount: number}> => {
      return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();

        pdfParser.on("pdfParser_dataError", (errData: any) => {
          reject(new Error(errData.parserError || "PDF parsing failed"));
        });

        pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
          try {
            let fullText = "";
            let pageCount = 0;
            let textsByPage: string[] = [];

            if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
              pageCount = pdfData.Pages.length;
              
              for (let pageNum = 0; pageNum < pdfData.Pages.length; pageNum++) {
                const page = pdfData.Pages[pageNum];
                let pageText = "";
                
                if (page.Texts && Array.isArray(page.Texts)) {
                  for (const text of page.Texts) {
                    if (text.R && Array.isArray(text.R)) {
                      for (const run of text.R) {
                        if (run.T) {
                          const decodedText = decodeURIComponent(run.T);
                          pageText += decodedText + " ";
                        }
                      }
                    }
                  }
                }
                
                textsByPage.push(pageText);
                fullText += pageText + "\n";
              }
              
              // Log sample from different pages
              console.log(`📄 Extracted ${pageCount} pages`);
              console.log(`📄 Page 1 length: ${textsByPage[0]?.length || 0} chars`);
              console.log(`📄 Page 10 length: ${textsByPage[9]?.length || 0} chars`);
              console.log(`📄 Page 30 length: ${textsByPage[29]?.length || 0} chars`);
              console.log(`📄 Page 68 length: ${textsByPage[67]?.length || 0} chars`);
            }

            resolve({text: fullText, pageCount});
          } catch (error) {
            reject(error);
          }
        });

        pdfParser.parseBuffer(pdfBuffer);
      });
    };

    const {text: fullText, pageCount} = await extractText();
    console.log(`✅ Extracted text from ${pageCount} pages (total: ${fullText.length} chars)`);

    if (!fullText || fullText.trim().length === 0) {
      errors.push({
        line: 0,
        rawText: "",
        error: "PDF contains no readable text",
        severity: "error",
      });
      return { transactions, errors };
    }

    // Debug: Log first and last 1000 characters of extracted text
    console.log("=== PDF TEXT EXTRACTED (first 1000 chars) ===");
    console.log(fullText.substring(0, 1000));
    console.log("\n=== PDF TEXT EXTRACTED (last 1000 chars) ===");
    console.log(fullText.substring(fullText.length - 1000));
    console.log("\n=== Total length:", fullText.length, "===");

    // Parse the extracted text
    const result = parsePDFText(fullText);
    
    // Debug: Log parsing result
    console.log("=== PARSING RESULT ===");
    console.log("Transactions found:", result.transactions.length);
    console.log("Errors:", result.errors.length);
    
    return result;
  } catch (error) {
    errors.push({
      line: 0,
      rawText: "",
      error: error instanceof Error ? error.message : "Failed to parse PDF",
      severity: "error",
    });
    return { transactions, errors };
  }
}

/**
 * Parse extracted PDF text into transactions
 */
function parsePDFText(text: string): {
  transactions: RawMpesaTransaction[];
  errors: ParseError[];
} {
  const transactions: RawMpesaTransaction[] = [];
  const errors: ParseError[] = [];

  console.log("=== STARTING PDF TEXT PARSING ===");

  // Find where the detailed statement starts
  const detailedStatementIndex = text.indexOf("DETAILED STATEMENT");
  if (detailedStatementIndex === -1) {
    console.log("❌ No 'DETAILED STATEMENT' section found, trying alternative parsing");
    // Try to find "Receipt No." instead
    const receiptIndex = text.indexOf("Receipt No.");
    if (receiptIndex === -1) {
      return parseAsTransactionMessages(text);
    }
    // Continue with receipt section
    const dataSection = text.substring(receiptIndex);
    return parseByTransactionCodes(dataSection, errors);
  }

  // Extract the detailed statement section
  const detailedSection = text.substring(detailedStatementIndex);
  return parseByTransactionCodes(detailedSection, errors);
}

/**
 * Parse text by splitting on transaction codes
 */
function parseByTransactionCodes(text: string, errors: ParseError[]): {
  transactions: RawMpesaTransaction[];
  errors: ParseError[];
} {
  const transactions: RawMpesaTransaction[] = [];

  // Find where the actual transaction data starts (after the header)
  const headerIndex = Math.max(
    text.indexOf("Receipt No."),
    text.indexOf("Completion Time"),
    text.indexOf("Transaction Status")
  );

  if (headerIndex === -1) {
    console.log("❌ No header found");
    return { transactions, errors };
  }

  // Move past the header line to get to transaction data
  // Skip ~200 chars to get past "Receipt No. Completion Time Details..." header
  const dataSection = text.substring(headerIndex + 200);
  
  console.log("📊 Data section length:", dataSection.length);

  // CRITICAL: Split by "CODE + DATE + TIME" pattern, not just CODE
  // Because M-PESA PDFs have MULTIPLE ROWS with the SAME transaction code
  // Each row in the PDF table is a SEPARATE transaction
  // Pattern: T or R followed by any letters/numbers (8-12 chars total) + date + time
  // Examples: TKHE4AFXVV, TEI788J129, RK12345678
  const txnRowPattern = /\b([TR][A-Z0-9]{7,11})\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/g;
  
  // Find all transaction rows and their positions
  const rowMatches = Array.from(dataSection.matchAll(txnRowPattern));
  console.log("🔍 Found transaction ROWS:", rowMatches.length);

  // Debug: Check if we're missing any transaction codes
  const allCodesPattern = /\b([TR][A-Z0-9]{7,11})\b/g;
  const allCodes = Array.from(dataSection.matchAll(allCodesPattern));
  console.log("📊 Total transaction CODE occurrences:", allCodes.length);
  console.log("⚠️  Rows without date/time:", allCodes.length - rowMatches.length);
  
  // Check for date patterns to see if older transactions exist in the text
  const datePattern = /2025-\d{2}-\d{2}/g;
  const allDates = Array.from(dataSection.matchAll(datePattern));
  const uniqueDates = [...new Set(allDates.map(m => m[0]))].sort();
  console.log(`📅 Date range in text: ${uniqueDates[0]} to ${uniqueDates[uniqueDates.length - 1]}`);
  console.log(`📅 Total unique dates found: ${uniqueDates.length}`);

  // Show some sample transaction rows
  if (rowMatches.length > 0) {
    const sampleRows = rowMatches.slice(0, 5).map(m => `${m[1]} ${m[2]} ${m[3]}`);
    console.log("📋 Sample rows:", sampleRows.join(" | "));
    
    // Show last few rows to see date range
    const lastRows = rowMatches.slice(-3).map(m => `${m[1]} ${m[2]}`);
    console.log("📅 Last transactions:", lastRows.join(" | "));
  }

  // Extract text block for each transaction ROW
  let skipped = 0;
  let validTransactions = 0;

  for (let i = 0; i < rowMatches.length; i++) {
    const currentMatch = rowMatches[i];
    const nextMatch = rowMatches[i + 1];
    
    const startPos = currentMatch.index || 0;
    const endPos = nextMatch ? (nextMatch.index || dataSection.length) : dataSection.length;
    
    const transactionBlock = dataSection.substring(startPos, endPos).trim();
    const transactionCode = currentMatch[1];
    const transactionDate = currentMatch[2];
    const transactionTime = currentMatch[3];

    // Skip if block is too short (likely not a full transaction)
    if (transactionBlock.length < 20) {
      skipped++;
      continue;
    }
    
    // Skip verification codes and other non-transaction codes
    if (transactionCode.match(/^CTX|^STK|^CODE/)) {
      skipped++;
      continue;
    }
    
    // Skip if it looks like a header repetition
    if (transactionBlock.includes("Receipt No.") && transactionBlock.includes("Completion Time")) {
      skipped++;
      continue;
    }

    try {
      const transaction = parseTransactionBlock(
        transactionBlock,
        transactionCode,
        transactionDate,
        transactionTime,
        i + 1
      );
      if (transaction) {
        transaction.source = MpesaStatementFormat.PDF;
        transaction.originalText = transactionBlock.substring(0, 500); // Limit to 500 chars
        transactions.push(transaction);
        validTransactions++;
      } else {
        skipped++;
      }
    } catch (error) {
      errors.push({
        line: i + 1,
        rawText: transactionBlock.substring(0, 100),
        error: error instanceof Error ? error.message : "Failed to parse transaction",
        severity: "warning",
      });
    }
  }

  console.log("✅ Valid transactions:", validTransactions);
  console.log("⏭️  Skipped blocks:", skipped);
  console.log("⚠️  Errors:", errors.length);

  return { transactions, errors };
}

/**
 * Parse a transaction block extracted from PDF
 */
function parseTransactionBlock(
  block: string,
  transactionCode: string,
  transactionDate: string,
  transactionTime: string,
  blockNumber: number
): RawMpesaTransaction | null {
  const transaction: RawMpesaTransaction = {
    transactionCode: transactionCode,
    date: transactionDate, // Use pre-extracted date
    time: transactionTime, // Use pre-extracted time
  };

  // Extract amounts - M-PESA PDF has Paid In and Withdrawn columns
  // The format is: ... Completed [amount1] [amount2]
  // where amount1 is Paid In or Withdrawn, amount2 is Balance
  // Look for all numbers that look like amounts
  const amounts = block.match(/-?[\d,]+\.\d{2}/g);
  if (amounts && amounts.length > 0) {
    // Find "Completed" keyword to locate amounts after it
    const completedIndex = block.indexOf("Completed");
    if (completedIndex !== -1) {
      const afterCompleted = block.substring(completedIndex);
      const amountsAfterCompleted = afterCompleted.match(/-?([\d,]+\.\d{2})/g);
      
      if (amountsAfterCompleted && amountsAfterCompleted.length >= 2) {
        // First amount after "Completed" is transaction amount (can be negative)
        const firstAmount = amountsAfterCompleted[0];
        transaction.amount = Math.abs(parseAmount(firstAmount));
        
        // Determine if income or expense based on sign or position
        if (firstAmount.startsWith("-")) {
          transaction.rawType = "Expense";
        } else {
          // Check which column it's in (Paid In vs Withdrawn)
          // If there's a 0.00 right before balance, it's the other column
          if (amountsAfterCompleted.length >= 3) {
            // Format: amount1 amount2 balance
            // If amount2 is 0.00, then amount1 is in Paid In column
            if (amountsAfterCompleted[1] === "0.00") {
              transaction.rawType = "Income";
            } else {
              transaction.rawType = "Expense";
            }
          } else {
            // Only 2 amounts: amount and balance
            // Assume expense if details contain expense keywords
            const lowerBlock = block.toLowerCase();
            if (lowerBlock.includes("received") || lowerBlock.includes("overdraft of credit")) {
              transaction.rawType = "Income";
            } else {
              transaction.rawType = "Expense";
            }
          }
        }
        
        // Last amount is the balance
        transaction.balance = parseAmount(amountsAfterCompleted[amountsAfterCompleted.length - 1]);
      }
    }
  }

  // Extract details from the Details column
  // M-PESA PDF format examples from the provided screenshots:
  // "Recharge for Customer With Fuliza to 4093441SAFARICOM DATA BUNDLES by - 07******507 Erick Oluga"
  // "Funds received from - 2547******362 JULIANA JUMA"
  // "Customer Transfer Fuliza MPesa to - 07******669 Lilian Lusimba"
  // "OverDraft of Credit Party"
  // "Business Payment from 300600 - Equity Bulk Account via API. Digital conversation ID is EDXCD117443E4E3."
  
  // Extract phone numbers first
  const phoneNumberPattern = /(?:254\d{9}|07\d{8}|254\d\*{6}\d{3}|07\*{6}\d{3})/g;
  const phoneNumbers = block.match(phoneNumberPattern) || [];
  if (phoneNumbers.length > 0) {
    transaction.phoneNumber = phoneNumbers[0];
  }
  
  // Extract full description/details for manual review
  const detailsStart = block.indexOf(transactionTime) + transactionTime.length;
  const detailsEnd = block.indexOf("Completed");
  if (detailsStart > -1 && detailsEnd > detailsStart) {
    transaction.description = block.substring(detailsStart, detailsEnd).trim();
  } else {
    transaction.description = block.substring(0, 200).trim(); // Fallback
  }
  
  // Extract merchant/counterparty names (ENHANCED PATTERNS)
  // Pattern 1: "from/to/by - [phone] NAME" (most common in M-PESA PDFs)
  // Improved to capture more name variations
  let nameMatch = block.match(/(?:from|to|by)\s*-\s*(?:254\d[\d\*]{8}\d|07[\d\*]{6}\d{2})\s+([A-Z][a-zA-Z\s\.]+?)(?:\s+Completed|\s+Co[^a-zA-Z]|\s+via|$)/i);
  if (nameMatch) {
    const name = nameMatch[1].trim();
    // Clean up the name (remove trailing 'Co', 'Ltd', etc. if incomplete)
    const cleanedName = name.replace(/\s+(Co|Lt|Vi|MP)$/i, '').trim();
    if (block.toLowerCase().includes("received") || block.toLowerCase().includes("from")) {
      transaction.sender = cleanedName;
      transaction.merchantName = cleanedName;
    } else {
      transaction.recipient = cleanedName;
      transaction.merchantName = cleanedName;
    }
  }
  
  // Pattern 2: Safaricom/Merchant bundles - "to [number]MERCHANT NAME"
  if (!transaction.merchantName) {
    const merchantMatch = block.match(/to\s+\d+([A-Z][\sA-Z]+(?:DATA|BUNDLES|AIRTIME|OFFICE|CYBER|MART|SHOP|STORE)[\sA-Z]*)/i);
    if (merchantMatch) {
      transaction.merchantName = merchantMatch[1].trim();
    }
  }
  
  // Pattern 3: Business payments - "from [number] - NAME"
  if (!transaction.sender && !transaction.merchantName) {
    const businessMatch = block.match(/from\s+(\d+)\s*-\s*([A-Z][a-zA-Z\s\.]+?)(?:\s+via|\s+Completed|\s+Original|$)/i);
    if (businessMatch) {
      transaction.paybillNumber = businessMatch[1];
      const cleanedName = businessMatch[2].trim().replace(/\s+(via|Original)$/i, '').trim();
      transaction.sender = cleanedName;
      transaction.merchantName = cleanedName;
    }
  }
  
  // Pattern 4: Merchant Payment - "to [number] - NAME"
  if (!transaction.merchantName) {
    const merchantPayMatch = block.match(/(?:merchant payment|lipa na m-pesa).*?to\s+(\d+)\s*-?\s*([A-Z][a-zA-Z\s\.]+?)(?:\s+Completed|$)/i);
    if (merchantPayMatch) {
      const tillOrPaybill = merchantPayMatch[1];
      const cleanedName = merchantPayMatch[2].trim().replace(/\s+Completed$/i, '').trim();
      
      if (block.toLowerCase().includes("till")) {
        transaction.tillNumber = tillOrPaybill;
      } else {
        transaction.paybillNumber = tillOrPaybill;
      }
      transaction.merchantName = cleanedName;
    }
  }
  
  // Pattern 5: Till/Paybill merchants - "to [number] NAME"
  if (!transaction.merchantName) {
    const tillMatch = block.match(/(?:till|paybill)\s+(\d+)\s*-?\s*([A-Z][a-zA-Z\s\.]+?)(?:\s+Completed|$)/i);
    if (tillMatch) {
      if (block.toLowerCase().includes("till")) {
        transaction.tillNumber = tillMatch[1];
      } else {
        transaction.paybillNumber = tillMatch[1];
      }
      transaction.merchantName = tillMatch[2].trim();
    }
  }

  // Determine transaction type from details (improved to match PDF patterns)
  const detailsLower = block.toLowerCase();
  
  // Priority-based type detection (most specific first)
  // CRITICAL: Handle charges first - Safaricom charges for transfers above KES 100
  if (detailsLower.includes("customer transfer of funds charge") || 
      (detailsLower.includes("charge") && detailsLower.includes("transfer"))) {
    transaction.rawType = "Charge";
    transaction.merchantName = "Safaricom Transfer Fee";
    transaction.description = "Safaricom charge for money transfer above KES 100";
  } 
  // Fuliza Overdraft - when you use Fuliza credit
  else if (detailsLower.includes("overdraft of credit party")) {
    transaction.rawType = "FulizaLoan";
    transaction.merchantName = "M-PESA Fuliza";
    transaction.description = "Fuliza overdraft credit extended";
  } 
  // Fuliza Repayment - paying back Fuliza debt
  else if (detailsLower.includes("od loan repayment") || 
           detailsLower.includes("loan repayment to 232323") ||
           (detailsLower.includes("fuliza") && detailsLower.includes("repayment"))) {
    transaction.rawType = "FulizaRepayment";
    transaction.merchantName = "M-PESA Fuliza Repayment";
    transaction.description = "Repayment of Fuliza overdraft debt";
  }
  // Money received
  else if (detailsLower.includes("funds received") || detailsLower.includes("received from")) {
    transaction.rawType = "Received";
  } 
  // Business payments (e.g., from Equity Bank)
  else if (detailsLower.includes("business payment from")) {
    transaction.rawType = "Received";
  } 
  // Airtime and data bundles
  else if (detailsLower.includes("recharge") || 
           detailsLower.includes("airtime purchase") || 
           detailsLower.includes("data bundles") ||
           detailsLower.includes("bundle purchase")) {
    transaction.rawType = "Airtime";
    // Ensure merchant name includes "SAFARICOM" or bundle type
    if (!transaction.merchantName || transaction.merchantName === "Unknown") {
      const bundleMatch = block.match(/(\d+[A-Z\s]+(?:DATA|BUNDLES|AIRTIME)[A-Z\s]*)/i);
      if (bundleMatch) {
        transaction.merchantName = bundleMatch[1].trim();
      } else if (detailsLower.includes("safaricom")) {
        transaction.merchantName = "SAFARICOM";
      } else {
        transaction.merchantName = "SAFARICOM DATA BUNDLES";
      }
    }
  } 
  // Money sent (including Fuliza transfers)
  else if (detailsLower.includes("customer transfer") || 
           detailsLower.includes("send money to")) {
    transaction.rawType = "Sent";
    // If it's a Fuliza transfer, note it in description
    if (detailsLower.includes("fuliza")) {
      transaction.description = (transaction.description || "") + " (via Fuliza)";
    }
  } 
  // Merchant payments (Lipa na M-PESA)
  else if (detailsLower.includes("merchant payment") || 
           detailsLower.includes("lipa na m-pesa")) {
    transaction.rawType = "PayBill";
  } 
  // Buy goods (Till number)
  else if (detailsLower.includes("buy goods") || 
           detailsLower.includes("till number")) {
    transaction.rawType = "BuyGoods";
  } 
  // Withdrawals
  else if (detailsLower.includes("withdraw") || 
           detailsLower.includes("agent")) {
    transaction.rawType = "Withdrawal";
  } 
  // Generic charges/fees
  else if (detailsLower.includes("charge") || 
           detailsLower.includes("fee")) {
    transaction.rawType = "Charge";
    transaction.merchantName = transaction.merchantName || "Safaricom Fee";
  }

  // Extract account numbers for paybill transactions
  const accountMatch = block.match(/acc(?:ount)?[:\s]*([A-Z0-9]+)/i);
  if (accountMatch) {
    transaction.accountNumber = accountMatch[1];
  }

  // Validate that transaction has minimum required fields
  // Must have: transactionCode, date, and amount
  if (!transaction.transactionCode || !transaction.date || !transaction.amount) {
    console.log(`⚠️ Skipping transaction ${transaction.transactionCode || 'UNKNOWN'} - missing required fields (date: ${!!transaction.date}, amount: ${!!transaction.amount})`);
    return null;
  }

  // Debug log for first few transactions
  if (blockNumber <= 5) {
    console.log(`📝 Transaction ${blockNumber}:`, {
      code: transaction.transactionCode,
      date: transaction.date,
      amount: transaction.amount,
      type: transaction.rawType,
      merchant: transaction.merchantName,
      sender: transaction.sender,
      recipient: transaction.recipient,
      block: block.substring(0, 150)
    });
  }

  return transaction;
}

/**
 * Parse PDF text as transaction messages (fallback method)
 * Uses SMS-like parsing for PDFs that contain message text
 */
function parseAsTransactionMessages(text: string): {
  transactions: RawMpesaTransaction[];
  errors: ParseError[];
} {
  const transactions: RawMpesaTransaction[] = [];
  const errors: ParseError[] = [];

  // Split into potential transaction blocks
  // Look for transaction codes (M-PESA format: TKHE4AFXVW, TKGE4ADKVV, etc.)
  // Use same pattern as main parser for consistency
  const txnPattern = /([TR]K[A-Z0-9]{8,10})/g;
  const matches = Array.from(text.matchAll(txnPattern));

  // Extract blocks between transaction codes
  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i];
    const nextMatch = matches[i + 1];
    const transactionCode = currentMatch[1];
    
    const startPos = currentMatch.index || 0;
    const endPos = nextMatch ? (nextMatch.index || text.length) : text.length;
    const block = text.substring(startPos, endPos).trim();

    // Skip if block is too short or looks like header
    if (block.length < 20 || block.includes("Receipt No.")) continue;

    try {
      const transaction = parseMessageBlock(block, transactionCode);
      if (transaction) {
        transaction.source = MpesaStatementFormat.PDF;
        transaction.originalText = block.substring(0, 500);
        transactions.push(transaction);
      }
    } catch (error) {
      errors.push({
        line: i + 1,
        rawText: block.substring(0, 100),
        error: error instanceof Error ? error.message : "Failed to parse block",
        severity: "warning",
      });
    }
  }

  return { transactions, errors };
}

/**
 * Parse a message block
 */
function parseMessageBlock(block: string, transactionCode: string): RawMpesaTransaction | null {
  const transaction: RawMpesaTransaction = {
    transactionCode,
  };

  // Extract amount
  const amountMatch = block.match(/(?:Ksh|KES)\s?([\d,]+\.?\d*)/i);
  if (amountMatch) {
    transaction.amount = parseAmount(amountMatch[1]);
  }

  // Extract balance
  const balanceMatch = block.match(/balance\s+(?:is\s+)?(?:Ksh|KES)?\s?([\d,]+\.?\d*)/i);
  if (balanceMatch) {
    transaction.balance = parseAmount(balanceMatch[1]);
  }

  // Extract date
  const dateMatch = block.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
  if (dateMatch) {
    transaction.date = dateMatch[1];
  }

  // Extract time
  const timeMatch = block.match(/(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/i);
  if (timeMatch) {
    transaction.time = timeMatch[1];
  }

  // Determine transaction type
  const lowerBlock = block.toLowerCase();
  if (lowerBlock.includes("received") || lowerBlock.includes("you have been paid")) {
    transaction.rawType = "Received";
    const senderMatch = block.match(/from\s+([A-Z\s]+?)(?:\s+\d{10,}|$)/i);
    if (senderMatch) {
      transaction.sender = senderMatch[1].trim();
    }
  } else if (lowerBlock.includes("sent to")) {
    transaction.rawType = "Sent";
    const recipientMatch = block.match(/to\s+([A-Z\s]+?)(?:\s+\d{10,}|$)/i);
    if (recipientMatch) {
      transaction.recipient = recipientMatch[1].trim();
    }
  } else if (lowerBlock.includes("paid to")) {
    transaction.rawType = "Payment";
    const merchantMatch = block.match(/to\s+([A-Z\s&\-]+?)(?:\s+(?:account|on|$))/i);
    if (merchantMatch) {
      transaction.merchantName = merchantMatch[1].trim();
    }
  } else if (lowerBlock.includes("airtime")) {
    transaction.rawType = "Airtime";
  } else if (lowerBlock.includes("withdraw")) {
    transaction.rawType = "Withdrawal";
  }

  // Extract phone number
  const phoneMatch = block.match(/\b(254\d{9}|\d{10})\b/);
  if (phoneMatch) {
    transaction.phoneNumber = phoneMatch[1];
  }

  return transaction;
}

/**
 * Parse amount from string
 */
function parseAmount(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[Ksh,\s]/gi, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

