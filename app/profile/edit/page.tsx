"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth/auth-context";
import { updateProfile } from "@/lib/api";
import { toast } from "sonner";

const profileSchema = z.object({
  name: z.string().min(1, "닉네임을 입력해주세요").max(20, "닉네임은 20자 이내로 입력해주세요"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, refreshAuth } = useAuth();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    const result = await updateProfile({ name: data.name });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("프로필이 수정되었습니다");
    refreshAuth();
    router.push("/profile");
  };

  const nameValue = form.watch("name");

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="p-1.5 -ml-1.5 hover:bg-foreground/5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
            <h1 className="font-bold text-foreground">프로필 수정</h1>
          </div>
        </div>
      </header>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <main className="max-w-lg mx-auto px-4 py-6">
          {/* 프로필 이미지 */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
                {nameValue?.charAt(0) ?? "?"}
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 닉네임 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">닉네임</label>
            <input
              type="text"
              {...form.register("name")}
              maxLength={20}
              className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="닉네임을 입력하세요"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive mt-1.5">
                {form.formState.errors.name.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1.5">{nameValue?.length ?? 0}/20</p>
          </div>
        </main>

        {/* 저장 버튼 */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="max-w-lg mx-auto px-4 py-3">
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting || !nameValue?.trim()}
            >
              {form.formState.isSubmitting ? "저장 중..." : "저장하기"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
