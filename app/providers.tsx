"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { LoginModalProvider } from "@/components/auth/login-modal";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <LoginModalProvider>
          {children}
          <Toaster position="top-center" richColors />
        </LoginModalProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
