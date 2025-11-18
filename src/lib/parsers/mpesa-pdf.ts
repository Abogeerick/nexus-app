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
    // Use require for pdf-parse (CommonJS module, works in Node.js API routes)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    
    // Extract text from PDF
    const data = await pdfParse(pdfBuffer);
    const text = data.text;

    if (!text || text.trim().length === 0) {
      errors.push({
        line: 0,
        rawText: "",
        error: "PDF contains no readable text",
        severity: "error",
      });
      return { transactions, errors };
    }

    // Parse the extracted text
    const result = parsePDFText(text);
    
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
        transaction.source = MpesaStatementFormat.CSV; // PDF is similar to CSV format
        transaction.originalText = line;
        transactions.push(transaction);
      }
    } catch (error) {
      // Some lines may not be transaction data (totals, summaries, etc.)
      // Only log if it looks like it should be a transaction
      if (line.match(/[A-Z]{2}\d{2}[A-Z0-9]{6}/)) {
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
  // M-PESA PDFs may have data in columns separated by whitespace
  // Try to extract transaction code first
  const codeMatch = line.match(/\b([A-Z]{2}\d{2}[A-Z0-9]{6})\b/);
  if (!codeMatch) {
    return null; // Not a transaction line
  }

  const transaction: RawMpesaTransaction = {
    transactionCode: codeMatch[1],
  };

  // Extract date/time (various formats)
  const dateMatch = line.match(
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/i
  );
  if (dateMatch) {
    transaction.date = dateMatch[1];
    transaction.time = dateMatch[2];
  }

  // Extract amounts (look for numbers with decimals)
  const amounts = line.match(/\b([\d,]+\.\d{2})\b/g);
  if (amounts && amounts.length > 0) {
    // Last amount is usually the balance
    transaction.balance = parseAmount(amounts[amounts.length - 1]);

    // Look for "Paid In" or "Withdrawn" context
    const paidInMatch = line.match(/paid in[:\s]*([\d,]+\.\d{2})/i);
    const withdrawnMatch = line.match(/withdrawn[:\s]*([\d,]+\.\d{2})/i);

    if (paidInMatch) {
      transaction.amount = parseAmount(paidInMatch[1]);
      transaction.rawType = "Income";
    } else if (withdrawnMatch) {
      transaction.amount = parseAmount(withdrawnMatch[1]);
      transaction.rawType = "Expense";
    } else if (amounts.length >= 2) {
      // First amount is likely the transaction amount
      transaction.amount = parseAmount(amounts[0]);
    }
  }

  // Try to extract merchant/party information
  // This varies by PDF format, but typically includes names in CAPS
  const detailsMatch = line.match(/[A-Z\s]{10,}/);
  if (detailsMatch) {
    const details = detailsMatch[0].trim();
    
    // Check if it's a known transaction type
    if (details.includes("RECEIVED") || details.includes("FROM")) {
      transaction.rawType = "Received";
      const nameMatch = details.match(/FROM\s+([A-Z\s]+)/);
      if (nameMatch) {
        transaction.sender = nameMatch[1].trim();
      }
    } else if (details.includes("SENT") || details.includes("TO")) {
      transaction.rawType = "Sent";
      const nameMatch = details.match(/TO\s+([A-Z\s]+)/);
      if (nameMatch) {
        transaction.recipient = nameMatch[1].trim();
      }
    } else if (details.includes("PAID")) {
      transaction.rawType = "Payment";
      transaction.merchantName = details.replace(/PAID|TO/gi, "").trim();
    } else if (details.includes("AIRTIME")) {
      transaction.rawType = "Airtime";
    } else if (details.includes("WITHDRAW")) {
      transaction.rawType = "Withdrawal";
    }
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
  // Look for transaction codes
  // Using [\s\S] instead of . with 's' flag for ES2017 compatibility
  const txnPattern = /([A-Z]{2}\d{2}[A-Z0-9]{6})[^A-Z]{0,500}?(?=[A-Z]{2}\d{2}[A-Z0-9]{6}|$)/g;
  const matches = Array.from(text.matchAll(txnPattern));

  let lineNumber = 1;
  for (const match of matches) {
    const block = match[0];
    const transactionCode = match[1];

    try {
      const transaction = parseMessageBlock(block, transactionCode);
      if (transaction) {
        transaction.source = MpesaStatementFormat.TEXT;
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

