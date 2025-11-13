/**
 * Email Verification API Route
 *
 * POST /api/auth/verify-email
 * Verifies user's email address using token
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/auth/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Verification token is required" }, { status: 400 });
    }

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({ message: "Email is already verified" }, { status: 200 });
    }

    // Update user to verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null, // Clear the token
      },
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name || "there");
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail verification if welcome email fails
    }

    return NextResponse.json(
      {
        message: "Email verified successfully! You can now sign in.",
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "An error occurred during email verification" },
      { status: 500 }
    );
  }
}

// GET method for token from URL parameter
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Verification token is required" }, { status: 400 });
  }

  // Reuse POST logic
  return POST(
    new NextRequest(request.url, {
      method: "POST",
      body: JSON.stringify({ token }),
    })
  );
}

