"use client";

import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OptionFields } from "./option-fields";
import { createPoll } from "@/app/actions/polls";
import { createPollSchema, type CreatePollFormValues } from "@/lib/validations/poll";

export function PollForm() {
  const router = useRouter();

  const form = useForm<CreatePollFormValues>({
    resolver: zodResolver(createPollSchema),
    defaultValues: {
      title: "",
      description: "",
      options: [{ text: "" }, { text: "" }],
      sources: [],
    },
  });

  const onSubmit = async (data: CreatePollFormValues) => {
    const result = await createPoll(data);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("여론조사가 등록되었습니다");
      router.push("/polls");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>여론조사 제안하기</CardTitle>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input id="title" placeholder="무엇에 대해 물어볼까요?" {...form.register("title")} />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명 (선택)</Label>
              <Textarea
                id="description"
                placeholder="여론조사에 대한 배경이나 맥락을 설명해주세요"
                rows={3}
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <OptionFields />

            <div className="flex gap-2">
              <Button type="submit" disabled={form.formState.isSubmitting} className="flex-1">
                {form.formState.isSubmitting ? "등록 중..." : "제안하기"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                취소
              </Button>
            </div>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
