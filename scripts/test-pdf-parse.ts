/**
 * Test script to parse M-PESA PDF and analyze extraction results
 * Run with: npx ts-node scripts/test-pdf-parse.ts
 */

import fs from "fs";
import path from "path";

// Import the PDF parser
async function testPDFParse() {
  console.log("=== M-PESA PDF Parser Test ===\n");

  // Read the PDF file
  const pdfPath = path.join(process.cwd(), "public", "samples", "MPESA_Statement_2025-11-18_to_2025-05-18_2547xxxxxx507 (1)_unlocked.pdf");
  
  if (!fs.existsSync(pdfPath)) {
    console.error("❌ PDF file not found at:", pdfPath);
    return;
  }

  console.log("✅ PDF file found");
  console.log("📄 File size:", fs.statSync(pdfPath).size, "bytes\n");

  // Read as buffer
  const pdfBuffer = fs.readFileSync(pdfPath);

  try {
    // Dynamically import the parser
    const { parseMpesaPDF } = await import("../src/lib/parsers/mpesa-pdf");
    
    console.log("🔄 Starting PDF parsing...\n");
    const startTime = Date.now();

    const result = await parseMpesaPDF(pdfBuffer);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log("\n=== PARSING RESULTS ===");
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`✅ Transactions parsed: ${result.transactions.length}`);
    console.log(`⚠️  Errors: ${result.errors.length}\n`);

    if (result.errors.length > 0) {
      console.log("=== ERRORS (first 10) ===");
      result.errors.slice(0, 10).forEach((err, idx) => {
        console.log(`${idx + 1}. Line ${err.line}: ${err.error}`);
        console.log(`   Text: ${err.rawText.substring(0, 80)}...`);
      });
      console.log();
    }

    if (result.transactions.length > 0) {
      console.log("=== FIRST 10 TRANSACTIONS ===");
      result.transactions.slice(0, 10).forEach((txn, idx) => {
        console.log(`\n${idx + 1}. ${txn.transactionCode} - ${txn.date} ${txn.time || ""}`);
        console.log(`   Amount: KES ${txn.amount} | Balance: KES ${txn.balance || "N/A"}`);
        console.log(`   Type: ${txn.rawType || "Unknown"}`);
        console.log(`   Merchant: ${txn.merchantName || "N/A"}`);
        console.log(`   Sender: ${txn.sender || "N/A"}`);
        console.log(`   Recipient: ${txn.recipient || "N/A"}`);
        console.log(`   Phone: ${txn.phoneNumber || "N/A"}`);
        console.log(`   Original: ${txn.originalText?.substring(0, 100) || "N/A"}...`);
      });

      console.log("\n=== LAST 5 TRANSACTIONS ===");
      result.transactions.slice(-5).forEach((txn, idx) => {
        console.log(`\n${result.transactions.length - 4 + idx}. ${txn.transactionCode} - ${txn.date} ${txn.time || ""}`);
        console.log(`   Amount: KES ${txn.amount} | Type: ${txn.rawType || "Unknown"}`);
        console.log(`   Merchant: ${txn.merchantName || "N/A"}`);
      });

      // Statistics
      console.log("\n=== STATISTICS ===");
      const withMerchant = result.transactions.filter(t => t.merchantName && t.merchantName !== "Unknown").length;
      const withSender = result.transactions.filter(t => t.sender).length;
      const withRecipient = result.transactions.filter(t => t.recipient).length;
      const withType = result.transactions.filter(t => t.rawType).length;
      const withPhone = result.transactions.filter(t => t.phoneNumber).length;

      console.log(`Transactions with merchant name: ${withMerchant} (${((withMerchant / result.transactions.length) * 100).toFixed(1)}%)`);
      console.log(`Transactions with sender: ${withSender} (${((withSender / result.transactions.length) * 100).toFixed(1)}%)`);
      console.log(`Transactions with recipient: ${withRecipient} (${((withRecipient / result.transactions.length) * 100).toFixed(1)}%)`);
      console.log(`Transactions with type: ${withType} (${((withType / result.transactions.length) * 100).toFixed(1)}%)`);
      console.log(`Transactions with phone: ${withPhone} (${((withPhone / result.transactions.length) * 100).toFixed(1)}%)`);

      // Transaction types breakdown
      console.log("\n=== TRANSACTION TYPES ===");
      const typeCount: Record<string, number> = {};
      result.transactions.forEach(t => {
        const type = t.rawType || "Unknown";
        typeCount[type] = (typeCount[type] || 0) + 1;
      });
      Object.entries(typeCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
          console.log(`${type}: ${count} (${((count / result.transactions.length) * 100).toFixed(1)}%)`);
        });

      // Top merchants
      console.log("\n=== TOP 10 MERCHANTS ===");
      const merchantCount: Record<string, number> = {};
      result.transactions.forEach(t => {
        if (t.merchantName && t.merchantName !== "Unknown") {
          merchantCount[t.merchantName] = (merchantCount[t.merchantName] || 0) + 1;
        }
      });
      Object.entries(merchantCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([merchant, count]) => {
          console.log(`${merchant}: ${count} transactions`);
        });
    }

  } catch (error) {
    console.error("❌ Error parsing PDF:", error);
    if (error instanceof Error) {
      console.error("Stack trace:", error.stack);
    }
  }
}

// Run the test
testPDFParse().catch(console.error);


