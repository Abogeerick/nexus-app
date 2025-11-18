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
    // Use pdf2json (Node.js native PDF parser)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const PDFParser = require("pdf2json");
    
    // Create a promise-based wrapper for pdf2json
    const extractText = (): Promise<string> => {
      return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();

        pdfParser.on("pdfParser_dataError", (errData: any) => {
          reject(new Error(errData.parserError || "PDF parsing failed"));
        });

        pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
          try {
            // Extract text from all pages
            let fullText = "";

            if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
              for (const page of pdfData.Pages) {
                if (page.Texts && Array.isArray(page.Texts)) {
                  for (const text of page.Texts) {
                    if (text.R && Array.isArray(text.R)) {
                      for (const run of text.R) {
                        if (run.T) {
                          // Decode URI-encoded text
                          const decodedText = decodeURIComponent(run.T);
                          fullText += decodedText + " ";
                        }
                      }
                    }
                  }
                  fullText += "\n"; // New line after each text block
                }
              }
            }

            resolve(fullText);
          } catch (error) {
            reject(error);
          }
        });

        // Parse the PDF buffer
        pdfParser.parseBuffer(pdfBuffer);
      });
    };

    const fullText = await extractText();

    if (!fullText || fullText.trim().length === 0) {
      errors.push({
        line: 0,
        rawText: "",
        error: "PDF contains no readable text",
        severity: "error",
      });
      return { transactions, errors };
    }

    // Parse the extracted text
    const result = parsePDFText(fullText);
    
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

  // Split into lines
  const lines = text.split(/\r?\n/).filter((line) => line.trim());

  // Try to detect the format
  // M-PESA PDFs typically have tabular data with columns:
  // Receipt No. | Completion Time | Details | Transaction Status | Paid In | Withdrawn | Balance

  let headerLine = -1;
  let dataStartLine = -1;

  // Find the header line
  for (let i = 0; i < Math.min(50, lines.length); i++) {
    const line = lines[i].toLowerCase();
    if (
      line.includes("receipt") &&
      (line.includes("completion") || line.includes("date") || line.includes("time"))
    ) {
      headerLine = i;
      dataStartLine = i + 1;
      break;
    }
  }

  if (headerLine === -1) {
    // No header found, try to parse as transaction messages (like SMS)
    return parseAsTransactionMessages(text);
  }

  // Parse tabular data
  for (let i = dataStartLine; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;

    // Skip lines that look like page numbers or footers
    if (/^page \d+/i.test(line) || /^\d+$/.test(line)) continue;

    // Skip header repetitions
    if (
      line.toLowerCase().includes("receipt") &&
      line.toLowerCase().includes("completion")
    ) {
      continue;
    }

    try {
      const transaction = parseTableLine(line, i + 1);
      if (transaction) {
        transaction.source = MpesaStatementFormat.PDF;
        transaction.originalText = line;
        transactions.push(transaction);
      }
    } catch (error) {
      // Some lines may not be transaction data (totals, summaries, etc.)
      // Only log if it looks like it should be a transaction
      if (line.match(/[A-Z]{2,4}\d{1,2}[A-Z0-9]{4,6}/)) {
        errors.push({
          line: i + 1,
          rawText: line.substring(0, 100),
          error: error instanceof Error ? error.message : "Failed to parse line",
          severity: "warning",
        });
      }
    }
  }

  return { transactions, errors };
}

/**
 * Parse a line of tabular data from PDF
 */
function parseTableLine(line: string, lineNumber: number): RawMpesaTransaction | null {
  // M-PESA PDFs have transaction codes like: TKHE4AFXVW, TKH4PAGI8B, etc.
  // Pattern: 2-4 letters, 1-2 digits, 4-6 alphanumeric
  const codeMatch = line.match(/\b([A-Z]{2,4}\d{1,2}[A-Z0-9]{4,6})\b/);
  if (!codeMatch) {
    return null; // Not a transaction line
  }

  const transaction: RawMpesaTransaction = {
    transactionCode: codeMatch[1],
  };

  // Extract date/time - M-PESA PDF format: 2025-11-17 19:12:57
  const dateTimeMatch = line.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/);
  if (dateTimeMatch) {
    transaction.date = dateTimeMatch[1];
    transaction.time = dateTimeMatch[2];
  } else {
    // Fallback to other date formats
    const dateMatch = line.match(
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/i
    );
    if (dateMatch) {
      transaction.date = dateMatch[1];
      transaction.time = dateMatch[2];
    }
  }

  // Extract amounts - M-PESA PDF has Paid In and Withdrawn columns
  // Look for amounts with proper context
  const amounts = line.match(/\b([\d,]+\.\d{2})\b/g);
  if (amounts && amounts.length > 0) {
    // Try to find "Paid In" amount (positive, income)
    const paidInMatch = line.match(/(?:paid in|paidin)[:\s]*([\d,]+\.\d{2})/i);
    if (paidInMatch) {
      transaction.amount = parseAmount(paidInMatch[1]);
      transaction.rawType = "Income";
    } else {
      // Try to find "Withdrawn" amount (negative, expense)
      const withdrawnMatch = line.match(/(?:withdrawn|withdraw)[:\s]*-?([\d,]+\.\d{2})/i);
      if (withdrawnMatch) {
        transaction.amount = parseAmount(withdrawnMatch[1]);
        transaction.rawType = "Expense";
      } else if (amounts.length >= 2) {
        // If we have multiple amounts, first is usually transaction, last is balance
        transaction.amount = parseAmount(amounts[0]);
        // Determine type from details
      }
    }

    // Last amount is usually the balance
    transaction.balance = parseAmount(amounts[amounts.length - 1]);
  }

  // Extract details from the Details column
  // M-PESA PDF format examples:
  // "Funds received from - 2547******362 JULIANA JUMA"
  // "Customer Transfer Fuliza MPesa to - 07******669 Lilian Lusimba"
  // "Recharge for Customer With Fuliza to 4093441SAFARICOM DATA BUNDLES by - 07******507 Erick Oluga"
  
  // Extract person/merchant names (typically in CAPS or Title Case)
  const namePatterns = [
    /(?:from|to|by)\s+[-\d\*]+\s+([A-Z][A-Z\s]{2,})/i, // "from - 2547******362 JULIANA JUMA"
    /(?:from|to|by)\s+([A-Z][A-Z\s]{2,})/i, // "to ALEX KARIMI"
    /\b([A-Z]{2,}[A-Z\s]{3,})\b/, // Any all-caps name (3+ chars)
  ];

  for (const pattern of namePatterns) {
    const nameMatch = line.match(pattern);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      // Filter out common non-name words
      if (!/^(RECEIVED|SENT|PAID|TRANSFER|CUSTOMER|FUNDS|MONEY|MPESA|FULIZA|OVERDRAFT|LOAN|REPAYMENT|CHARGE|COMPLETED|STATUS|DETAILS)$/i.test(name)) {
        if (transaction.rawType === "Income" || line.toLowerCase().includes("received") || line.toLowerCase().includes("from")) {
          transaction.sender = name;
        } else {
          transaction.recipient = name;
          transaction.merchantName = name;
        }
        break;
      }
    }
  }

  // Determine transaction type from details
  const detailsLower = line.toLowerCase();
  
  if (detailsLower.includes("funds received") || detailsLower.includes("received from")) {
    transaction.rawType = "Received";
  } else if (detailsLower.includes("send money") || detailsLower.includes("transfer") && detailsLower.includes("to")) {
    transaction.rawType = "Sent";
  } else if (detailsLower.includes("recharge") || detailsLower.includes("bundle purchase") || detailsLower.includes("data bundles")) {
    transaction.rawType = "Airtime";
    // Extract merchant from bundle purchases
    const bundleMatch = line.match(/(\d+[A-Z\s]+(?:DATA|BUNDLES|AIRTIME))/i);
    if (bundleMatch) {
      transaction.merchantName = bundleMatch[1].trim();
    }
  } else if (detailsLower.includes("fuliza") && detailsLower.includes("repayment")) {
    transaction.rawType = "FulizaRepayment";
  } else if (detailsLower.includes("fuliza") && (detailsLower.includes("loan") || detailsLower.includes("overdraft"))) {
    transaction.rawType = "FulizaLoan";
  } else if (detailsLower.includes("paybill") || detailsLower.includes("lipa na m-pesa")) {
    transaction.rawType = "PayBill";
  } else if (detailsLower.includes("buy goods") || detailsLower.includes("till")) {
    transaction.rawType = "BuyGoods";
  } else if (detailsLower.includes("withdraw") || detailsLower.includes("agent")) {
    transaction.rawType = "Withdrawal";
  } else if (detailsLower.includes("charge") || detailsLower.includes("fee")) {
    transaction.rawType = "Charge";
  }

  // Extract phone number
  const phoneMatch = line.match(/\b(254\d{9}|\d{10})\b/);
  if (phoneMatch) {
    transaction.phoneNumber = phoneMatch[1];
  }

  // Extract paybill/till/account numbers
  const paybillMatch = line.match(/paybill[:\s]*(\d+)/i);
  if (paybillMatch) {
    transaction.paybillNumber = paybillMatch[1];
  }

  const tillMatch = line.match(/till[:\s]*(\d+)/i);
  if (tillMatch) {
    transaction.tillNumber = tillMatch[1];
  }

  const accountMatch = line.match(/acc(?:ount)?[:\s]*([A-Z0-9]+)/i);
  if (accountMatch) {
    transaction.accountNumber = accountMatch[1];
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
  // Look for transaction codes (M-PESA format: TKHE4AFXVW, TKH4PAGI8B, etc.)
  const txnPattern = /([A-Z]{2,4}\d{1,2}[A-Z0-9]{4,6})[^A-Z]{0,500}?(?=[A-Z]{2,4}\d{1,2}[A-Z0-9]{4,6}|$)/g;
  const matches = Array.from(text.matchAll(txnPattern));

  let lineNumber = 1;
  for (const match of matches) {
    const block = match[0];
    const transactionCode = match[1];

    try {
      const transaction = parseMessageBlock(block, transactionCode);
      if (transaction) {
        transaction.source = MpesaStatementFormat.PDF;
        transaction.originalText = block;
        transactions.push(transaction);
      }
    } catch (error) {
      errors.push({
        line: lineNumber,
        rawText: block.substring(0, 100),
        error: error instanceof Error ? error.message : "Failed to parse block",
        severity: "warning",
      });
    }

    lineNumber++;
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

