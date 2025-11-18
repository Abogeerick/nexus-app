import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const prisma = new PrismaClient();

async function clearMpesaData() {
  console.log("🗑️  Deleting all MPESA transactions...");
  
  const result = await prisma.mpesaTransaction.deleteMany({});
  
  console.log(`✅ Deleted ${result.count} transactions`);
  
  await prisma.$disconnect();
}

clearMpesaData()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

