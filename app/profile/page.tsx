import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getPostList, getCommentList } from "@/lib/api";
import ProfileClient from "@/components/profile/profile-client";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { id, name, email, image } = session.user;

  const [dbUser, postsResult, commentsResult] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: { createdAt: true },
    }),
    getPostList(1, 0, undefined, id),
    getCommentList(undefined, id, 1),
  ]);

  const postCount = postsResult.data?.total ?? 0;
  const commentCount = commentsResult.data?.total ?? 0;

  return (
    <ProfileClient
      user={{
        name: name ?? null,
        email: email ?? null,
        image: image ?? null,
        createdAt: dbUser?.createdAt.toISOString() ?? new Date().toISOString(),
      }}
      postCount={postCount}
      commentCount={commentCount}
    />
  );
}
