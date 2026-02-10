import { getPostList } from "@/lib/api";
import { CommunitySection } from "@/components/community/community-section";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const { data } = await getPostList(20, 0, "popular");
  return <CommunitySection initialPosts={data?.items ?? []} initialTotal={data?.total ?? 0} />;
}
