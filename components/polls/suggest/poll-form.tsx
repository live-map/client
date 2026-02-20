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
import {
  createPollSchema,
  interactionTypes,
  pollCategories,
  type CreatePollFormValues,
  type InteractionType,
} from "@/lib/validations/poll";
import { useEffect } from "react";

const TYPE_LABELS: Record<InteractionType, { label: string; icon: string }> = {
  SINGLE_CHOICE: { label: "단일선택", icon: "☝️" },
  BINARY: { label: "찬반", icon: "⚖️" },
  MULTIPLE_CHOICE: { label: "복수선택", icon: "✅" },
  SLIDER: { label: "척도", icon: "📊" },
  RANKING: { label: "순위", icon: "🏆" },
};

export function PollForm() {
  const router = useRouter();

  const form = useForm<CreatePollFormValues>({
    resolver: zodResolver(createPollSchema),
    defaultValues: {
      title: "",
      description: "",
      interactionType: "SINGLE_CHOICE",
      category: undefined,
      options: [{ text: "" }, { text: "" }],
      sources: [],
    },
  });

  const selectedType = form.watch("interactionType");

  // When switching type, adjust options accordingly
  useEffect(() => {
    if (selectedType === "BINARY") {
      form.setValue("options", [{ text: "찬성" }, { text: "반대" }]);
    } else if (selectedType === "SLIDER") {
      form.setValue("options", []);
    } else {
      // Restore empty options if coming from SLIDER/BINARY with preset values
      const current = form.getValues("options");
      if (current.length === 0) {
        form.setValue("options", [{ text: "" }, { text: "" }]);
      }
    }
  }, [selectedType, form]);

  const onSubmit = async (data: CreatePollFormValues) => {
    const result = await createPoll(data);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("AI 리서치 에이전트가 분석을 시작합니다");
      const pollId = result.data?.id;
      router.push(pollId ? `/polls/${pollId}` : "/");
    }
  };

  const showOptions = selectedType !== "SLIDER";

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

            {/* 투표 타입 선택 */}
            <div className="space-y-2">
              <Label>투표 타입</Label>
              <div className="flex flex-wrap gap-2">
                {interactionTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => form.setValue("interactionType", type)}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                      selectedType === type
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <span className="mr-1.5">{TYPE_LABELS[type].icon}</span>
                    {TYPE_LABELS[type].label}
                  </button>
                ))}
              </div>
            </div>

            {/* 카테고리 선택 */}
            <div className="space-y-2">
              <Label htmlFor="category">카테고리 (선택)</Label>
              <select
                id="category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.watch("category") || ""}
                onChange={(e) => form.setValue("category", e.target.value || undefined)}
              >
                <option value="">카테고리를 선택하세요</option>
                {pollCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 선택지 (SLIDER 제외) */}
            {showOptions && <OptionFields />}

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
