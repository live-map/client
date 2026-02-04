import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // 1. 유저 생성
  const admin = await prisma.user.upsert({
    where: { email: "admin@grapoll.kr" },
    update: {},
    create: {
      email: "admin@grapoll.kr",
      name: "Grapoll 관리자",
      role: "ADMIN",
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: "user1@grapoll.kr" },
    update: {},
    create: {
      email: "user1@grapoll.kr",
      name: "정치탐구생",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "user2@grapoll.kr" },
    update: {},
    create: {
      email: "user2@grapoll.kr",
      name: "여론워치",
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: "user3@grapoll.kr" },
    update: {},
    create: {
      email: "user3@grapoll.kr",
      name: "시민의소리",
    },
  });

  // 2. 공식 하이라이트: 2025 대선 후보 지지율 조사 (SINGLE_CHOICE)
  const highlight = await prisma.poll.create({
    data: {
      title: "2025 대선 후보 지지율 조사",
      description:
        "2025년 대한민국 대통령 선거 주요 후보들의 지지율을 조사합니다. 여러분의 한 표가 중요합니다.",
      type: "OFFICIAL",
      status: "ACTIVE",
      interactionType: "SINGLE_CHOICE",
      totalVotes: 325000,
      viewCount: 1200000,
      userId: admin.id,
      startsAt: new Date("2025-05-01"),
      endsAt: new Date("2025-06-03"),
      options: {
        create: [
          { text: "이재명", order: 0, voteCount: 130000 },
          { text: "김문수", order: 1, voteCount: 97500 },
          { text: "이준석", order: 2, voteCount: 58500 },
          { text: "권영세", order: 3, voteCount: 39000 },
        ],
      },
      sources: {
        create: [
          {
            title: "한국갤럽 대선 후보 지지율 조사 결과",
            url: "https://www.gallup.co.kr",
            sourceType: "NEWS",
            description: "한국갤럽이 실시한 대선 후보 지지율 여론조사 결과입니다.",
          },
          {
            title: "리얼미터 대선 주자 선호도 조사",
            url: "https://www.realmeter.net",
            sourceType: "NEWS",
            description: "리얼미터의 대선 주자 선호도 정기 조사 결과입니다.",
          },
          {
            title: "중앙선거관리위원회 - 선거 정보",
            url: "https://www.nec.go.kr",
            sourceType: "OTHER",
            description: "중앙선거관리위원회 공식 선거 정보 페이지입니다.",
          },
        ],
      },
    },
  });

  // 3. 공식 트렌딩 여론조사 - SINGLE_CHOICE
  await prisma.poll.create({
    data: {
      title: "의료개혁 방향에 대한 국민 의견",
      description: "의료 시스템 개혁의 방향성에 대한 국민 여론을 조사합니다.",
      type: "OFFICIAL",
      status: "ACTIVE",
      interactionType: "SINGLE_CHOICE",
      totalVotes: 125000,
      viewCount: 450000,
      userId: admin.id,
      options: {
        create: [
          { text: "공공의료 확대", order: 0, voteCount: 56250 },
          { text: "민간의료 활성화", order: 1, voteCount: 37500 },
          { text: "현행 유지", order: 2, voteCount: 18750 },
          { text: "기타", order: 3, voteCount: 12500 },
        ],
      },
    },
  });

  // 4. BINARY - 양자택일
  await prisma.poll.create({
    data: {
      title: "원전 확대 vs 탈원전, 당신의 선택은?",
      description: "에너지 정책의 핵심 쟁점에 대한 양자택일 투표입니다.",
      type: "OFFICIAL",
      status: "ACTIVE",
      interactionType: "BINARY",
      totalVotes: 98000,
      viewCount: 380000,
      userId: admin.id,
      options: {
        create: [
          { text: "원전 확대", order: 0, voteCount: 54880 },
          { text: "탈원전 지속", order: 1, voteCount: 43120 },
        ],
      },
    },
  });

  // 5. EMOJI_REACTION - 이모지 반응
  await prisma.poll.create({
    data: {
      title: "AI 시대, 당신의 기분은?",
      description: "인공지능이 일상에 들어오는 것에 대한 감정을 이모지로 표현해주세요.",
      type: "OFFICIAL",
      status: "ACTIVE",
      interactionType: "EMOJI_REACTION",
      totalVotes: 76000,
      viewCount: 290000,
      userId: admin.id,
      options: {
        create: [
          { text: "🤩 기대돼요", order: 0, voteCount: 28880 },
          { text: "🤔 복잡해요", order: 1, voteCount: 19760 },
          { text: "😰 불안해요", order: 2, voteCount: 15200 },
          { text: "😎 준비됐어요", order: 3, voteCount: 8360 },
          { text: "😤 반대해요", order: 4, voteCount: 3800 },
        ],
      },
    },
  });

  // 6. SLIDER - 스펙트럼 슬라이더
  await prisma.poll.create({
    data: {
      title: "주 4일제 도입 시기는 언제가 적절할까?",
      description:
        "주 4일 근무제 도입 시기에 대한 의견을 스펙트럼으로 표현해주세요. 0은 '지금 당장', 100은 '아직 이르다'를 의미합니다.",
      type: "OFFICIAL",
      status: "ACTIVE",
      interactionType: "SLIDER",
      totalVotes: 52000,
      viewCount: 210000,
      userId: admin.id,
      options: {
        create: [
          { text: "지금 당장", order: 0, voteCount: 0 },
          { text: "아직 이르다", order: 1, voteCount: 0 },
        ],
      },
    },
  });

  // 7. MULTIPLE_CHOICE - 복수 선택
  await prisma.poll.create({
    data: {
      title: "가장 시급한 사회 이슈는? (복수 선택)",
      description: "현재 대한민국에서 가장 시급하게 해결해야 할 이슈를 모두 선택해주세요.",
      type: "OFFICIAL",
      status: "ACTIVE",
      interactionType: "MULTIPLE_CHOICE",
      totalVotes: 67000,
      viewCount: 330000,
      userId: admin.id,
      options: {
        create: [
          { text: "저출생·고령화", order: 0, voteCount: 45560 },
          { text: "주거 문제", order: 1, voteCount: 40200 },
          { text: "양극화·불평등", order: 2, voteCount: 36180 },
          { text: "기후 변화", order: 3, voteCount: 22110 },
          { text: "교육 개혁", order: 4, voteCount: 18760 },
          { text: "국방·안보", order: 5, voteCount: 14070 },
        ],
      },
    },
  });

  // 8. RANKING - 순위 매기기
  await prisma.poll.create({
    data: {
      title: "차기 정부 최우선 과제 순위를 매겨주세요",
      description: "드래그하여 차기 정부가 가장 먼저 해결해야 할 과제의 순위를 매겨주세요.",
      type: "OFFICIAL",
      status: "ACTIVE",
      interactionType: "RANKING",
      totalVotes: 41000,
      viewCount: 185000,
      userId: admin.id,
      options: {
        create: [
          { text: "경제 성장", order: 0, voteCount: 15580 },
          { text: "복지 확대", order: 1, voteCount: 10250 },
          { text: "외교·통일", order: 2, voteCount: 7380 },
          { text: "과학기술 투자", order: 3, voteCount: 4920 },
          { text: "문화·체육", order: 4, voteCount: 2870 },
        ],
      },
    },
  });

  // 9. 유저 제안 여론조사 3개 (SINGLE_CHOICE)
  await prisma.poll.create({
    data: {
      title: "다음 지방선거에서 가장 중요한 이슈는?",
      description: "다가오는 지방선거에서 유권자들이 가장 중요하게 생각하는 이슈를 조사합니다.",
      type: "SUGGESTED",
      status: "ACTIVE",
      interactionType: "SINGLE_CHOICE",
      totalVotes: 3200,
      viewCount: 15000,
      userId: user1.id,
      options: {
        create: [
          { text: "지역 경제 활성화", order: 0, voteCount: 1280 },
          { text: "교통 인프라", order: 1, voteCount: 960 },
          { text: "교육 환경", order: 2, voteCount: 640 },
          { text: "환경/녹지", order: 3, voteCount: 320 },
        ],
      },
    },
  });

  await prisma.poll.create({
    data: {
      title: "초중고 급식 완전 무상화에 대한 의견",
      description: "전국 초중고등학교 급식 완전 무상화 정책에 대한 의견을 조사합니다.",
      type: "SUGGESTED",
      status: "ACTIVE",
      interactionType: "SINGLE_CHOICE",
      totalVotes: 1800,
      viewCount: 8900,
      userId: user2.id,
      options: {
        create: [
          { text: "전면 찬성", order: 0, voteCount: 900 },
          { text: "소득 기준 차등", order: 1, voteCount: 540 },
          { text: "반대", order: 2, voteCount: 360 },
        ],
      },
    },
  });

  await prisma.poll.create({
    data: {
      title: "대중교통 요금 인상에 대한 의견",
      description: "최근 논의되고 있는 대중교통 요금 인상에 대한 시민 의견을 조사합니다.",
      type: "SUGGESTED",
      status: "ACTIVE",
      interactionType: "SINGLE_CHOICE",
      totalVotes: 1200,
      viewCount: 6200,
      userId: user3.id,
      options: {
        create: [
          { text: "인상 반대", order: 0, voteCount: 600 },
          { text: "소폭 인상 수용", order: 1, voteCount: 360 },
          { text: "서비스 개선 시 수용", order: 2, voteCount: 240 },
        ],
      },
    },
  });

  console.log("✅ Seed completed!");
  console.log(`  - Highlight: ${highlight.title} (SINGLE_CHOICE)`);
  console.log("  - 1 SINGLE_CHOICE trending");
  console.log("  - 1 BINARY trending");
  console.log("  - 1 EMOJI_REACTION trending");
  console.log("  - 1 SLIDER trending");
  console.log("  - 1 MULTIPLE_CHOICE trending");
  console.log("  - 1 RANKING trending");
  console.log("  - 3 suggested polls (SINGLE_CHOICE)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
