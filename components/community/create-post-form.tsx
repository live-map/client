"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

import { createPostSchema, type CreatePostFormValues } from "@/lib/validations/post";
import { validateImageFile } from "@/lib/validations/media";
import { createPost, generatePresignedUrl } from "@/lib/api";
import { useAuthAction } from "@/lib/hooks/use-auth-action";
import type { PostMediaCreate } from "@/generated/openapi-client/types.gen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";

const MAX_FILES = 10;

interface MediaPreview {
  file: File;
  previewUrl: string;
}

export function CreatePostForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<MediaPreview[]>([]);
  const { isAuthError } = useAuthAction();

  const form = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { title: "", content: "" },
  });

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (selectedFiles.length === 0) return;

    if (files.length + selectedFiles.length > MAX_FILES) {
      toast.error(`이미지는 최대 ${MAX_FILES}개까지 첨부할 수 있습니다.`);
      return;
    }

    const newFiles: MediaPreview[] = [];
    for (const file of selectedFiles) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        continue;
      }
      newFiles.push({ file, previewUrl: URL.createObjectURL(file) });
    }

    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function onSubmit(data: CreatePostFormValues) {
    try {
      const media: PostMediaCreate[] = [];
      for (const { file } of files) {
        const {
          data: presigned,
          error: presignedError,
          status: presignedStatus,
        } = await generatePresignedUrl({
          filename: file.name,
          content_type: file.type,
          folder: "posts",
        });

        if (presignedError || !presigned) {
          if (
            isAuthError(
              { error: String(presignedError), status: presignedStatus },
              "게시글을 작성하려면 로그인이 필요합니다"
            )
          )
            return;
          toast.error("이미지 업로드 URL 생성에 실패했습니다.");
          return;
        }

        const uploadRes = await fetch(presigned.upload_url, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadRes.ok) {
          toast.error(`이미지 업로드에 실패했습니다: ${file.name}`);
          return;
        }

        media.push({
          media_type: "IMAGE",
          url: presigned.access_url,
          original_filename: file.name,
          file_size: file.size,
        });
      }

      const { error, status } = await createPost({
        title: data.title,
        content: data.content,
        media: media.length > 0 ? media : undefined,
      });

      if (error) {
        if (
          isAuthError({ error: String(error), status }, "게시글을 작성하려면 로그인이 필요합니다")
        )
          return;
        toast.error("게시글 작성에 실패했습니다.");
        return;
      }

      for (const { previewUrl } of files) {
        URL.revokeObjectURL(previewUrl);
      }

      toast.success("게시글이 작성되었습니다.");
      router.push("/community");
    } catch {
      toast.error("게시글 작성 중 오류가 발생했습니다.");
    }
  }

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-foreground">글쓰기</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="제목을 입력하세요" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="내용을 입력하세요"
                    className="min-h-[200px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Media */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={files.length >= MAX_FILES}
            >
              <ImagePlus className="w-4 h-4" />
              이미지 추가 ({files.length}/{MAX_FILES})
            </Button>

            {files.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {files.map((item, index) => (
                  <div
                    key={item.previewUrl}
                    className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "게시 중..." : "게시하기"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
