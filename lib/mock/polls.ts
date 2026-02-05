import type {
  HotDebateData,
  PollCardData,
  PollSortMode,
  PollWithDetails,
  UserVoteData,
} from "@/app/actions/polls/queries";
import type { PollType } from "@/components/polls/types/poll-types";

// ========== Timestamps ==========
const TWO_WEEKS = new Date(Date.now() + 14 * 86400000);
const ONE_WEEK = new Date(Date.now() + 7 * 86400000);
const THREE_DAYS = new Date(Date.now() + 3 * 86400000);
const ONE_HOUR_AGO = new Date(Date.now() - 3600000);
const TWO_HOURS_AGO = new Date(Date.now() - 7200000);
const SIX_HOURS_AGO = new Date(Date.now() - 21600000);
const ONE_DAY_AGO = new Date(Date.now() - 86400000);

// ========== v0 Mock Data - 여론조사 리스트 (홈용) ==========
export const V0_POLL_LIST = [
  {
    id: "1",
    title: "'범죄자'는 형량에 대해 가장 인기 있는 의견은 무엇일까요?",
    category: "정치",
    image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=200&h=200&fit=crop",
    totalVotes: 325000,
    endDate: "03.09",
  },
  {
    id: "2",
    title: "'딥시크' 제재 긴급의 제재를 해야할까?",
    category: "IT/기술",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200&h=200&fit=crop",
    totalVotes: 98000,
    endDate: "03.15",
  },
  {
    id: "3",
    title: "대학기관 청년체감도지수 '맞춤' 월 고취 상반된 양극화 문제",
    category: "사회",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&h=200&fit=crop",
    totalVotes: 76000,
    endDate: "03.20",
  },
  {
    id: "4",
    title: "2026년 최저임금 인상률, 어느 정도가 적절할까요?",
    category: "경제",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=200&fit=crop",
    totalVotes: 54000,
    endDate: "03.25",
  },
];

// ========== v0 Mock Data - 타입별 샘플 Hot Debate ==========
export const V0_HOT_DEBATES_BY_TYPE = {
  binary: {
    id: "1",
    pollType: "binary" as PollType,
    title: "AI 딥페이크 규제, 표현의 자유 vs 피해자 보호 어느 쪽이 우선일까요?",
    proLabel: "표현의 자유",
    conLabel: "피해자 보호",
    proPercent: 47.2,
    conPercent: 52.8,
    totalVotes: 89420,
    comments: [
      {
        id: "hc1",
        author: "법학도",
        content: "기술 발전을 막을 순 없지만 최소한의 가이드라인은 필요합니다",
        side: "con" as const,
        likes: 234,
      },
      {
        id: "hc2",
        author: "IT개발자",
        content: "과도한 규제는 기술 혁신을 저해할 수 있어요",
        side: "pro" as const,
        likes: 189,
      },
    ],
  },
  yesno: {
    id: "6",
    pollType: "yesno" as PollType,
    title: "주 4일제 전면 도입에 찬성하십니까?",
    proLabel: "찬성",
    conLabel: "반대",
    proPercent: 62.4,
    conPercent: 37.6,
    totalVotes: 234560,
    comments: [
      {
        id: "hc1",
        author: "워킹맘",
        content: "아이 돌봄 시간이 늘어나면 출산율에도 긍정적 영향이 있을 거예요",
        side: "pro" as const,
        likes: 567,
      },
      {
        id: "hc2",
        author: "중소기업대표",
        content: "취지는 좋지만 중소기업은 당장 인력 충원이 어렵습니다",
        side: "con" as const,
        likes: 234,
      },
    ],
  },
  multiple: {
    id: "2",
    pollType: "multiple" as PollType,
    title: "2026년 대선에서 가장 중요하게 다뤄져야 할 이슈는?",
    totalVotes: 156780,
    options: [
      { id: "opt1", label: "경제 성장과 일자리", percent: 32.1, color: "#3B82F6" },
      { id: "opt2", label: "부동산 및 주거 안정", percent: 24.5, color: "#EC4899" },
      { id: "opt3", label: "저출산 및 고령화 대응", percent: 18.7, color: "#10B981" },
      { id: "opt4", label: "외교 및 안보", percent: 14.2, color: "#F59E0B" },
      { id: "opt5", label: "기후변화 및 환경", percent: 10.5, color: "#8B5CF6" },
    ],
    comments: [
      {
        id: "hc1",
        author: "30대직장인",
        content: "솔직히 부동산이 가장 시급합니다",
        side: "opt2",
        likes: 523,
      },
      {
        id: "hc2",
        author: "신혼부부",
        content: "저출산 문제 해결 없이는 다른 모든 정책이 무의미합니다",
        side: "opt3",
        likes: 412,
      },
    ],
  },
  scale: {
    id: "4",
    pollType: "scale" as PollType,
    title: "현 정부의 경제 정책 만족도를 1~10점으로 평가해주세요",
    totalVotes: 78340,
    scaleAverage: 5.2,
    comments: [
      {
        id: "hc1",
        author: "자영업자",
        content: "물가는 오르고 매출은 줄고... 체감 경기는 바닥입니다",
        side: "low",
        likes: 445,
      },
      {
        id: "hc2",
        author: "회사원",
        content: "월급은 그대로인데 장바구니 물가가 너무 올랐어요",
        side: "low",
        likes: 123,
      },
    ],
  },
  ranking: {
    id: "5",
    pollType: "ranking" as PollType,
    title: "살기 좋은 도시 1~5위를 선정해주세요",
    totalVotes: 62150,
    options: [
      { id: "opt1", label: "서울", percent: 1.2, color: "#3B82F6" },
      { id: "opt5", label: "세종", percent: 2.1, color: "#8B5CF6" },
      { id: "opt3", label: "제주", percent: 2.8, color: "#10B981" },
      { id: "opt2", label: "부산", percent: 3.5, color: "#EC4899" },
      { id: "opt4", label: "대전", percent: 4.4, color: "#F59E0B" },
    ],
    comments: [
      {
        id: "hc1",
        author: "세종시민",
        content: "세종 살다가 서울 왔는데 삶의 질이 너무 떨어져요",
        side: "opt5",
        likes: 287,
      },
      {
        id: "hc2",
        author: "서울토박이",
        content: "서울은 편의시설이 압도적이에요",
        side: "opt1",
        likes: 76,
      },
    ],
  },
  checkbox: {
    id: "3",
    pollType: "checkbox" as PollType,
    title: "재택근무의 장점이라고 생각되는 것을 모두 선택해주세요",
    totalVotes: 45230,
    options: [
      { id: "opt1", label: "출퇴근 시간 절약", percent: 78.2, color: "#3B82F6" },
      { id: "opt3", label: "워라밸 개선", percent: 67.8, color: "#10B981" },
      { id: "opt5", label: "자율적 시간 관리", percent: 61.4, color: "#8B5CF6" },
      { id: "opt4", label: "비용 절감", percent: 52.3, color: "#F59E0B" },
      { id: "opt2", label: "집중력 향상", percent: 45.1, color: "#EC4899" },
    ],
    comments: [
      {
        id: "hc1",
        author: "IT개발자",
        content: "출퇴근 2시간 아끼니까 삶의 질이 완전히 달라졌어요",
        side: "opt1",
        likes: 234,
      },
      {
        id: "hc2",
        author: "마케터",
        content: "저도요! 근데 회의가 너무 많아지면 오히려 힘들긴 해요",
        side: "opt3",
        likes: 56,
      },
    ],
  },
  prediction: {
    id: "7",
    pollType: "prediction" as PollType,
    title: "2026 월드컵 결승전 승리팀을 예측해주세요",
    totalVotes: 189450,
    options: [
      { id: "opt1", label: "프랑스", percent: 28.5, color: "#3B82F6" },
      { id: "opt2", label: "브라질", percent: 22.3, color: "#10B981" },
      { id: "opt3", label: "아르헨티나", percent: 19.8, color: "#8B5CF6" },
      { id: "opt4", label: "독일", percent: 15.4, color: "#F59E0B" },
      { id: "opt5", label: "기타", percent: 14.0, color: "#6B7280" },
    ],
    comments: [
      {
        id: "hc1",
        author: "축구팬",
        content: "음바페가 이끄는 프랑스가 가장 유력합니다",
        side: "opt1",
        likes: 432,
      },
      {
        id: "hc2",
        author: "메시팬",
        content: "메시의 마지막 월드컵이 될 수도 있어요",
        side: "opt3",
        likes: 356,
      },
    ],
  },
};

// ========== v0 Mock Data - 커뮤니티 게시글 ==========
export const V0_COMMUNITY_POSTS = [
  {
    id: "p1",
    title: "이번 딥페이크 여론조사 결과 보고 진짜 놀랐네요",
    category: "자유",
    author: "민주시민",
    likes: 234,
    comments: 45,
    views: 1523,
    createdAt: "30분 전",
    isHot: true,
  },
  {
    id: "p2",
    title: "[정리] 최근 경제 관련 여론조사 결과 모음",
    category: "경제토론",
    author: "경제학도",
    likes: 189,
    comments: 32,
    views: 892,
    createdAt: "1시간 전",
    isHot: true,
  },
  {
    id: "p3",
    title: "투표 참여율 높이는 방법 토론해봐요",
    category: "자유",
    author: "투표왕",
    likes: 67,
    comments: 23,
    views: 456,
    createdAt: "2시간 전",
    isHot: false,
  },
  {
    id: "p4",
    title: "AI 분석이랑 실제 전문가 의견 차이가 재밌네요",
    category: "정치토론",
    author: "분석러",
    likes: 45,
    comments: 18,
    views: 234,
    createdAt: "3시간 전",
    isHot: false,
  },
];

// ========== v0 Mock Data - 유저 제안 목록 ==========
export const V0_USER_POLLS = [
  {
    id: "u1",
    title: "국가위기관리단 신설, 어떻게 생각하시나요?",
    category: "정치",
    author: "익명의사용자",
    likes: 1523,
    comments: 234,
    createdAt: "2시간 전",
  },
  {
    id: "u2",
    title: "공무원 정년 연장에 대한 찬반 의견이 궁금합니다",
    category: "사회",
    author: "투표마니아",
    likes: 892,
    comments: 156,
    createdAt: "5시간 전",
  },
  {
    id: "u3",
    title: "주 4일제 도입, 현실적으로 가능할까요?",
    category: "경제",
    author: "정치관심러",
    likes: 654,
    comments: 89,
    createdAt: "8시간 전",
  },
];

// ========== Poll Card Data (피드용) ==========
const MOCK_POLLS: PollCardData[] = [
  {
    id: "poll-1",
    title: "AI 딥페이크 규제, 어떻게 해야 할까?",
    description: "인공지능 딥페이크 기술의 확산에 따른 규제 방안을 논의합니다.",
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop",
    category: "기술·사회",
    type: "OFFICIAL",
    status: "ACTIVE",
    interactionType: "BINARY",
    totalVotes: 15234,
    viewCount: 42150,
    createdAt: new Date("2026-01-15"),
    endsAt: TWO_WEEKS,
    options: [
      { id: "opt-1a", text: "강력 규제 찬성", voteCount: 8234 },
      { id: "opt-1b", text: "표현의 자유 우선", voteCount: 7000 },
    ],
  },
  {
    id: "poll-2",
    title: "주4일제 전면 도입, 찬성하시나요?",
    description: "근로시간 단축과 주4일제 전면 도입에 대한 국민 의견을 수렴합니다.",
    imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop",
    category: "경제·노동",
    type: "OFFICIAL",
    status: "ACTIVE",
    interactionType: "BINARY",
    totalVotes: 28456,
    viewCount: 65200,
    createdAt: new Date("2026-01-10"),
    endsAt: ONE_WEEK,
    options: [
      { id: "opt-2a", text: "찬성", voteCount: 18120 },
      { id: "opt-2b", text: "반대", voteCount: 10336 },
    ],
  },
  {
    id: "poll-3",
    title: "2026 최고의 프로그래밍 언어는?",
    description: "개발자들이 뽑은 올해의 프로그래밍 언어를 투표로 결정합니다.",
    imageUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop",
    category: "기술",
    type: "OFFICIAL",
    status: "ACTIVE",
    interactionType: "SINGLE_CHOICE",
    totalVotes: 12450,
    viewCount: 35600,
    createdAt: new Date("2026-01-20"),
    endsAt: TWO_WEEKS,
    options: [
      { id: "opt-3a", text: "Python", voteCount: 4200 },
      { id: "opt-3b", text: "TypeScript", voteCount: 3800 },
      { id: "opt-3c", text: "Rust", voteCount: 2500 },
      { id: "opt-3d", text: "Go", voteCount: 1950 },
    ],
  },
  {
    id: "poll-4",
    title: "원격근무 vs 사무실 출근",
    description: "포스트 코로나 시대, 어떤 근무 형태가 더 바람직할까요?",
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
    category: "경제·노동",
    type: "OFFICIAL",
    status: "ACTIVE",
    interactionType: "BINARY",
    totalVotes: 18900,
    viewCount: 51230,
    createdAt: new Date("2026-01-12"),
    endsAt: ONE_WEEK,
    options: [
      { id: "opt-4a", text: "원격근무", voteCount: 11200 },
      { id: "opt-4b", text: "사무실 출근", voteCount: 7700 },
    ],
  },
  {
    id: "poll-5",
    title: "대중교통 완전 무료화, 가능할까?",
    description: "대중교통 무료화가 교통 문제와 환경에 미칠 영향을 논의합니다.",
    imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop",
    category: "정치·사회",
    type: "OFFICIAL",
    status: "ACTIVE",
    interactionType: "BINARY",
    totalVotes: 22100,
    viewCount: 58700,
    createdAt: new Date("2026-01-08"),
    endsAt: THREE_DAYS,
    options: [
      { id: "opt-5a", text: "가능하다", voteCount: 9800 },
      { id: "opt-5b", text: "불가능하다", voteCount: 12300 },
    ],
  },
  {
    id: "poll-6",
    title: "한국 교육 제도, 무엇이 가장 시급한가?",
    description: "교육 제도 개혁의 우선순위를 국민 투표로 정합니다.",
    imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop",
    category: "교육",
    type: "OFFICIAL",
    status: "ACTIVE",
    interactionType: "SINGLE_CHOICE",
    totalVotes: 9870,
    viewCount: 28400,
    createdAt: new Date("2026-01-22"),
    endsAt: TWO_WEEKS,
    options: [
      { id: "opt-6a", text: "입시제도 개혁", voteCount: 3950 },
      { id: "opt-6b", text: "교사 처우 개선", voteCount: 2800 },
      { id: "opt-6c", text: "디지털 교육 확대", voteCount: 1920 },
      { id: "opt-6d", text: "사교육 규제", voteCount: 1200 },
    ],
  },
  // ===== SUGGESTED =====
  {
    id: "poll-7",
    title: "반려동물 동반 출근, 어떻게 생각하시나요?",
    description: "반려동물과 함께 출근하는 문화가 확산되고 있습니다.",
    imageUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop",
    category: "사회·문화",
    type: "SUGGESTED",
    status: "ACTIVE",
    interactionType: "BINARY",
    totalVotes: 5600,
    viewCount: 15200,
    createdAt: new Date("2026-01-25"),
    endsAt: TWO_WEEKS,
    options: [
      { id: "opt-7a", text: "좋은 제도다", voteCount: 3400 },
      { id: "opt-7b", text: "현실적으로 어렵다", voteCount: 2200 },
    ],
    user: { name: "김민수" },
  },
  {
    id: "poll-8",
    title: "AI가 의사를 대체할 수 있을까?",
    description: "AI 의료 기술의 발전과 의사 직업의 미래에 대해 논의합니다.",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop",
    category: "기술·의료",
    type: "SUGGESTED",
    status: "ACTIVE",
    interactionType: "BINARY",
    totalVotes: 8200,
    viewCount: 23100,
    createdAt: new Date("2026-01-28"),
    endsAt: ONE_WEEK,
    options: [
      { id: "opt-8a", text: "가능하다", voteCount: 3100 },
      { id: "opt-8b", text: "불가능하다", voteCount: 5100 },
    ],
    user: { name: "이지영" },
  },
  {
    id: "poll-9",
    title: "최저임금 인상 방향은?",
    description: "2027년 최저임금 인상 폭에 대한 의견을 나눕니다.",
    imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop",
    category: "경제",
    type: "SUGGESTED",
    status: "ACTIVE",
    interactionType: "SINGLE_CHOICE",
    totalVotes: 6500,
    viewCount: 18300,
    createdAt: new Date("2026-01-30"),
    endsAt: TWO_WEEKS,
    options: [
      { id: "opt-9a", text: "대폭 인상", voteCount: 2100 },
      { id: "opt-9b", text: "소폭 인상", voteCount: 2400 },
      { id: "opt-9c", text: "동결", voteCount: 1200 },
      { id: "opt-9d", text: "차등 적용", voteCount: 800 },
    ],
    user: { name: "박준호" },
  },
];

// ========== Hot Debate ==========
const MOCK_HOT_DEBATE: HotDebateData = {
  id: "poll-1",
  title: "AI 딥페이크 규제, 어떻게 해야 할까?",
  proLabel: "강력 규제 찬성",
  conLabel: "표현의 자유 우선",
  proPercent: 54.1,
  conPercent: 45.9,
  totalVotes: 15234,
  comments: [
    {
      id: "hc-1",
      author: "법학도김",
      content: "딥페이크로 인한 명예훼손 피해가 급증하고 있습니다. 강력한 규제가 시급합니다.",
      side: "pro",
      likes: 234,
    },
    {
      id: "hc-2",
      author: "개발자이",
      content: "기술 자체를 규제하면 AI 산업 전체가 위축됩니다. 악용만 처벌해야 합니다.",
      side: "con",
      likes: 189,
    },
    {
      id: "hc-3",
      author: "시민박",
      content: "선거철 딥페이크 영상이 진짜처럼 퍼지는 걸 보면 규제가 필요하다고 느낍니다.",
      side: "pro",
      likes: 156,
    },
    {
      id: "hc-4",
      author: "예술가최",
      content: "AI 아트도 딥페이크 기술 기반입니다. 창작의 자유를 침해하면 안됩니다.",
      side: "con",
      likes: 142,
    },
  ],
};

// ========== AI Article Content (Markdown) ==========
const AI_ARTICLE_CONTENT = `## 핵심 쟁점

AI 딥페이크 기술이 급속히 발전하면서, **가짜 영상과 음성 합성**이 사회적 문제로 대두되고 있습니다.

### 규제 찬성 측 주장

- **선거 조작 위험**: 정치인의 딥페이크 영상으로 여론 조작 가능성
- **개인 명예 훼손**: 동의 없는 합성 영상으로 피해 급증
- **사기 범죄 활용**: 음성 합성을 이용한 보이스피싱 증가

[^한국인터넷진흥원|https://www.kisa.or.kr]

### 규제 반대 측 주장

- **표현의 자유 침해**: 과도한 규제는 예술·창작 활동 위축
- **기술 발전 저해**: 규제가 AI 산업 경쟁력을 약화시킬 수 있음
- **실효성 문제**: 기술 발전 속도를 규제가 따라가기 어려움

---

## 해외 사례

> 유럽연합은 2024년 AI Act를 통해 딥페이크 콘텐츠에 라벨링을 의무화했으며, 미국은 주별로 상이한 규제 체계를 운영 중입니다.

### 주요 국가별 현황

- **EU**: AI Act으로 고위험 AI 규제, 딥페이크 라벨링 의무화
- **미국**: 연방법 없이 주별 규제, 캘리포니아·텍사스 선제 입법
- **중국**: 딥페이크 생성 시 실명인증 및 워터마크 의무

[^Reuters|https://www.reuters.com]

## 국내 현황

현재 한국은 **공직선거법**에서 선거 기간 딥페이크 영상 유포를 금지하고 있으나, 일반적인 딥페이크에 대한 포괄적 규제는 미비한 상황입니다.

- 2025년 **AI 기본법** 제정으로 기초 프레임워크 마련
- 방송통신위원회의 자율규제 가이드라인 발표
- 형법 개정을 통한 딥페이크 처벌 강화 논의 진행 중`;

// ========== Poll Detail Data ==========
const MOCK_POLL_DETAILS: Record<string, unknown> = {
  "poll-1": {
    id: "poll-1",
    title: "AI 딥페이크 규제, 어떻게 해야 할까?",
    description: "인공지능 딥페이크 기술의 확산에 따른 규제 방안을 논의합니다.",
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop",
    category: "기술·사회",
    aiContent: AI_ARTICLE_CONTENT,
    aiUpdatedAt: ONE_HOUR_AGO,
    type: "OFFICIAL",
    status: "ACTIVE",
    interactionType: "BINARY",
    totalVotes: 15234,
    viewCount: 42150,
    startsAt: null,
    endsAt: TWO_WEEKS,
    userId: "user-admin",
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-02-01"),
    user: { id: "user-admin", name: "그라폴 운영팀", image: null },
    options: [
      { id: "opt-1a", text: "강력 규제 찬성", order: 0, voteCount: 8234, pollId: "poll-1" },
      { id: "opt-1b", text: "표현의 자유 우선", order: 1, voteCount: 7000, pollId: "poll-1" },
    ],
    sources: [
      {
        id: "src-1",
        title: "AI 딥페이크 규제 동향 보고서",
        url: "https://www.kisa.or.kr",
        sourceType: "ARTICLE",
        description: "한국인터넷진흥원 발간",
        pollId: "poll-1",
        createdAt: new Date("2026-01-15"),
      },
    ],
    comments: [
      {
        id: "c-1",
        content: "딥페이크로 인한 명예훼손 피해가 급증하고 있습니다. 강력한 규제가 시급합니다.",
        likes: 234,
        userId: "user-1",
        pollId: "poll-1",
        parentId: null,
        optionId: "opt-1a",
        createdAt: TWO_HOURS_AGO,
        updatedAt: TWO_HOURS_AGO,
        user: { id: "user-1", name: "법학도김", image: null },
        option: { id: "opt-1a", text: "강력 규제 찬성" },
        replies: [
          {
            id: "c-1r",
            content: "동의합니다. 특히 선거 기간에는 더 엄격해야 해요.",
            likes: 45,
            userId: "user-3",
            pollId: "poll-1",
            parentId: "c-1",
            optionId: "opt-1a",
            createdAt: ONE_HOUR_AGO,
            updatedAt: ONE_HOUR_AGO,
            user: { id: "user-3", name: "시민박", image: null },
            option: { id: "opt-1a", text: "강력 규제 찬성" },
          },
        ],
      },
      {
        id: "c-2",
        content: "기술 자체를 규제하면 AI 산업 전체가 위축됩니다. 악용만 처벌해야 합니다.",
        likes: 189,
        userId: "user-2",
        pollId: "poll-1",
        parentId: null,
        optionId: "opt-1b",
        createdAt: SIX_HOURS_AGO,
        updatedAt: SIX_HOURS_AGO,
        user: { id: "user-2", name: "개발자이", image: null },
        option: { id: "opt-1b", text: "표현의 자유 우선" },
        replies: [],
      },
      {
        id: "c-3",
        content: "EU의 AI Act처럼 라벨링 의무화부터 시작하는 게 현실적이지 않을까요?",
        likes: 156,
        userId: "user-4",
        pollId: "poll-1",
        parentId: null,
        optionId: "opt-1a",
        createdAt: ONE_DAY_AGO,
        updatedAt: ONE_DAY_AGO,
        user: { id: "user-4", name: "정책연구원", image: null },
        option: { id: "opt-1a", text: "강력 규제 찬성" },
        replies: [
          {
            id: "c-3r",
            content: "라벨링은 좋은 출발점이지만 워터마크는 쉽게 제거할 수 있어서 한계가 있습니다.",
            likes: 32,
            userId: "user-2",
            pollId: "poll-1",
            parentId: "c-3",
            optionId: "opt-1b",
            createdAt: SIX_HOURS_AGO,
            updatedAt: SIX_HOURS_AGO,
            user: { id: "user-2", name: "개발자이", image: null },
            option: { id: "opt-1b", text: "표현의 자유 우선" },
          },
        ],
      },
    ],
  },
};

// 나머지 poll들은 간략한 디테일 생성
for (const poll of MOCK_POLLS) {
  if (MOCK_POLL_DETAILS[poll.id]) continue;
  MOCK_POLL_DETAILS[poll.id] = {
    id: poll.id,
    title: poll.title,
    description: poll.description,
    imageUrl: poll.imageUrl,
    category: poll.category,
    aiContent: null,
    aiUpdatedAt: null,
    type: poll.type,
    status: poll.status,
    interactionType: poll.interactionType,
    totalVotes: poll.totalVotes,
    viewCount: poll.viewCount,
    startsAt: null,
    endsAt: poll.endsAt,
    userId: "user-admin",
    createdAt: poll.createdAt,
    updatedAt: poll.createdAt,
    user: { id: "user-admin", name: poll.user?.name ?? "그라폴 운영팀", image: null },
    options: poll.options.map((opt, i) => ({
      ...opt,
      order: i,
      pollId: poll.id,
    })),
    sources: [],
    comments: [],
  };
}

// ========== Query-like Functions ==========

export async function getHotDebate(): Promise<HotDebateData | null> {
  return MOCK_HOT_DEBATE;
}

export async function getPollFeed(
  sort: PollSortMode = "popular",
  search?: string,
  limit = 20,
  offset = 0
): Promise<PollCardData[]> {
  let filtered = [...MOCK_POLLS];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) => p.title.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q)
    );
  }

  switch (sort) {
    case "recent":
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case "ending_soon":
      filtered = filtered.filter((p) => p.endsAt && new Date(p.endsAt).getTime() > Date.now());
      filtered.sort((a, b) => new Date(a.endsAt!).getTime() - new Date(b.endsAt!).getTime());
      break;
    case "popular":
    default:
      filtered.sort((a, b) => b.totalVotes - a.totalVotes);
      break;
  }

  return filtered.slice(offset, offset + limit);
}

export async function getSuggestedPolls(limit = 10): Promise<PollCardData[]> {
  return MOCK_POLLS.filter((p) => p.type === "SUGGESTED")
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, limit);
}

export async function getPollById(id: string): Promise<PollWithDetails | null> {
  const detail = MOCK_POLL_DETAILS[id];
  return (detail as PollWithDetails) ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getUserVote(_pollId: string): Promise<UserVoteData | null> {
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function incrementViewCount(_pollId: string): Promise<void> {
  // no-op for mock
}
