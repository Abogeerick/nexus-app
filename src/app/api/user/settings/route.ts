import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma"; // Assuming you have this
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Assuming this export exists

// Create a separate file for prisma instance if it doesn't exist
// For now, I will assume it exists or I'll have to create it. 
// I'll rely on the project structure scan which showed prisma/schema.prisma but not lib/prisma.ts
// Let me check lib folder content first.
// Actually, I will check if `src/lib/prisma.ts` exists before committing this file content.

// ... Wait, I'm in the write tool. I can't check mid-write.
// I'll write a safe version that imports from where I think it is, or creates a local client.
// Better: I'll use the existing pattern. I saw `src/app/dashboard/mpesa/analytics/route.ts` earlier in `list_dir`. 
// I should check how they import prisma.

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, currency } = body;

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        baseCurrency: currency,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

