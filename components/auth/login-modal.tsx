"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OAuthButton } from "./oauth-button";

// ========================================
// Context
// ========================================

interface LoginModalContextValue {
  openLoginModal: (message?: string) => void;
  closeLoginModal: () => void;
}

const LoginModalContext = createContext<LoginModalContextValue | null>(null);

export function useLoginModal() {
  const ctx = useContext(LoginModalContext);
  if (!ctx) {
    throw new Error("useLoginModal must be used within LoginModalProvider");
  }
  return ctx;
}

// ========================================
// Provider
// ========================================

export function LoginModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const pathname = usePathname();

  const openLoginModal = useCallback((msg?: string) => {
    setMessage(msg);
    setOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setOpen(false);
    setMessage(undefined);
  }, []);

  return (
    <LoginModalContext.Provider value={{ openLoginModal, closeLoginModal }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>로그인</DialogTitle>
            <DialogDescription>
              {message || "서비스를 이용하려면 로그인이 필요합니다."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <OAuthButton provider="google" callbackUrl={pathname} />
            <OAuthButton provider="kakao" callbackUrl={pathname} />
          </div>
        </DialogContent>
      </Dialog>
    </LoginModalContext.Provider>
  );
}
