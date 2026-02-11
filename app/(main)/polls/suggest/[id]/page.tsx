import { redirect } from "next/navigation";

/**
 * 제안 상세 → 여론조사 상세 페이지로 리다이렉트.
 * 제안(SUGGESTED)도 polls 테이블의 일부이므로 동일한 상세 페이지를 사용합니다.
 */
export default async function SuggestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/polls/${id}`);
}
