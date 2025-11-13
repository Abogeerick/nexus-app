/**
 * Forgot Password API Route
 *
 * POST /api/auth/forgot-password
 * Sends password reset email with token
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateRandomToken } from "@/lib/auth/jwt";
import { sendPasswordResetEmail } from "@/lib/auth/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration attacks
    // Don't reveal whether the email exists or not
    if (!user) {
      return NextResponse.json(
        {
          message:
            "If an account with that email exists, a password reset link has been sent.",
        },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = generateRandomToken();

    // Token expires in 1 hour
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1);

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: expiryDate,
      },
    });

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, user.name || "there", resetToken);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      return NextResponse.json(
        { error: "Failed to send password reset email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "If an account with that email exists, a password reset link has been sent.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}

