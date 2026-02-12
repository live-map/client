import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import pool from "@/lib/pg";
import { getPostList, getCommentList } from "@/lib/api";
import ProfileClient from "@/components/profile/profile-client";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { id, name, email, image } = session.user;

  const [dbResult, postsResult, commentsResult] = await Promise.all([
    pool.query("SELECT created_at FROM users WHERE id = $1", [id]),
    getPostList(1, 0, undefined, id),
    getCommentList(undefined, id, 1),
  ]);

  const dbUser = dbResult.rows[0];
  const postCount = postsResult.data?.total ?? 0;
  const commentCount = commentsResult.data?.total ?? 0;

  return (
    <ProfileClient
      user={{
        name: name ?? null,
        email: email ?? null,
        image: image ?? null,
        createdAt: dbUser?.created_at
          ? new Date(dbUser.created_at).toISOString()
          : new Date().toISOString(),
      }}
      postCount={postCount}
      commentCount={commentCount}
    />
  );
}
