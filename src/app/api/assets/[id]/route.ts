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
    const asset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!asset || asset.userId !== session.user.id) {
      return NextResponse.json({ error: "Asset not found or unauthorized" }, { status: 404 });
    }

    await prisma.asset.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting asset:", error);
    return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
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
    const { name, symbol, type, quantity, purchasePrice, currency, exchange, notes } = body;

     // Verify ownership
     const existingAsset = await prisma.asset.findUnique({
        where: { id },
      });
  
      if (!existingAsset || existingAsset.userId !== session.user.id) {
        return NextResponse.json({ error: "Asset not found or unauthorized" }, { status: 404 });
      }

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        name,
        symbol,
        type,
        quantity: quantity ? parseFloat(quantity) : undefined,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        currency,
        exchange,
        notes,
      },
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Error updating asset:", error);
    return NextResponse.json({ error: "Failed to update asset" }, { status: 500 });
  }
}

