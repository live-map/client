import { CommunitySection } from "@/components/community/community-section";
import { V0_COMMUNITY_POSTS } from "@/lib/mock/polls";

export const dynamic = "force-dynamic";

export default function CommunityPage() {
  return <CommunitySection posts={V0_COMMUNITY_POSTS} />;
}
