/**
 * 후보 메타데이터 맵
 *
 * 스키마 변경 없이 프레젠테이션 레이어에서 정당명과 색상을 매핑합니다.
 * 매칭되지 않는 옵션은 기존 OPTION_COLORS fallback을 사용합니다.
 */
export const CANDIDATE_MAP: Record<string, { party: string; color: string }> = {
  이재명: { party: "더불어민주당", color: "#1B64DA" },
  김문수: { party: "국민의힘", color: "#E61E2B" },
  이준석: { party: "개혁신당", color: "#FF6B00" },
  권영세: { party: "국민의힘", color: "#E61E2B" },
};
