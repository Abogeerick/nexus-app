import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const account = await prisma.account.findUnique({
      where: { id },
    });

    if (!account || account.userId !== session.user.id) {
      return NextResponse.json({ error: "Account not found or unauthorized" }, { status: 404 });
    }

    await prisma.account.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, type, balance, currency, institutionName, accountNumber } = body;

    // Verify ownership
    const existingAccount = await prisma.account.findUnique({
        where: { id },
    });
    
    if (!existingAccount || existingAccount.userId !== session.user.id) {
        return NextResponse.json({ error: "Account not found or unauthorized" }, { status: 404 });
    }

    const account = await prisma.account.update({
      where: { id },
      data: {
        name,
        type,
        balance: balance ? parseFloat(balance) : undefined,
        currency,
        institutionName,
        accountNumber,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}

