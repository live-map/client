// [COMMENTED OUT] 여론조사 기능 비활성화 - PollDetailClient 컴포넌트
// "use client";
//
// import React from "react";
// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import Image from "next/image";
// import { ArrowLeft, Users, Clock, ExternalLink, ThumbsUp, Share2 } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import type { PollType } from "@/components/polls/types/poll-types";
// import { ScalePoll, FloatingVoteBar } from "@/components/polls/types/poll-types";
//
// // 인라인 출처 컴포넌트
// function InlineSource({ name, url }: { name: string; url: string }) {
//   return (
//     <a
//       href={url}
//       target="_blank"
//       rel="noopener noreferrer"
//       className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-muted/70 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors ml-1"
//     >
//       <span>{name}</span>
//       <ExternalLink className="w-2.5 h-2.5" />
//     </a>
//   );
// }
//
// // 마크다운 렌더러
// function MarkdownRenderer({ content }: { content: string }) {
//   const parseMarkdown = (text: string) => {
//     const lines = text.split("\n");
//     const elements: React.ReactNode[] = [];
//     let currentIndex = 0;
//
//     for (let i = 0; i < lines.length; i++) {
//       const line = lines[i];
//
//       // 빈 줄은 무시
//       if (line.trim() === "") {
//         continue;
//       }
//
//       // 인라인 출처만 있는 줄 [^출처명|URL]
//       if (line.trim().match(/^\[\^[^\]]+\|[^\]]+\]$/)) {
//         const sourceMatch = line.trim().match(/\[\^([^\|]+)\|([^\]]+)\]/);
//         if (sourceMatch) {
//           elements.push(
//             <div key={currentIndex++} className="mb-3 -mt-1">
//               <InlineSource name={sourceMatch[1]} url={sourceMatch[2]} />
//             </div>
//           );
//           continue;
//         }
//       }
//
//       // 구분선
//       if (line.trim() === "---") {
//         elements.push(<hr key={currentIndex++} className="my-4 border-border" />);
//         continue;
//       }
//
//       // H2 헤딩
//       if (line.startsWith("## ")) {
//         elements.push(
//           <h2
//             key={currentIndex++}
//             className="text-base font-bold text-foreground mt-4 mb-2 leading-tight"
//           >
//             {line.replace("## ", "")}
//           </h2>
//         );
//         continue;
//       }
//
//       // H3 헤딩
//       if (line.startsWith("### ")) {
//         elements.push(
//           <h3 key={currentIndex++} className="text-sm font-semibold text-foreground mt-3 mb-1.5">
//             {line.replace("### ", "")}
//           </h3>
//         );
//         continue;
//       }
//
//       // 이미지
//       if (line.startsWith("![")) {
//         const match = line.match(/!\[(.*?)\]\((.*?)\)/);
//         if (match) {
//           elements.push(
//             <figure key={currentIndex++} className="my-3">
//               <div className="relative w-full h-32 rounded-lg overflow-hidden">
//                 <Image
//                   src={match[2] || "/placeholder.svg"}
//                   alt={match[1]}
//                   fill
//                   className="object-cover"
//                 />
//               </div>
//             </figure>
//           );
//           continue;
//         }
//       }
//
//       // 블록쿼트
//       if (line.startsWith("> ")) {
//         const quoteLines = [line.replace("> ", "")];
//         while (i + 1 < lines.length && lines[i + 1].startsWith("> ")) {
//           i++;
//           quoteLines.push(lines[i].replace("> ", ""));
//         }
//         elements.push(
//           <blockquote
//             key={currentIndex++}
//             className="my-3 pl-3 border-l-2 border-muted-foreground/30 py-1.5"
//           >
//             <p className="text-sm text-muted-foreground leading-normal">{quoteLines.join(" ")}</p>
//           </blockquote>
//         );
//         continue;
//       }
//
//       // 리스트 아이템
//       if (line.startsWith("- ")) {
//         const listItems = [line.replace("- ", "")];
//         while (i + 1 < lines.length && lines[i + 1].startsWith("- ")) {
//           i++;
//           listItems.push(lines[i].replace("- ", ""));
//         }
//         elements.push(
//           <ul key={currentIndex++} className="my-2 space-y-1">
//             {listItems.map((item, idx) => (
//               <li
//                 key={idx}
//                 className="flex items-start gap-2 text-sm text-foreground/90 leading-normal"
//               >
//                 <span className="w-1 h-1 rounded-full bg-muted-foreground mt-1.5 flex-shrink-0" />
//                 <span dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
//               </li>
//             ))}
//           </ul>
//         );
//         continue;
//       }
//
//       // 일반 텍스트 (단락)
//       elements.push(
//         <p key={currentIndex++} className="text-sm text-foreground/90 leading-normal mb-2">
//           <span dangerouslySetInnerHTML={{ __html: parseInline(line) }} />
//         </p>
//       );
//     }
//
//     return elements;
//   };
//
//   // 인라인 마크다운 파싱 (볼드, 링크 등)
//   const parseInline = (text: string) => {
//     return (
//       text
//         // 볼드
//         .replace(/\*\*(.*?)\*\*/g, '<strong class="font-medium text-foreground">$1</strong>')
//         // 링크
//         .replace(
//           /\[(.*?)\]\((.*?)\)/g,
//           '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>'
//         )
//     );
//   };
//
//   return <article className="prose-custom">{parseMarkdown(content)}</article>;
// }
//
// // 다양한 타입의 여론조사 샘플 데이터
// const pollSamples: Record<
//   string,
//   {
//     id: string;
//     pollType: PollType;
//     title: string;
//     description: string;
//     image: string;
//     category: string;
//     totalVotes: number;
//     endDate: string;
//     options: { id: string; label: string; percent: number; color: string }[];
//     scaleConfig?: {
//       min?: number;
//       max?: number;
//       labels?: { min: string; max: string };
//       results?: { average: number; distribution: number[] };
//     };
//     aiArticle?: {
//       lastUpdated: string;
//       content: string;
//     };
//     comments: {
//       id: string;
//       author: string;
//       content: string;
//       likes: number;
//       createdAt: string;
//       vote: string;
//       replies: {
//         id: string;
//         author: string;
//         content: string;
//         likes: number;
//         createdAt: string;
//         vote: string;
//       }[];
//     }[];
//   }
// > = {
//   // 1. 기본 양자택일 (binary)
//   "1": {
//     id: "1",
//     pollType: "binary",
//     title: "AI 딥페이크 규제, 표현의 자유 vs 피해자 보호 어느 쪽이 우선일까요?",
//     description:
//       "최근 AI 기술의 발전으로 딥페이크 영상이 급증하면서, 규제의 필요성과 표현의 자유 사이의 논쟁이 뜨거워지고 있습니다.",
//     image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop",
//     category: "IT/기술",
//     totalVotes: 89420,
//     endDate: "2026.03.15",
//     options: [
//       { id: "opt1", label: "표현의 자유 우선", percent: 47.2, color: "#3B82F6" },
//       { id: "opt2", label: "피해자 보호 우선", percent: 52.8, color: "#EC4899" },
//     ],
//     aiArticle: {
//       lastUpdated: "2시간 전",
//       content: `## 딥페이크 피해 현황
//
// 2025년 방송통신위원회에 접수된 딥페이크 관련 피해 신고 건수는 전년 대비 **340% 증가**했다. 피해자 성별 비율은 여성 **78%**, 남성 **22%**로 집계됐다.
// [^방송통신위원회|https://kcc.go.kr]
//
// ---
//
// ## 현행 법률
//
// 현행 '성폭력처벌법' 제14조의2에 따르면, 성적 목적의 딥페이크 제작 및 배포는 **5년 이하의 징역** 또는 **5천만원 이하의 벌금**에 처해진다.
// [^국가법령정보센터|https://law.go.kr]
//
// ---
//
// ## 규제 강화 측 주요 논거
//
// - 개인의 초상권 및 인격권 침해 우려
// - 금융 사기, 보이스피싱 등 범죄 수단으로 활용 가능성
// - 선거 기간 중 허위 정보 유포 가능성
// [^한국인터넷자율정책기구|https://kiso.or.kr]
//
// ---
//
// ## 규제 완화 측 주요 논거
//
// - AI 기술 연구 및 산업 발전에 제약 가능성
// - 풍자, 패러디 등 합법적 표현 활동 위축 우려
// - 기술 자체보다 악용 행위에 대한 규제가 적절함
// [^한국AI학회|https://aikorea.org]`,
//     },
//     comments: [
//       {
//         id: "c1",
//         author: "법학도",
//         content: "기술 발전을 막을 순 없지만 최소한의 가이드라인은 필요합니다.",
//         likes: 234,
//         createdAt: "2시간 전",
//         vote: "opt2",
//         replies: [
//           {
//             id: "r1",
//             author: "IT개발자",
//             content: "EU 방식이 좋긴 한데, 한국 실정에 맞게 조정이 필요할 것 같아요.",
//             likes: 45,
//             createdAt: "1시간 전",
//             vote: "opt1",
//           },
//         ],
//       },
//       {
//         id: "c2",
//         author: "피해자연대",
//         content: "실제 피해를 겪어보지 않으면 그 고통을 모릅니다. 피해자 보호가 우선입니다.",
//         likes: 312,
//         createdAt: "4시간 전",
//         vote: "opt2",
//         replies: [],
//       },
//     ],
//   },
//
//   // 2. 다지선다 (multiple)
//   "2": {
//     id: "2",
//     pollType: "multiple",
//     title: "2026년 대선에서 가장 중요하게 다뤄져야 할 이슈는?",
//     description: "다가오는 대통령 선거에서 가장 핵심적으로 논의되어야 할 사안을 선택해주세요.",
//     image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=400&fit=crop",
//     category: "정치",
//     totalVotes: 156780,
//     endDate: "2026.04.01",
//     options: [
//       { id: "opt1", label: "경제 성장과 일자리", percent: 32.1, color: "#3B82F6" },
//       { id: "opt2", label: "부동산 및 주거 안정", percent: 24.5, color: "#EC4899" },
//       { id: "opt3", label: "저출산 및 고령화 대응", percent: 18.7, color: "#10B981" },
//       { id: "opt4", label: "외교 및 안보", percent: 14.2, color: "#F59E0B" },
//       { id: "opt5", label: "기후변화 및 환경", percent: 10.5, color: "#8B5CF6" },
//     ],
//     comments: [
//       {
//         id: "c1",
//         author: "30대직장인",
//         content: "솔직히 부동산이 가장 시급합니다. 결혼도 출산도 집이 있어야 가능하잖아요.",
//         likes: 523,
//         createdAt: "1시간 전",
//         vote: "opt2",
//         replies: [],
//       },
//     ],
//   },
//
//   // 4. 척도 (scale)
//   "4": {
//     id: "4",
//     pollType: "scale",
//     title: "현 정부의 경제 정책 만족도를 1~10점으로 평가해주세요",
//     description: "지난 1년간의 경제 정책 전반에 대한 국민 만족도를 조사합니다.",
//     image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop",
//     category: "경제",
//     totalVotes: 78340,
//     endDate: "2026.03.25",
//     options: [],
//     scaleConfig: {
//       min: 1,
//       max: 10,
//       labels: { min: "매우 불만족", max: "매우 만족" },
//       results: { average: 5.2, distribution: [8, 12, 15, 18, 22, 20, 16, 10, 6, 3] },
//     },
//     comments: [
//       {
//         id: "c1",
//         author: "자영업자",
//         content: "물가는 오르고 매출은 줄고... 체감 경기는 바닥입니다. 3점 줬어요.",
//         likes: 445,
//         createdAt: "30분 전",
//         vote: "3",
//         replies: [],
//       },
//     ],
//   },
//
//   // 6. 찬반 (yesno)
//   "6": {
//     id: "6",
//     pollType: "yesno",
//     title: "주 4일제 전면 도입에 찬성하십니까?",
//     description: "근로시간 단축과 주 4일제 도입에 대한 국민 여론을 조사합니다.",
//     image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&h=400&fit=crop",
//     category: "사회",
//     totalVotes: 234560,
//     endDate: "2026.04.10",
//     options: [
//       { id: "yes", label: "찬성", percent: 62.4, color: "#10B981" },
//       { id: "no", label: "반대", percent: 37.6, color: "#EF4444" },
//     ],
//     comments: [
//       {
//         id: "c1",
//         author: "워킹맘",
//         content: "아이 돌봄 시간이 늘어나면 출산율에도 긍정적 영향이 있을 거예요. 강력 찬성입니다.",
//         likes: 567,
//         createdAt: "1시간 전",
//         vote: "yes",
//         replies: [],
//       },
//     ],
//   },
// };
//
// // 기본 폴백 데이터
// const defaultPollData = pollSamples["1"];
//
// interface PollDetailClientProps {
//   pollId: string;
// }
//
// export function PollDetailClient({ pollId }: PollDetailClientProps) {
//   const router = useRouter();
//   const [hasVoted, setHasVoted] = useState(false);
//   const [selectedValue, setSelectedValue] = useState<string | string[] | number | null>(null);
//   const [showVoteBar, setShowVoteBar] = useState(true);
//   const [voteBarExpanded, setVoteBarExpanded] = useState(false);
//   const [commentText, setCommentText] = useState("");
//
//   const currentPoll = pollSamples[pollId] || defaultPollData;
//
//   // 스크롤 시 투표바 표시/숨김
//   useEffect(() => {
//     let lastScrollY = window.scrollY;
//     const handleScroll = () => {
//       const currentScrollY = window.scrollY;
//       const windowHeight = window.innerHeight;
//       const documentHeight = document.documentElement.scrollHeight;
//       const isAtBottom = currentScrollY + windowHeight >= documentHeight - 50;
//       const isScrollingUp = currentScrollY < lastScrollY;
//       const isNearTop = currentScrollY < 100;
//
//       setShowVoteBar(isNearTop || isScrollingUp || isAtBottom);
//       lastScrollY = currentScrollY;
//     };
//     window.addEventListener("scroll", handleScroll, { passive: true });
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);
//
//   const handleVote = (value: string | string[] | number | Record<string, number>) => {
//     setSelectedValue(value as string | string[] | number);
//     setHasVoted(true);
//     setTimeout(() => {
//       const resultsSection = document.getElementById("results-section");
//       if (resultsSection) {
//         resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
//       }
//     }, 100);
//   };
//
//   const getOptionColor = (optionId: string) => {
//     return currentPoll.options.find((o) => o.id === optionId)?.color || "#888";
//   };
//
//   // 투표 결과 UI 렌더링
//   const renderResultsUI = () => {
//     if (!hasVoted) return null;
//
//     // 척도 타입은 별도 UI
//     if (currentPoll.pollType === "scale") {
//       return (
//         <section id="results-section" className="px-4 mt-6 scroll-mt-16">
//           <h2 className="text-sm font-semibold text-foreground mb-3">투표 결과</h2>
//           <ScalePoll
//             onVote={() => {}}
//             hasVoted={true}
//             selectedValue={selectedValue as number}
//             min={currentPoll.scaleConfig?.min}
//             max={currentPoll.scaleConfig?.max}
//             labels={currentPoll.scaleConfig?.labels}
//             results={currentPoll.scaleConfig?.results}
//           />
//         </section>
//       );
//     }
//
//     // 순위 타입
//     if (currentPoll.pollType === "ranking" && Array.isArray(selectedValue)) {
//       return (
//         <section id="results-section" className="px-4 mt-6 scroll-mt-16">
//           <h2 className="text-sm font-semibold text-foreground mb-3">투표 결과</h2>
//           <div className="bg-card border border-border rounded-xl p-4">
//             <p className="text-xs text-muted-foreground mb-3">내가 선택한 순위</p>
//             <div className="space-y-2">
//               {selectedValue.map((optionId, index) => {
//                 const option = currentPoll.options.find((o) => o.id === optionId);
//                 return (
//                   <div key={optionId} className="flex items-center gap-3">
//                     <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
//                       {index + 1}
//                     </span>
//                     <span className="text-sm text-foreground">{option?.label}</span>
//                   </div>
//                 );
//               })}
//             </div>
//             <p className="text-xs text-muted-foreground mt-4 text-center">
//               총 {currentPoll.totalVotes.toLocaleString()}명 참여
//             </p>
//           </div>
//         </section>
//       );
//     }
//
//     // 기본 결과 UI
//     return (
//       <section id="results-section" className="px-4 mt-6 scroll-mt-16">
//         <h2 className="text-sm font-semibold text-foreground mb-3">투표 결과</h2>
//         <div className="bg-card border border-border rounded-xl p-4">
//           <div className="space-y-3">
//             {currentPoll.options.map((option) => {
//               const isSelected =
//                 selectedValue === option.id ||
//                 (Array.isArray(selectedValue) && selectedValue.includes(option.id));
//               return (
//                 <div key={option.id}>
//                   <div className="flex items-center justify-between mb-1">
//                     <span
//                       className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}
//                     >
//                       {option.label}
//                       {isSelected && <span className="ml-2 text-xs text-primary">내 선택</span>}
//                     </span>
//                     <span className="text-sm font-bold" style={{ color: option.color }}>
//                       {option.percent}%
//                     </span>
//                   </div>
//                   <div className="h-2 bg-muted rounded-full overflow-hidden">
//                     <div
//                       className="h-full rounded-full transition-all duration-500"
//                       style={{ width: `${option.percent}%`, backgroundColor: option.color }}
//                     />
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//           <p className="text-xs text-muted-foreground mt-3 text-center">
//             총 {currentPoll.totalVotes.toLocaleString()}명 참여
//           </p>
//         </div>
//       </section>
//     );
//   };
//
//   return (
//     <div className="min-h-screen bg-background pb-24">
//       {/* Header */}
//       <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
//         <div className="flex items-center justify-between px-4 h-12">
//           <button
//             type="button"
//             onClick={() => router.back()}
//             className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
//           >
//             <ArrowLeft className="w-5 h-5" />
//             <span className="text-sm">뒤로</span>
//           </button>
//           <button type="button" className="p-2 hover:bg-muted rounded-full transition-colors">
//             <Share2 className="w-5 h-5 text-muted-foreground" />
//           </button>
//         </div>
//       </header>
//
//       {/* Hero Section */}
//       <section className="relative">
//         <div className="relative h-48 w-full">
//           <Image
//             src={currentPoll.image || "/placeholder.svg"}
//             alt={currentPoll.title}
//             fill
//             className="object-cover"
//           />
//           <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
//         </div>
//         <div className="px-4 -mt-16 relative z-10">
//           <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded mb-2">
//             {currentPoll.category}
//           </span>
//           <h1 className="text-xl font-bold text-foreground leading-tight text-balance">
//             {currentPoll.title}
//           </h1>
//           <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
//             {currentPoll.description}
//           </p>
//           <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
//             <div className="flex items-center gap-1">
//               <Users className="w-3.5 h-3.5" />
//               <span>{currentPoll.totalVotes.toLocaleString()}명 참여</span>
//             </div>
//             <div className="flex items-center gap-1">
//               <Clock className="w-3.5 h-3.5" />
//               <span>{currentPoll.endDate} 마감</span>
//             </div>
//           </div>
//         </div>
//       </section>
//
//       {/* AI Article Section */}
//       {currentPoll.aiArticle && (
//         <section className="px-4 mt-6">
//           <div className="flex items-center justify-between mb-3">
//             <div className="flex items-center gap-2">
//               <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
//                 <span className="text-[10px] font-bold text-primary-foreground">AI</span>
//               </div>
//               <div>
//                 <h2 className="text-sm font-semibold text-foreground">
//                   투표 전 알아두면 좋은 팩트
//                 </h2>
//                 <p className="text-[10px] text-muted-foreground">
//                   {currentPoll.aiArticle.lastUpdated} 업데이트
//                 </p>
//               </div>
//             </div>
//           </div>
//           <MarkdownRenderer content={currentPoll.aiArticle.content} />
//         </section>
//       )}
//
//       {/* Results Section */}
//       {renderResultsUI()}
//
//       {/* Comments Section */}
//       {hasVoted && currentPoll.comments && currentPoll.comments.length > 0 && (
//         <section className="px-4 mt-6">
//           <div className="flex items-center justify-between mb-3">
//             <h2 className="text-sm font-semibold text-foreground">
//               댓글 {currentPoll.comments.length}개
//             </h2>
//           </div>
//           <div className="divide-y divide-border">
//             {currentPoll.comments.map((comment) => (
//               <div key={comment.id} className="py-3 first:pt-0">
//                 <div className="flex gap-2.5">
//                   <div
//                     className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
//                     style={{ backgroundColor: getOptionColor(comment.vote) }}
//                   >
//                     {comment.author[0]}
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center gap-2">
//                       <span className="text-sm font-medium text-foreground">{comment.author}</span>
//                       <span
//                         className="text-[10px] px-1.5 py-0.5 rounded"
//                         style={{
//                           backgroundColor: `${getOptionColor(comment.vote)}20`,
//                           color: getOptionColor(comment.vote),
//                         }}
//                       >
//                         {currentPoll.options.find((o) => o.id === comment.vote)?.label}
//                       </span>
//                       <span className="text-[11px] text-muted-foreground">{comment.createdAt}</span>
//                     </div>
//                     <p className="text-sm text-foreground/90 mt-1 leading-relaxed">
//                       {comment.content}
//                     </p>
//                     <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
//                       <button
//                         type="button"
//                         className="flex items-center gap-1 hover:text-primary transition-colors"
//                       >
//                         <ThumbsUp className="w-3 h-3" />
//                         <span>{comment.likes}</span>
//                       </button>
//                       <button type="button" className="hover:text-primary transition-colors">
//                         답글
//                       </button>
//                     </div>
//
//                     {/* 대댓글 */}
//                     {comment.replies && comment.replies.length > 0 && (
//                       <div className="mt-3 space-y-3">
//                         {comment.replies.map((reply) => (
//                           <div key={reply.id} className="flex gap-2">
//                             <div
//                               className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
//                               style={{ backgroundColor: getOptionColor(reply.vote) }}
//                             >
//                               {reply.author[0]}
//                             </div>
//                             <div className="flex-1 min-w-0">
//                               <div className="flex items-center gap-2">
//                                 <span className="text-[13px] font-medium text-foreground">
//                                   {reply.author}
//                                 </span>
//                                 <span
//                                   className="text-[9px] px-1 py-0.5 rounded"
//                                   style={{
//                                     backgroundColor: `${getOptionColor(reply.vote)}20`,
//                                     color: getOptionColor(reply.vote),
//                                   }}
//                                 >
//                                   {currentPoll.options.find((o) => o.id === reply.vote)?.label}
//                                 </span>
//                                 <span className="text-[10px] text-muted-foreground">
//                                   {reply.createdAt}
//                                 </span>
//                               </div>
//                               <p className="text-[13px] text-foreground/90 mt-0.5 leading-relaxed">
//                                 {reply.content}
//                               </p>
//                               <div className="flex items-center gap-4 mt-1 text-[11px] text-muted-foreground">
//                                 <button
//                                   type="button"
//                                   className="flex items-center gap-1 hover:text-primary transition-colors"
//                                 >
//                                   <ThumbsUp className="w-2.5 h-2.5" />
//                                   <span>{reply.likes}</span>
//                                 </button>
//                                 <button
//                                   type="button"
//                                   className="hover:text-primary transition-colors"
//                                 >
//                                   답글
//                                 </button>
//                               </div>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </section>
//       )}
//
//       {/* Floating Vote Bar */}
//       <div
//         className={`fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 ${
//           showVoteBar ? "translate-y-0" : "translate-y-full"
//         }`}
//       >
//         {!hasVoted ? (
//           <FloatingVoteBar
//             pollType={currentPoll.pollType}
//             options={currentPoll.options}
//             onVote={handleVote}
//             scaleConfig={currentPoll.scaleConfig}
//           />
//         ) : (
//           <div className="px-4 py-2.5">
//             {voteBarExpanded ? (
//               <div>
//                 <div className="flex items-center justify-between mb-2">
//                   <span className="text-xs text-muted-foreground">다시 투표하기</span>
//                   <button
//                     type="button"
//                     onClick={() => setVoteBarExpanded(false)}
//                     className="text-xs text-muted-foreground hover:text-foreground"
//                   >
//                     취소
//                   </button>
//                 </div>
//                 <FloatingVoteBar
//                   pollType={currentPoll.pollType}
//                   options={currentPoll.options}
//                   onVote={(value) => {
//                     setSelectedValue(value as string | string[] | number);
//                     setVoteBarExpanded(false);
//                   }}
//                   scaleConfig={currentPoll.scaleConfig}
//                 />
//               </div>
//             ) : (
//               <div>
//                 <div className="flex items-center gap-2 mb-2">
//                   {typeof selectedValue === "string" && getOptionColor(selectedValue) && (
//                     <div
//                       className="w-2.5 h-2.5 rounded-full flex-shrink-0"
//                       style={{ backgroundColor: getOptionColor(selectedValue) }}
//                     />
//                   )}
//                   <span className="text-xs text-muted-foreground">
//                     {typeof selectedValue === "string" &&
//                       currentPoll.options.find((o) => o.id === selectedValue) && (
//                         <>
//                           <span className="font-medium text-foreground">
//                             {currentPoll.options.find((o) => o.id === selectedValue)?.label}
//                           </span>
//                           에 투표함
//                         </>
//                       )}
//                     {typeof selectedValue === "number" && (
//                       <>
//                         <span className="font-medium text-foreground">{selectedValue}점</span>으로
//                         투표함
//                       </>
//                     )}
//                     {Array.isArray(selectedValue) && (
//                       <>
//                         <span className="font-medium text-foreground">
//                           {selectedValue.length}개
//                         </span>{" "}
//                         선택함
//                       </>
//                     )}
//                   </span>
//                   <button
//                     type="button"
//                     onClick={() => setVoteBarExpanded(true)}
//                     className="ml-auto text-[11px] text-primary hover:underline flex-shrink-0"
//                   >
//                     변경
//                   </button>
//                 </div>
//
//                 {/* 댓글 입력 */}
//                 <div className="flex gap-2">
//                   <input
//                     type="text"
//                     value={commentText}
//                     onChange={(e) => setCommentText(e.target.value)}
//                     placeholder="의견을 남겨보세요..."
//                     className="flex-1 px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
//                   />
//                   <Button
//                     size="sm"
//                     disabled={!commentText.trim()}
//                     onClick={() => {
//                       setCommentText("");
//                     }}
//                     className="px-4"
//                   >
//                     등록
//                   </Button>
//                 </div>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

interface PollDetailClientProps {
  pollId: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PollDetailClient(_props: PollDetailClientProps) {
  return null;
}
