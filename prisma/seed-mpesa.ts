/**
 * M-PESA Transaction Seed Script
 * 
 * Generates realistic dummy M-PESA transactions for testing and demo
 */

import { PrismaClient } from "@prisma/client";
import { MpesaTransactionType, MpesaStatementFormat } from "@prisma/client";

const prisma = new PrismaClient();

// Sample data
const merchants = [
  // Groceries
  { name: "Naivas Supermarket", category: "Groceries", type: MpesaTransactionType.BUY_GOODS, till: "123456" },
  { name: "Carrefour", category: "Groceries", type: MpesaTransactionType.BUY_GOODS, till: "234567" },
  { name: "QuickMart Supermarket", category: "Groceries", type: MpesaTransactionType.BUY_GOODS, till: "345678" },
  
  // Dining
  { name: "Java House", category: "Dining", type: MpesaTransactionType.BUY_GOODS, till: "456789" },
  { name: "KFC Kenya", category: "Dining", type: MpesaTransactionType.BUY_GOODS, till: "567890" },
  { name: "ArtCaffe", category: "Dining", type: MpesaTransactionType.BUY_GOODS, till: "678901" },
  { name: "Domino's Pizza", category: "Dining", type: MpesaTransactionType.BUY_GOODS, till: "789012" },
  
  // Transport
  { name: "Uber", category: "Transport", type: MpesaTransactionType.BUY_GOODS, till: "890123" },
  { name: "Bolt", category: "Transport", type: MpesaTransactionType.BUY_GOODS, till: "901234" },
  { name: "Total Energies", category: "Transport", type: MpesaTransactionType.BUY_GOODS, till: "012345" },
  
  // Utilities
  { name: "Kenya Power (KPLC)", category: "Utilities", type: MpesaTransactionType.PAYBILL, paybill: "888880", account: "123456789" },
  { name: "Safaricom", category: "Utilities", type: MpesaTransactionType.AIRTIME_PURCHASE },
  { name: "Zuku", category: "Utilities", type: MpesaTransactionType.PAYBILL, paybill: "320320", account: "ACC123" },
  { name: "Nairobi Water", category: "Utilities", type: MpesaTransactionType.PAYBILL, paybill: "444444", account: "WAT789" },
  
  // Healthcare
  { name: "Goodlife Pharmacy", category: "Healthcare", type: MpesaTransactionType.BUY_GOODS, till: "111222" },
  { name: "Aga Khan Hospital", category: "Healthcare", type: MpesaTransactionType.PAYBILL, paybill: "555555", account: "PAT456" },
  
  // Shopping
  { name: "Jumia Kenya", category: "Shopping", type: MpesaTransactionType.PAYBILL, paybill: "666666", account: "ORD123" },
  
  // Entertainment
  { name: "Netflix", category: "Entertainment", type: MpesaTransactionType.PAYBILL, paybill: "777777", account: "SUB123" },
  { name: "Showmax", category: "Entertainment", type: MpesaTransactionType.PAYBILL, paybill: "888888", account: "SUB456" },
];

const people = [
  { name: "JOHN KAMAU", phone: "254712345678" },
  { name: "MARY WANJIKU", phone: "254722222222" },
  { name: "PETER OMONDI", phone: "254733333333" },
  { name: "GRACE AKINYI", phone: "254744444444" },
  { name: "DAVID MWANGI", phone: "254755555555" },
  { name: "SARAH NJERI", phone: "254766666666" },
];

// Generate random amounts based on category
function getRandomAmount(category: string): number {
  const ranges: Record<string, [number, number]> = {
    Groceries: [500, 8000],
    Dining: [300, 3000],
    Transport: [150, 1500],
    Utilities: [500, 5000],
    Healthcare: [200, 10000],
    Shopping: [1000, 15000],
    Entertainment: [500, 2000],
  };
  
  const [min, max] = ranges[category] || [100, 5000];
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random date within last 90 days
function getRandomDate(): Date {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 90);
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  
  // Random hour between 6 AM and 11 PM
  const hour = Math.floor(Math.random() * 17) + 6;
  const minute = Math.floor(Math.random() * 60);
  
  date.setHours(hour, minute, 0, 0);
  return date;
}

// Generate transaction code
function generateTransactionCode(index: number): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const prefix = letters[Math.floor(Math.random() * letters.length)] + 
                 letters[Math.floor(Math.random() * letters.length)];
  const numbers = String(index).padStart(2, "0");
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${numbers}${suffix}`;
}

// Generate transaction hash
function generateHash(code: string, date: Date, amount: number): string {
  const input = `${code}|${date.toISOString()}|${amount}`;
  // Simple hash (in real app we use crypto)
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0').substring(0, 16);
}

async function main() {
  console.log("🌱 Seeding M-PESA transactions...");

  // Get the first user (assuming you have at least one user)
  const user = await prisma.user.findFirst();
  
  if (!user) {
    console.error("❌ No user found. Please create a user first.");
    return;
  }

  console.log(`👤 Using user: ${user.email}`);

  // Delete existing M-PESA transactions for this user
  await prisma.mpesaTransaction.deleteMany({
    where: { userId: user.id },
  });

  console.log("🗑️  Cleared existing transactions");

  const transactions = [];
  let currentBalance = 50000; // Starting balance

  // Generate 80 transactions
  for (let i = 0; i < 80; i++) {
    const transactionCode = generateTransactionCode(i + 1);
    const transactionDate = getRandomDate();
    
    // 70% expenses, 30% income
    const isIncome = Math.random() < 0.3;
    
    let amount: number;
    let type: MpesaTransactionType;
    let counterpartyName: string;
    let merchantName: string | null = null;
    let normalizedMerchantName: string | null = null;
    let category: string;
    let paybillNumber: string | null = null;
    let tillNumber: string | null = null;
    let accountNumber: string | null = null;
    let counterpartyPhone: string | null = null;
    let description: string;

    if (isIncome) {
      // Income transaction
      const person = people[Math.floor(Math.random() * people.length)];
      amount = Math.floor(Math.random() * 15000) + 1000;
      type = MpesaTransactionType.RECEIVED_FROM_PERSON;
      counterpartyName = person.name;
      counterpartyPhone = person.phone;
      category = "Income";
      description = `Received KES ${amount.toLocaleString()} from ${person.name}`;
      currentBalance += amount;
    } else {
      // Expense transaction
      const rand = Math.random();
      
      if (rand < 0.15) {
        // Withdrawal (15%)
        amount = Math.floor(Math.random() * 5000) + 500;
        type = Math.random() < 0.7 ? MpesaTransactionType.WITHDRAW_AT_AGENT : MpesaTransactionType.WITHDRAW_AT_ATM;
        counterpartyName = type === MpesaTransactionType.WITHDRAW_AT_ATM ? "ATM Withdrawal" : "M-PESA Agent";
        category = "Cash Withdrawal";
        description = `Withdrew KES ${amount.toLocaleString()} at ${counterpartyName}`;
      } else if (rand < 0.25) {
        // Send to person (10%)
        const person = people[Math.floor(Math.random() * people.length)];
        amount = Math.floor(Math.random() * 5000) + 500;
        type = MpesaTransactionType.SENT_TO_PERSON;
        counterpartyName = person.name;
        counterpartyPhone = person.phone;
        category = "Transfer";
        description = `Sent KES ${amount.toLocaleString()} to ${person.name}`;
      } else {
        // Merchant payment (75%)
        const merchant = merchants[Math.floor(Math.random() * merchants.length)];
        amount = getRandomAmount(merchant.category);
        type = merchant.type;
        counterpartyName = merchant.name;
        merchantName = merchant.name;
        normalizedMerchantName = merchant.name;
        category = merchant.category;
        
        if (merchant.paybill) {
          paybillNumber = merchant.paybill;
          accountNumber = merchant.account;
        }
        if (merchant.till) {
          tillNumber = merchant.till;
        }
        
        description = `Paid KES ${amount.toLocaleString()} to ${merchant.name}`;
        
        if (type === MpesaTransactionType.PAYBILL && accountNumber) {
          description += ` (Acc: ${accountNumber})`;
        } else if (type === MpesaTransactionType.BUY_GOODS && tillNumber) {
          description += ` (Till: ${tillNumber})`;
        }
      }
      
      currentBalance -= amount;
    }

    const transactionHash = generateHash(transactionCode, transactionDate, amount);

    transactions.push({
      userId: user.id,
      transactionCode,
      transactionHash,
      amount,
      balanceAfter: currentBalance,
      currency: "KES",
      transactionDate,
      timestamp: BigInt(transactionDate.getTime()),
      type,
      category,
      isIncome,
      counterpartyName,
      counterpartyPhone,
      merchantName,
      normalizedMerchantName,
      paybillNumber,
      tillNumber,
      accountNumber,
      description,
      source: MpesaStatementFormat.CSV,
      originalText: description,
      confidence: 0.95,
      parseErrors: [],
    });
  }

  // Sort by date (oldest first) to simulate realistic balance progression
  transactions.sort((a, b) => a.transactionDate.getTime() - b.transactionDate.getTime());

  // Recalculate balances in chronological order
  currentBalance = 50000;
  for (const txn of transactions) {
    if (txn.isIncome) {
      currentBalance += txn.amount;
    } else {
      currentBalance -= txn.amount;
    }
    txn.balanceAfter = Math.max(0, currentBalance); // Don't go negative
  }

  // Insert transactions
  console.log("📝 Creating transactions...");
  
  for (const txn of transactions) {
    await prisma.mpesaTransaction.create({ data: txn });
  }

  console.log(`✅ Created ${transactions.length} M-PESA transactions`);
  
  // Summary stats
  const totalIncome = transactions.filter(t => t.isIncome).reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => !t.isIncome).reduce((sum, t) => sum + t.amount, 0);
  const netAmount = totalIncome - totalExpense;
  
  console.log("\n📊 Summary:");
  console.log(`   Total Income: KES ${totalIncome.toLocaleString()}`);
  console.log(`   Total Expense: KES ${totalExpense.toLocaleString()}`);
  console.log(`   Net Amount: KES ${netAmount.toLocaleString()}`);
  console.log(`   Final Balance: KES ${transactions[transactions.length - 1].balanceAfter.toLocaleString()}`);
  
  // Category breakdown
  const categoryStats = transactions
    .filter(t => !t.isIncome)
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
  
  console.log("\n📈 Spending by Category:");
  Object.entries(categoryStats)
    .sort(([, a], [, b]) => b - a)
    .forEach(([category, amount]) => {
      const percentage = (amount / totalExpense * 100).toFixed(1);
      console.log(`   ${category}: KES ${amount.toLocaleString()} (${percentage}%)`);
    });

  console.log("\n✨ Seed complete! Visit http://localhost:3000/dashboard/mpesa to see your data.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

