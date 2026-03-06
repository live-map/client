"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { LoginModalProvider } from "@/components/auth/login-modal";
import { AuthProvider } from "@/lib/auth/auth-context";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <LoginModalProvider>
          {children}
          <Toaster position="top-center" richColors />
        </LoginModalProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
