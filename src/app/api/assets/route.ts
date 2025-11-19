import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/prisma";
import { getCryptoPrice } from "@/lib/fetchers/price";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assets = await prisma.asset.findMany({
      where: { userId: session.user.id },
    });

    // Update prices for Crypto assets
    const updatedAssets = await Promise.all(assets.map(async (asset) => {
        if (asset.type === "CRYPTO") {
            const currentPrice = await getCryptoPrice(asset.symbol);
            if (currentPrice) {
                // In a real app, we would update the DB or just return the live price.
                // Let's return the live price in the response but not persist it yet to avoid DB writes on every read.
                return { ...asset, currentPrice };
            }
        }
        return { ...asset, currentPrice: asset.purchasePrice }; // Fallback to purchase price
    }));

    return NextResponse.json(updatedAssets);
  } catch (error) {
    console.error("Error fetching assets:", error);
    return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, symbol, type, quantity, purchasePrice, currency, exchange, notes } = body;

    if (!name || !quantity || !purchasePrice) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const asset = await prisma.asset.create({
      data: {
        userId: session.user.id,
        name,
        symbol: symbol || name, // Default symbol to name if not provided
        type,
        quantity: parseFloat(quantity),
        purchasePrice: parseFloat(purchasePrice),
        currency: currency || "KES",
        exchange,
        notes,
      },
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Error creating asset:", error);
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 });
  }
}
