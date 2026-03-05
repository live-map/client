import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getPostList, getCommentList } from "@/lib/api";
import ProfileClient from "@/components/profile/profile-client";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { id, name, email, image } = session.user;

  const [postsResult, commentsResult] = await Promise.all([
    getPostList(10, 0, undefined, id),
    getCommentList(undefined, id, 10),
  ]);

  const postCount = postsResult.data?.total ?? 0;
  const commentCount = commentsResult.data?.total ?? 0;
  const initialPosts = postsResult.data?.items ?? [];
  const initialComments = commentsResult.data?.items ?? [];

  return (
    <ProfileClient
      user={{
        name: name ?? null,
        email: email ?? null,
        image: image ?? null,
        createdAt: new Date().toISOString(),
      }}
      userId={id}
      postCount={postCount}
      commentCount={commentCount}
      initialPosts={initialPosts}
      initialComments={initialComments}
    />
  );
}
