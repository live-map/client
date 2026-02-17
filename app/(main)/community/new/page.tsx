import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CreatePostForm } from "@/components/community/create-post-form";

export const metadata = {
  title: "게시글 작성 - Grapoll",
  description: "새로운 게시글을 작성해보세요",
};

export default async function NewPostPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/community/new");
  }

  return <CreatePostForm />;
}
