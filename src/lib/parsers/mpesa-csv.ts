// MPESA CSV Parser


import { RawMpesaTransaction, MpesaStatementFormat, ParseError } from "@/types/mpesa";

export interface CSVParseOptions {
  skipHeaders?: boolean;
  delimiter?: string;
  encoding?: string;
}

/**
 * Parse MPESA CSV file
 * @param csvContent - Raw CSV content as string
 * @param options - Parsing options
 * @returns Array of raw transactions and errors
 */
export function parseMpesaCSV(
  csvContent: string,
  options: CSVParseOptions = {}
): { transactions: RawMpesaTransaction[]; errors: ParseError[] } {
  const { skipHeaders = true, delimiter = "," } = options;

  const transactions: RawMpesaTransaction[] = [];
  const errors: ParseError[] = [];

  // Split into lines
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length === 0) {
    return { transactions, errors };
  }

  // Detect CSV format by examining headers
  const headers = parseCSVLine(lines[0], delimiter);
  const format = detectCSVFormat(headers);

  // Start from line 1 if skipping headers
  const startLine = skipHeaders ? 1 : 0;

  for (let i = startLine; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i].trim();

    if (!line) continue;

    try {
      const fields = parseCSVLine(line, delimiter);

      if (fields.length < 3) {
        // Too few fields, skip
        errors.push({
          line: lineNumber,
          rawText: line,
          error: "Insufficient fields in CSV line",
          severity: "warning",
        });
        continue;
      }

      const transaction = parseCSVFields(fields, headers, format);

      if (transaction) {
        transaction.source = MpesaStatementFormat.CSV;
        transaction.originalText = line;
        transactions.push(transaction);
      } else {
        errors.push({
          line: lineNumber,
          rawText: line,
          error: "Could not parse transaction from fields",
          severity: "warning",
        });
      }
    } catch (error) {
      errors.push({
        line: lineNumber,
        rawText: line,
        error: error instanceof Error ? error.message : "Unknown parsing error",
        severity: "error",
      });
    }
  }

  return { transactions, errors };
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Toggle quotes
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // Field delimiter
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  // Push last field
  fields.push(current.trim());

  return fields;
}

/**
 * Detect CSV format from headers
 */
function detectCSVFormat(headers: string[]): "official" | "portal" | "unknown" {
  const headerStr = headers.join(",").toLowerCase();

  // Official M-PESA app export format
  if (
    headerStr.includes("receipt") &&
    headerStr.includes("completion") &&
    headerStr.includes("details")
  ) {
    return "official";
  }

  // M-PESA web portal format
  if (headerStr.includes("transaction") && headerStr.includes("status")) {
    return "portal";
  }

  return "unknown";
}

/**
 * Parse fields based on detected format
 */
function parseCSVFields(
  fields: string[],
  headers: string[],
  format: string
): RawMpesaTransaction | null {
  if (format === "official") {
    return parseOfficialFormat(fields, headers);
  } else if (format === "portal") {
    return parsePortalFormat(fields, headers);
  } else {
    return parseGenericFormat(fields);
  }
}

/**
 * Parse official M-PESA app CSV format
 * Columns: Receipt No., Completion Time, Details, Transaction Status, Paid In, Withdrawn, Balance
 */
function parseOfficialFormat(
  fields: string[],
  headers: string[]
): RawMpesaTransaction | null {
  const transaction: RawMpesaTransaction = {};

  for (let i = 0; i < fields.length && i < headers.length; i++) {
    const header = headers[i].toLowerCase();
    const value = fields[i];

    if (!value) continue;

    if (header.includes("receipt")) {
      transaction.transactionCode = value;
    } else if (header.includes("completion") || header.includes("date")) {
      transaction.date = value;
    } else if (header.includes("details")) {
      // Parse details field (contains most information)
      parseDetailsField(transaction, value);
    } else if (header.includes("paid in")) {
      const amount = parseAmount(value);
      if (amount > 0) {
        transaction.amount = amount;
        transaction.rawType = "Income";
      }
    } else if (header.includes("withdrawn")) {
      const amount = parseAmount(value);
      if (amount > 0) {
        transaction.amount = amount;
        transaction.rawType = "Expense";
      }
    } else if (header.includes("balance")) {
      transaction.balance = parseAmount(value);
    }
  }

  return transaction.transactionCode ? transaction : null;
}

/**
 * Parse M-PESA web portal CSV format
 */
function parsePortalFormat(
  fields: string[],
  headers: string[]
): RawMpesaTransaction | null {
  const transaction: RawMpesaTransaction = {};

  for (let i = 0; i < fields.length && i < headers.length; i++) {
    const header = headers[i].toLowerCase();
    const value = fields[i];

    if (!value) continue;

    if (header.includes("transaction id") || header.includes("reference")) {
      transaction.transactionCode = value;
    } else if (header.includes("date") || header.includes("time")) {
      transaction.date = value;
    } else if (header.includes("type")) {
      transaction.rawType = value;
    } else if (header.includes("amount")) {
      transaction.amount = parseAmount(value);
    } else if (header.includes("balance")) {
      transaction.balance = parseAmount(value);
    } else if (header.includes("party") || header.includes("name")) {
      transaction.merchantName = value;
    }
  }

  return transaction.transactionCode ? transaction : null;
}

/**
 * Parse generic/unknown CSV format (best effort)
 */
function parseGenericFormat(fields: string[]): RawMpesaTransaction | null {
  // Try to intelligently map fields
  // Assume: [Code, Date, Type/Details, Amount, Balance]

  if (fields.length < 3) return null;

  const transaction: RawMpesaTransaction = {};

  // First field is usually transaction code
  if (fields[0] && /^[A-Z0-9]{10,}$/i.test(fields[0])) {
    transaction.transactionCode = fields[0];
  }

  // Look for date-like field
  for (let i = 0; i < Math.min(3, fields.length); i++) {
    if (isDateLike(fields[i])) {
      transaction.date = fields[i];
      break;
    }
  }

  // Look for amount (number with optional KES/Ksh)
  for (const field of fields) {
    const amount = parseAmount(field);
    if (amount > 0 && !transaction.amount) {
      transaction.amount = amount;
      break;
    }
  }

  // Last numeric field is often balance
  for (let i = fields.length - 1; i >= 0; i--) {
    const balance = parseAmount(fields[i]);
    if (balance > 0 && balance !== transaction.amount) {
      transaction.balance = balance;
      break;
    }
  }

  return transaction.transactionCode ? transaction : null;
}

/**
 * Parse Details field from official M-PESA format
 * Examples:
 * - "SH12ABC3XY Confirmed. You have received Ksh500.00 from JOHN DOE 254712345678 on 1/11/24 at 10:30 AM"
 * - "SH12ABC3XY Confirmed. Ksh1,000.00 sent to JANE SMITH 254722222222 on 1/11/24 at 2:15 PM"
 * - "SH12ABC3XY Confirmed. Ksh50.00 paid to SUPERMARKET. Account Number 123456"
 */
function parseDetailsField(transaction: RawMpesaTransaction, details: string): void {
  // Extract transaction code (if not already set)
  const codeMatch = details.match(/([A-Z0-9]{10,})\s+Confirmed/i);
  if (codeMatch && !transaction.transactionCode) {
    transaction.transactionCode = codeMatch[1];
  }

  // Extract amount
  const amountMatch = details.match(/Ksh?([\d,]+\.?\d*)/i);
  if (amountMatch) {
    transaction.amount = parseAmount(amountMatch[1]);
  }

  // Detect transaction type
  if (/received.*from/i.test(details)) {
    transaction.rawType = "Received";
    const nameMatch = details.match(/from\s+([A-Z\s]+?)\s+\d{10,}/i);
    if (nameMatch) {
      transaction.sender = nameMatch[1].trim();
    }
  } else if (/sent to/i.test(details)) {
    transaction.rawType = "Sent";
    const nameMatch = details.match(/to\s+([A-Z\s]+?)\s+\d{10,}/i);
    if (nameMatch) {
      transaction.recipient = nameMatch[1].trim();
    }
  } else if (/paid to/i.test(details)) {
    transaction.rawType = "Payment";
    const merchantMatch = details.match(/to\s+([A-Z\s]+?)\.?\s+(Account|on|$)/i);
    if (merchantMatch) {
      transaction.merchantName = merchantMatch[1].trim();
    }
  } else if (/bought.*airtime/i.test(details)) {
    transaction.rawType = "Airtime";
  } else if (/withdraw/i.test(details)) {
    transaction.rawType = "Withdrawal";
  }

  // Extract phone number
  const phoneMatch = details.match(/\b(254\d{9}|\d{10})\b/);
  if (phoneMatch) {
    transaction.phoneNumber = phoneMatch[1];
  }

  // Extract paybill/till number
  const paybillMatch = details.match(/Account Number\s+(\d+)/i);
  if (paybillMatch) {
    transaction.accountNumber = paybillMatch[1];
  }
}

/**
 * Parse amount from string (handles commas, currency symbols)
 */
function parseAmount(value: string): number {
  if (!value) return 0;

  // Remove currency symbols, commas, and whitespace
  const cleaned = value.replace(/[Ksh,\s]/gi, "").trim();

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Check if string looks like a date
 */
function isDateLike(value: string): boolean {
  if (!value) return false;

  // Check for common date patterns
  return (
    /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(value) || // DD/MM/YYYY
    /\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(value) || // YYYY-MM-DD
    /\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(value) // DD MMM YYYY
  );
}

