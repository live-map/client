"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth/auth-context";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPollById } from "@/app/actions/polls/queries";
import { updatePoll } from "@/app/actions/polls/mutations";
import { updatePollSchema, type UpdatePollFormValues } from "@/lib/validations/poll";

export default function PollEditPage() {
  const params = useParams<{ pollId: string }>();
  const router = useRouter();
  const { user, status: authStatus } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  const form = useForm<UpdatePollFormValues>({
    resolver: zodResolver(updatePollSchema),
    defaultValues: { title: "", description: "" },
  });

  // Redirect unauthenticated users
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/auth/signin");
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;

    getPollById(params.pollId)
      .then((poll) => {
        if (!poll) {
          toast.error("여론조사를 찾을 수 없습니다");
          router.replace("/");
          return;
        }
        // Verify ownership
        if (poll.userId !== user?.id) {
          toast.error("수정 권한이 없습니다");
          router.replace(`/polls/${params.pollId}`);
          return;
        }
        form.reset({
          title: poll.title,
          description: poll.description ?? "",
        });
        setLoading(false);
      })
      .catch(() => {
        toast.error("데이터를 불러오지 못했습니다");
        router.replace("/");
      });
  }, [params.pollId, router, form, authStatus, user?.id]);

  const onSubmit = (data: UpdatePollFormValues) => {
    startTransition(async () => {
      const result = await updatePoll(params.pollId, data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("여론조사가 수정되었습니다");
      router.push(`/polls/${params.pollId}`);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm">뒤로</span>
      </button>

      <Card>
        <CardHeader>
          <CardTitle>여론조사 수정</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input id="title" {...form.register("title")} />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea id="description" rows={4} {...form.register("description")} />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isPending} className="flex-1">
                {isPending ? "수정 중..." : "수정하기"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                취소
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
