/**
 * Full Seed Script
 * 
 * Seeds:
 * 1. User
 * 2. M-PESA Transactions (from seed-mpesa-demo.ts)
 * 3. Assets (Stocks, Crypto)
 * 4. Accounts (Bank, Cash)
 * 
 * Run with: npx dotenv -e .env.local -- tsx prisma/seed-full.ts
 */

import { PrismaClient, MpesaTransactionType, AssetType, AccountType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Demo credentials
const DEMO_USER = {
  email: "demo@nexus.ke",
  password: "Demo@2025",
  name: "Demo User",
};

async function main() {
  console.log("🌱 Starting comprehensive seed...");

  // 1. Clean up
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: DEMO_USER.email },
    });
    
    if (existingUser) {
      console.log("🗑️  Cleaning up existing demo data...");
      await prisma.mpesaTransaction.deleteMany({ where: { userId: existingUser.id } });
      await prisma.asset.deleteMany({ where: { userId: existingUser.id } });
      await prisma.account.deleteMany({ where: { userId: existingUser.id } });
      await prisma.user.delete({ where: { id: existingUser.id } });
    }
  } catch (e) {
    console.log("ℹ️  Cleanup skipped or failed (non-fatal)");
  }

  // 2. Create User
  console.log("👤 Creating user...");
  const hashedPassword = await bcrypt.hash(DEMO_USER.password, 10);
  const user = await prisma.user.create({
    data: {
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      password: hashedPassword,
      emailVerified: true,
      baseCurrency: "KES",
    },
  });

  // 3. Create Accounts
  console.log("🏦 Creating accounts...");
  const equityBank = await prisma.account.create({
    data: {
      userId: user.id,
      name: "Equity Salary Account",
      type: AccountType.BANK,
      balance: 145000,
      currency: "KES",
      institutionName: "Equity Bank",
      accountNumber: "1234567890",
    },
  });

  const mpesaAccount = await prisma.account.create({
    data: {
      userId: user.id,
      name: "M-PESA",
      type: AccountType.MPESA,
      balance: 24500, // Will be updated by transaction seed
      currency: "KES",
      institutionName: "Safaricom",
    },
  });

  const cashAccount = await prisma.account.create({
    data: {
      userId: user.id,
      name: "Petty Cash",
      type: AccountType.CASH,
      balance: 5000,
      currency: "KES",
    },
  });

  // 4. Create Assets (Investments)
  console.log("📈 Creating investments...");
  
  // Stocks
  await prisma.asset.create({
    data: {
      userId: user.id,
      name: "Safaricom PLC",
      symbol: "SCOM",
      type: AssetType.STOCK,
      quantity: 5000,
      purchasePrice: 15.50, // Bought at 15.50
      currency: "KES",
      exchange: "NSE",
      notes: "Long term hold, bought during dip",
    },
  });

  await prisma.asset.create({
    data: {
      userId: user.id,
      name: "KCB Group",
      symbol: "KCB",
      type: AssetType.STOCK,
      quantity: 1000,
      purchasePrice: 32.00,
      currency: "KES",
      exchange: "NSE",
    },
  });

  await prisma.asset.create({
    data: {
      userId: user.id,
      name: "Apple Inc.",
      symbol: "AAPL",
      type: AssetType.STOCK,
      quantity: 10,
      purchasePrice: 175.50,
      currency: "USD",
      exchange: "NASDAQ",
      notes: "Tech growth portfolio",
    },
  });

  // Crypto
  await prisma.asset.create({
    data: {
      userId: user.id,
      name: "Bitcoin",
      symbol: "BTC",
      type: AssetType.CRYPTO,
      quantity: 0.05,
      purchasePrice: 62000,
      currency: "USD",
      exchange: "Binance",
    },
  });

  await prisma.asset.create({
    data: {
      userId: user.id,
      name: "Ethereum",
      symbol: "ETH",
      type: AssetType.CRYPTO,
      quantity: 1.5,
      purchasePrice: 3200,
      currency: "USD",
      exchange: "Binance",
    },
  });

  // 5. Create M-PESA Transactions (Simplified from seed-mpesa-demo.ts)
  console.log("💸 Generating M-PESA transactions...");
  
  // ... (Insert transaction generation logic here, simplified for brevity but maintaining volume)
  const transactions = [];
  let currentBalance = 50000;
  const now = new Date();
  
  // Helper for random dates
  const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  for (let i = 0; i < 100; i++) {
    const isIncome = Math.random() < 0.2;
    const amount = Math.floor(Math.random() * 5000) + 100;
    const date = randomDate(sixMonthsAgo, now);
    
    if (isIncome) {
        currentBalance += amount;
    } else {
        currentBalance -= amount;
    }

    transactions.push({
        userId: user.id,
        accountId: mpesaAccount.id,
        transactionCode: `QD${Math.random().toString(36).substring(7).toUpperCase()}`,
        transactionHash: `hash_${i}`,
        amount,
        balanceAfter: currentBalance > 0 ? currentBalance : 0,
        currency: "KES",
        transactionDate: date,
        timestamp: BigInt(date.getTime()),
        type: isIncome ? MpesaTransactionType.RECEIVED_FROM_PERSON : MpesaTransactionType.BUY_GOODS,
        category: isIncome ? "Income" : ["Groceries", "Transport", "Utilities", "Entertainment"][Math.floor(Math.random() * 4)],
        isIncome,
        counterpartyName: isIncome ? "John Doe" : "Naivas Supermarket",
        description: isIncome ? "Received funds" : "Payment for goods",
        source: "MANUAL", // Use string directly if enum import is tricky, but we imported it
        originalText: "Sample text",
        confidence: 1.0,
    });
  }

  // Correct enum usage requires casting if the type definition is strict or string if loose.
  // In Prisma client usage, we should use the Enum object values.
  // I'll use `any` for the bulk insert to avoid strict type fighting in this quick script if needed, 
  // but standard prisma types should work.

  // Actually, let's use createMany.
  await prisma.mpesaTransaction.createMany({
    data: transactions.map(t => ({
        ...t,
        source: "MANUAL" as any // Quick fix for potential enum mismatch in seed
    }))
  });
  
  // Update M-PESA account balance
  await prisma.account.update({
    where: { id: mpesaAccount.id },
    data: { balance: currentBalance > 0 ? currentBalance : 0 }
  });

  console.log("✅ Seed complete!");
  console.log(`   User: ${DEMO_USER.email}`);
  console.log(`   Pass: ${DEMO_USER.password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

