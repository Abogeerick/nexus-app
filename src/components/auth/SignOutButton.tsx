"use client";

/**
 * Sign Out Button Component
 *
 * Client component that handles user sign out
 */

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/", // Redirect to home page after sign out
    });
  };

  return (
    <button
      onClick={handleSignOut}
      className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-300 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
    >
      Sign Out
    </button>
  );
}



