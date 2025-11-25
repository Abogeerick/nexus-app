/**
 * Seed script for M-PESA demo data
 * Creates demo user with realistic Kenyan M-PESA transactions
 * 
 * Run with: npm run db:seed:demo
 */

import { PrismaClient, MpesaTransactionType, MpesaStatementFormat } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Demo credentials
const DEMO_USER = {
  email: "demo@nexus.ke",
  password: "Demo@2025",
  name: "Demo User",
};

// Kenyan merchants and their categories
const MERCHANTS = {
  groceries: [
    "NAIVAS SUPERMARKET",
    "CARREFOUR KENYA",
    "QUICKMART SUPERMARKET",
    "CHANDARANA FOODPLUS",
    "CLEANSHELF SUPERMARKET",
  ],
  dining: [
    "KFC KENYA",
    "JAVA HOUSE",
    "ARTCAFFE",
    "DOMINOS PIZZA",
    "GALITOS",
    "STEERS",
    "CHICKEN INN",
  ],
  transport: [
    "UBER KENYA",
    "BOLT",
    "TOTAL ENERGIES",
    "SHELL",
    "KENOL KOBIL",
  ],
  utilities: [
    "SAFARICOM PLC",
    "KENYA POWER (KPLC)",
    "NAIROBI WATER",
    "ZUKU",
    "DSTV",
  ],
  healthcare: [
    "GOODLIFE PHARMACY",
    "AGA KHAN HOSPITAL",
    "NAIROBI HOSPITAL",
    "MERIDIAN PHARMACY",
  ],
  shopping: [
    "JUMIA KENYA",
    "BATA KENYA",
    "WOOLWORTHS",
    "GAME STORES",
  ],
  entertainment: [
    "PRESTIGE PLAZA CINEMA",
    "IMAX",
    "SPORTPESA",
    "BETIKA",
  ],
};

// Common Kenyan names for person transfers
const KENYAN_NAMES = [
  "JOHN KAMAU",
  "MARY WANJIKU",
  "PETER OTIENO",
  "GRACE AKINYI",
  "DAVID MWANGI",
  "FAITH NJERI",
  "JAMES OMONDI",
  "JANE MUTHONI",
  "SAMUEL KIPCHOGE",
  "ROSE CHEBET",
  "DANIEL KIMANI",
  "LUCY NYAMBURA",
  "PATRICK OCHIENG",
  "ESTHER WAMBUI",
  "MICHAEL KARANJA",
];

function generateTransactionCode(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  return (
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)]
  );
}

function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

async function main() {
  console.log("🌱 Seeding M-PESA demo data...");
  console.log("");

  // Try to delete existing demo user if exists
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: DEMO_USER.email },
    });
    
    if (existingUser) {
      await prisma.mpesaTransaction.deleteMany({
        where: { userId: existingUser.id },
      });
      await prisma.user.delete({
        where: { id: existingUser.id },
      });
      console.log("🗑️  Deleted existing demo user and transactions");
    }
  } catch (e) {
    console.log("ℹ️  No existing demo user to delete (or error checking)");
  }

  // Create demo user
  console.log("👤 Creating demo user...");
  const hashedPassword = await bcrypt.hash(DEMO_USER.password, 10);
  const user = await prisma.user.create({
    data: {
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      password: hashedPassword,
      emailVerified: true,
    },
  });
  console.log(`✅ Created user: ${user.email}`);
  console.log("");

  // Generate transactions for the last 6 months
  const transactions = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  let currentBalance = 50000; // Starting balance

  console.log("💰 Generating M-PESA transactions...");
  console.log("   Period: Last 6 months");
  console.log("   Starting balance: KES 50,000");
  console.log("");

  // Generate 300-500 transactions
  const numTransactions = 400;
  
  for (let i = 0; i < numTransactions; i++) {
    const transactionDate = randomDate(sixMonthsAgo, now);
    const transactionType = Math.random();

    let transaction;

    if (transactionType < 0.15) {
      // Income (15%)
      const amount = randomAmount(500, 10000);
      currentBalance += amount;
      const sender = randomItem(KENYAN_NAMES);
      
      transaction = {
        userId: user.id,
        transactionCode: generateTransactionCode(),
        transactionHash: `hash_${Date.now()}_${i}`,
        amount,
        balanceAfter: currentBalance,
        currency: "KES",
        transactionDate,
        timestamp: BigInt(transactionDate.getTime()),
        type: MpesaTransactionType.RECEIVED_FROM_PERSON,
        category: "Income",
        isIncome: true,
        counterpartyName: sender,
        counterpartyPhone: null,
        merchantName: null,
        normalizedMerchantName: null,
        paybillNumber: null,
        tillNumber: null,
        accountNumber: null,
        description: `Received KES ${amount.toLocaleString()} from ${sender}`,
        source: MpesaStatementFormat.PDF,
        originalText: `Received from ${sender}`,
        confidence: 1.0,
        parseErrors: [],
      };
    } else if (transactionType < 0.25) {
      // Groceries (10%)
      const merchant = randomItem(MERCHANTS.groceries);
      const amount = randomAmount(500, 5000);
      currentBalance -= amount;
      
      transaction = {
        userId: user.id,
        transactionCode: generateTransactionCode(),
        transactionHash: `hash_${Date.now()}_${i}`,
        amount,
        balanceAfter: currentBalance,
        currency: "KES",
        transactionDate,
        timestamp: BigInt(transactionDate.getTime()),
        type: MpesaTransactionType.BUY_GOODS,
        category: "Groceries",
        isIncome: false,
        counterpartyName: merchant,
        counterpartyPhone: null,
        merchantName: merchant,
        normalizedMerchantName: merchant,
        paybillNumber: null,
        tillNumber: `${Math.floor(Math.random() * 900000) + 100000}`,
        accountNumber: null,
        description: `Bought goods KES ${amount.toLocaleString()} at ${merchant}`,
        source: MpesaStatementFormat.PDF,
        originalText: `Buy goods at ${merchant}`,
        confidence: 1.0,
        parseErrors: [],
      };
    } else if (transactionType < 0.35) {
      // Dining (10%)
      const merchant = randomItem(MERCHANTS.dining);
      const amount = randomAmount(300, 2000);
      currentBalance -= amount;
      
      transaction = {
        userId: user.id,
        transactionCode: generateTransactionCode(),
        transactionHash: `hash_${Date.now()}_${i}`,
        amount,
        balanceAfter: currentBalance,
        currency: "KES",
        transactionDate,
        timestamp: BigInt(transactionDate.getTime()),
        type: MpesaTransactionType.BUY_GOODS,
        category: "Dining",
        isIncome: false,
        counterpartyName: merchant,
        counterpartyPhone: null,
        merchantName: merchant,
        normalizedMerchantName: merchant,
        paybillNumber: null,
        tillNumber: `${Math.floor(Math.random() * 900000) + 100000}`,
        accountNumber: null,
        description: `Bought goods KES ${amount.toLocaleString()} at ${merchant}`,
        source: MpesaStatementFormat.PDF,
        originalText: `Dining at ${merchant}`,
        confidence: 1.0,
        parseErrors: [],
      };
    } else if (transactionType < 0.42) {
      // Transport (7%)
      const merchant = randomItem(MERCHANTS.transport);
      const amount = randomAmount(100, 1500);
      currentBalance -= amount;
      
      transaction = {
        userId: user.id,
        transactionCode: generateTransactionCode(),
        transactionHash: `hash_${Date.now()}_${i}`,
        amount,
        balanceAfter: currentBalance,
        currency: "KES",
        transactionDate,
        timestamp: BigInt(transactionDate.getTime()),
        type: merchant.includes("UBER") || merchant.includes("BOLT") ? MpesaTransactionType.PAYBILL : MpesaTransactionType.BUY_GOODS,
        category: "Transport",
        isIncome: false,
        counterpartyName: merchant,
        counterpartyPhone: null,
        merchantName: merchant,
        normalizedMerchantName: merchant,
        paybillNumber: merchant.includes("UBER") || merchant.includes("BOLT") ? "888888" : null,
        tillNumber: merchant.includes("UBER") || merchant.includes("BOLT") ? null : `${Math.floor(Math.random() * 900000) + 100000}`,
        accountNumber: null,
        description: `Paid KES ${amount.toLocaleString()} to ${merchant}`,
        source: MpesaStatementFormat.PDF,
        originalText: `Payment to ${merchant}`,
        confidence: 1.0,
        parseErrors: [],
      };
    } else if (transactionType < 0.55) {
      // Utilities (13%)
      const merchant = randomItem(MERCHANTS.utilities);
      const amount = randomAmount(50, 3000);
      currentBalance -= amount;
      
      transaction = {
        userId: user.id,
        transactionCode: generateTransactionCode(),
        transactionHash: `hash_${Date.now()}_${i}`,
        amount,
        balanceAfter: currentBalance,
        currency: "KES",
        transactionDate,
        timestamp: BigInt(transactionDate.getTime()),
        type: merchant.includes("SAFARICOM") ? MpesaTransactionType.AIRTIME_PURCHASE : MpesaTransactionType.PAYBILL,
        category: "Utilities",
        isIncome: false,
        counterpartyName: merchant,
        counterpartyPhone: null,
        merchantName: merchant,
        normalizedMerchantName: merchant,
        paybillNumber: `${Math.floor(Math.random() * 900000) + 100000}`,
        tillNumber: null,
        accountNumber: null,
        description: merchant.includes("SAFARICOM") ? `Bought KES ${amount.toLocaleString()} airtime` : `Paid KES ${amount.toLocaleString()} to ${merchant}`,
        source: MpesaStatementFormat.PDF,
        originalText: `Payment to ${merchant}`,
        confidence: 1.0,
        parseErrors: [],
      };
    } else if (transactionType < 0.70) {
      // Sent to person (15%)
      const recipient = randomItem(KENYAN_NAMES);
      const amount = randomAmount(200, 5000);
      currentBalance -= amount;
      
      transaction = {
        userId: user.id,
        transactionCode: generateTransactionCode(),
        transactionHash: `hash_${Date.now()}_${i}`,
        amount,
        balanceAfter: currentBalance,
        currency: "KES",
        transactionDate,
        timestamp: BigInt(transactionDate.getTime()),
        type: MpesaTransactionType.SENT_TO_PERSON,
        category: "Transfer",
        isIncome: false,
        counterpartyName: recipient,
        counterpartyPhone: `2547${Math.floor(Math.random() * 100000000)}`,
        merchantName: null,
        normalizedMerchantName: null,
        paybillNumber: null,
        tillNumber: null,
        accountNumber: null,
        description: `Sent KES ${amount.toLocaleString()} to ${recipient}`,
        source: MpesaStatementFormat.PDF,
        originalText: `Send money to ${recipient}`,
        confidence: 1.0,
        parseErrors: [],
      };
    } else if (transactionType < 0.75) {
      // Fuliza loan/repayment (5%)
      const isLoan = Math.random() > 0.5;
      const amount = randomAmount(100, 2000);
      
      if (isLoan) {
        currentBalance += amount;
      } else {
        currentBalance -= amount;
      }
      
      transaction = {
        userId: user.id,
        transactionCode: generateTransactionCode(),
        transactionHash: `hash_${Date.now()}_${i}`,
        amount,
        balanceAfter: currentBalance,
        currency: "KES",
        transactionDate,
        timestamp: BigInt(transactionDate.getTime()),
        type: isLoan ? MpesaTransactionType.FULIZA_LOAN : MpesaTransactionType.FULIZA_REPAYMENT,
        category: "Financial",
        isIncome: isLoan,
        counterpartyName: isLoan ? "M-PESA Fuliza" : "M-PESA Fuliza Repayment",
        counterpartyPhone: null,
        merchantName: null,
        normalizedMerchantName: null,
        paybillNumber: null,
        tillNumber: null,
        accountNumber: null,
        description: isLoan ? `Fuliza loan KES ${amount.toLocaleString()}` : `Fuliza repayment KES ${amount.toLocaleString()}`,
        source: MpesaStatementFormat.PDF,
        originalText: isLoan ? "Fuliza loan" : "Fuliza repayment",
        confidence: 1.0,
        parseErrors: [],
      };
    } else if (transactionType < 0.85) {
      // Shopping (10%)
      const merchant = randomItem([...MERCHANTS.shopping, ...MERCHANTS.entertainment]);
      const amount = randomAmount(500, 8000);
      currentBalance -= amount;
      
      transaction = {
        userId: user.id,
        transactionCode: generateTransactionCode(),
        transactionHash: `hash_${Date.now()}_${i}`,
        amount,
        balanceAfter: currentBalance,
        currency: "KES",
        transactionDate,
        timestamp: BigInt(transactionDate.getTime()),
        type: MpesaTransactionType.BUY_GOODS,
        category: MERCHANTS.entertainment.includes(merchant) ? "Entertainment" : "Shopping",
        isIncome: false,
        counterpartyName: merchant,
        counterpartyPhone: null,
        merchantName: merchant,
        normalizedMerchantName: merchant,
        paybillNumber: null,
        tillNumber: `${Math.floor(Math.random() * 900000) + 100000}`,
        accountNumber: null,
        description: `Bought goods KES ${amount.toLocaleString()} at ${merchant}`,
        source: MpesaStatementFormat.PDF,
        originalText: `Purchase at ${merchant}`,
        confidence: 1.0,
        parseErrors: [],
      };
    } else {
      // Other transactions (15%)
      const merchant = randomItem([...MERCHANTS.healthcare, "LANDLORD", "NCBA BANK", "CO-OPERATIVE BANK"]);
      const amount = randomAmount(500, 15000);
      currentBalance -= amount;
      
      transaction = {
        userId: user.id,
        transactionCode: generateTransactionCode(),
        transactionHash: `hash_${Date.now()}_${i}`,
        amount,
        balanceAfter: currentBalance,
        currency: "KES",
        transactionDate,
        timestamp: BigInt(transactionDate.getTime()),
        type: MpesaTransactionType.PAYBILL,
        category: MERCHANTS.healthcare.includes(merchant) ? "Healthcare" : "Financial",
        isIncome: false,
        counterpartyName: merchant,
        counterpartyPhone: null,
        merchantName: merchant,
        normalizedMerchantName: merchant,
        paybillNumber: `${Math.floor(Math.random() * 900000) + 100000}`,
        tillNumber: null,
        accountNumber: null,
        description: `Paid KES ${amount.toLocaleString()} to ${merchant}`,
        source: MpesaStatementFormat.PDF,
        originalText: `Payment to ${merchant}`,
        confidence: 1.0,
        parseErrors: [],
      };
    }

    transactions.push(transaction);
  }

  // Sort by date (oldest first)
  transactions.sort((a, b) => a.transactionDate.getTime() - b.transactionDate.getTime());

  // Bulk insert
  console.log(`   Inserting ${transactions.length} transactions...`);
  await prisma.mpesaTransaction.createMany({
    data: transactions,
  });

  console.log(`✅ Created ${transactions.length} M-PESA transactions`);
  console.log("");

  // Summary
  const income = transactions.filter(t => t.isIncome).reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter(t => !t.isIncome).reduce((sum, t) => sum + t.amount, 0);
  
  console.log("📊 Summary:");
  console.log(`   Total Income: KES ${income.toLocaleString()}`);
  console.log(`   Total Expense: KES ${expense.toLocaleString()}`);
  console.log(`   Net Amount: KES ${(income - expense).toLocaleString()}`);
  console.log(`   Final Balance: KES ${currentBalance.toLocaleString()}`);
  console.log("");

  console.log("🎉 Seeding completed successfully!");
  console.log("");
  console.log("📝 Demo Credentials:");
  console.log(`   Email: ${DEMO_USER.email}`);
  console.log(`   Password: ${DEMO_USER.password}`);
  console.log("");
  console.log("🔗 Login at: http://localhost:3000/auth/login");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

