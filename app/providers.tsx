"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { LoginModalProvider } from "@/components/auth/login-modal";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <LoginModalProvider>
        {children}
        <Toaster position="top-center" richColors />
      </LoginModalProvider>
    </SessionProvider>
  );
}
