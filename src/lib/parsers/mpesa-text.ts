/**
MPESA Text/SMS Parser
 *
 * Parses MPESA transaction messages from SMS backups or pasted text
 * Handles various message formats from Safaricom M-PESA
 */

import { RawMpesaTransaction, MpesaStatementFormat, ParseError } from "@/types/mpesa";

export function parseMpesaText(
  textContent: string
): { transactions: RawMpesaTransaction[]; errors: ParseError[] } {
  const transactions: RawMpesaTransaction[] = [];
  const errors: ParseError[] = [];

  // Split into individual messages
  // Messages typically start with transaction code or "Confirmed"
  const messages = splitMessages(textContent);

  for (let i = 0; i < messages.length; i++) {
    const lineNumber = i + 1;
    const message = messages[i].trim();

    if (!message || message.length < 20) continue; // Too short to be a valid message

    try {
      const transaction = parseMessage(message);

      if (transaction) {
        transaction.source = MpesaStatementFormat.SMS;
        transaction.originalText = message;
        transactions.push(transaction);
      } else {
        errors.push({
          line: lineNumber,
          rawText: message.substring(0, 100),
          error: "Could not parse M-PESA message format",
          severity: "warning",
        });
      }
    } catch (error) {
      errors.push({
        line: lineNumber,
        rawText: message.substring(0, 100),
        error: error instanceof Error ? error.message : "Unknown parsing error",
        severity: "error",
      });
    }
  }

  return { transactions, errors };
}

/**
 * Split text into individual messages
 */
function splitMessages(text: string): string[] {
  // Messages typically start with transaction code (e.g., "SH12ABC3XY")
  // or with the word "Confirmed"

  const messages: string[] = [];
  const lines = text.split(/\n+/);

  let currentMessage = "";

  for (const line of lines) {
    const trimmed = line.trim();

    // Check if this line starts a new message
    if (isMessageStart(trimmed)) {
      // Save previous message if exists
      if (currentMessage) {
        messages.push(currentMessage);
      }
      currentMessage = trimmed;
    } else if (currentMessage) {
      // Continue current message
      currentMessage += " " + trimmed;
    } else {
      // Start first message
      currentMessage = trimmed;
    }
  }

  // Add last message
  if (currentMessage) {
    messages.push(currentMessage);
  }

  return messages;
}

/**
 * Check if line starts a new message
 */
function isMessageStart(line: string): boolean {
  // Starts with transaction code
  if (/^[A-Z0-9]{10,}\s/.test(line)) return true;

  // Starts with "Confirmed" or similar keywords
  if (/^(Confirmed|Receipt|Transaction|MPESA)/i.test(line)) return true;

  return false;
}

/**
 * Parse a single M-PESA SMS message
 */
function parseMessage(message: string): RawMpesaTransaction | null {
  const transaction: RawMpesaTransaction = {};

  // Extract transaction code (always present)
  const codeMatch = message.match(/\b([A-Z]{2}\d{2}[A-Z0-9]{6})\b/);
  if (codeMatch) {
    transaction.transactionCode = codeMatch[1];
  }

  // If no transaction code, not a valid M-PESA message
  if (!transaction.transactionCode) {
    return null;
  }

  // Extract amount (Ksh1,000.00 or Ksh1000 or KES 1,000)
  const amountMatch = message.match(/(?:Ksh|KES)\s?([\d,]+\.?\d*)/i);
  if (amountMatch) {
    transaction.amount = parseAmount(amountMatch[1]);
  }

  // Extract balance
  const balanceMatch = message.match(/(?:balance is|new.*balance)\s+(?:Ksh|KES)?\s?([\d,]+\.?\d*)/i);
  if (balanceMatch) {
    transaction.balance = parseAmount(balanceMatch[1]);
  }

  // Extract date and time
  const dateTimeMatch = message.match(/on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+at\s+(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
  if (dateTimeMatch) {
    transaction.date = dateTimeMatch[1];
    transaction.time = dateTimeMatch[2];
  }

  // Detect transaction type and extract relevant info
  detectTransactionType(transaction, message);

  return transaction;
}

/**
 * Detect transaction type and extract party information
 */
function detectTransactionType(transaction: RawMpesaTransaction, message: string): void {
  const lowerMessage = message.toLowerCase();

  // **RECEIVED TRANSACTIONS**
  if (lowerMessage.includes("received") || lowerMessage.includes("you have been paid")) {
    transaction.rawType = "Received";

    // Extract sender
    const senderMatch = message.match(/from\s+([A-Z\s]+?)\s+(?:\d{10,}|on)/i);
    if (senderMatch) {
      transaction.sender = senderMatch[1].trim();
    }

    // Extract phone
    const phoneMatch = message.match(/from\s+[A-Z\s]+?\s+(\d{10,})/i);
    if (phoneMatch) {
      transaction.phoneNumber = phoneMatch[1];
    }
  }

  // **SENT TRANSACTIONS**
  else if (lowerMessage.includes("sent to")) {
    transaction.rawType = "Sent";

    // Extract recipient
    const recipientMatch = message.match(/to\s+([A-Z\s]+?)\s+(?:\d{10,}|on)/i);
    if (recipientMatch) {
      transaction.recipient = recipientMatch[1].trim();
    }

    // Extract phone
    const phoneMatch = message.match(/to\s+[A-Z\s]+?\s+(\d{10,})/i);
    if (phoneMatch) {
      transaction.phoneNumber = phoneMatch[1];
    }
  }

  // **PAYBILL PAYMENTS**
  else if (lowerMessage.includes("paid to") || lowerMessage.includes("paybill")) {
    transaction.rawType = "PayBill";

    // Extract merchant
    const merchantMatch = message.match(/(?:paid to|paybill)\s+([A-Z\s&\-]+?)(?:\.|account|on|$)/i);
    if (merchantMatch) {
      transaction.merchantName = merchantMatch[1].trim();
    }

    // Extract paybill number
    const paybillMatch = message.match(/paybill\s+(\d+)/i);
    if (paybillMatch) {
      transaction.paybillNumber = paybillMatch[1];
    }

    // Extract account number
    const accountMatch = message.match(/account\s+(?:number\s+)?([A-Z0-9]+)/i);
    if (accountMatch) {
      transaction.accountNumber = accountMatch[1];
    }
  }

  // **BUY GOODS (Till Number)**
  else if (lowerMessage.includes("buy goods") || lowerMessage.includes("till number")) {
    transaction.rawType = "BuyGoods";

    // Extract merchant
    const merchantMatch = message.match(/(?:at|from)\s+([A-Z\s&\-]+?)(?:\.|till|on|$)/i);
    if (merchantMatch) {
      transaction.merchantName = merchantMatch[1].trim();
    }

    // Extract till number
    const tillMatch = message.match(/till\s+(?:number\s+)?(\d+)/i);
    if (tillMatch) {
      transaction.tillNumber = tillMatch[1];
    }
  }

  // **WITHDRAWALS**
  else if (lowerMessage.includes("withdraw")) {
    if (lowerMessage.includes("atm")) {
      transaction.rawType = "WithdrawATM";
    } else {
      transaction.rawType = "WithdrawAgent";

      // Extract agent name
      const agentMatch = message.match(/from\s+([A-Z\s&\-]+?)\s+(?:agent|on|$)/i);
      if (agentMatch) {
        transaction.merchantName = agentMatch[1].trim();
      }
    }
  }

  // **AIRTIME PURCHASE**
  else if (lowerMessage.includes("airtime")) {
    if (lowerMessage.includes("for") && !lowerMessage.includes("yourself")) {
      transaction.rawType = "AirtimeOther";
      const phoneMatch = message.match(/for\s+(\d{10,})/i);
      if (phoneMatch) {
        transaction.phoneNumber = phoneMatch[1];
      }
    } else {
      transaction.rawType = "Airtime";
    }
  }

  // **FULIZA**
  else if (lowerMessage.includes("fuliza")) {
    if (lowerMessage.includes("repay") || lowerMessage.includes("repaid")) {
      transaction.rawType = "FulizaRepayment";
    } else {
      transaction.rawType = "FulizaLoan";
    }
  }

  // **REVERSAL**
  else if (lowerMessage.includes("revers")) {
    transaction.rawType = "Reversal";
  }

  // **UNKNOWN**
  else {
    transaction.rawType = "Unknown";
  }
}

/**
 * Parse amount from string
 */
function parseAmount(value: string): number {
  if (!value) return 0;

  // Remove currency symbols, commas, and whitespace
  const cleaned = value.replace(/[Ksh,\s]/gi, "").trim();

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Common M-PESA message templates for reference:
 *
 * RECEIVED:
 * "SH12ABC3XY Confirmed. You have received Ksh500.00 from JOHN DOE 254712345678 on 1/11/24 at 10:30 AM New M-PESA balance is Ksh5,500.00"
 *
 * SENT:
 * "SH12ABC3XY Confirmed. Ksh1,000.00 sent to JANE SMITH 254722222222 on 1/11/24 at 2:15 PM New M-PESA balance is Ksh4,500.00"
 *
 * PAYBILL:
 * "SH12ABC3XY Confirmed. Ksh50.00 paid to SUPERMARKET. Account Number 123456 on 1/11/24 at 3:00 PM New M-PESA balance is Ksh4,450.00"
 *
 * BUY GOODS:
 * "SH12ABC3XY Confirmed. Ksh200.00 paid to SHOP ABC for account GOODS. Till Number 654321 on 1/11/24 at 4:00 PM New M-PESA balance is Ksh4,250.00"
 *
 * WITHDRAWAL:
 * "SH12ABC3XY Confirmed. Ksh2,000.00 withdrawn from ABC AGENT on 1/11/24 at 5:00 PM New M-PESA balance is Ksh2,250.00"
 *
 * AIRTIME:
 * "SH12ABC3XY Confirmed. Ksh100.00 airtime purchased on 1/11/24 at 6:00 PM New M-PESA balance is Ksh2,150.00"
 */

