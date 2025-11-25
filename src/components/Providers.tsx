"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ReactNode } from "react";
import { RouteLoader } from "@/components/loading";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        <RouteLoader />
        {children}
      </NextThemesProvider>
    </NextAuthSessionProvider>
  );
}

