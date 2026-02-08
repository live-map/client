// [COMMENTED OUT] 여론조사 기능 비활성화 - VoteCard 컴포넌트
// "use client";
//
// import { useState, useTransition } from "react";
// import { X, FileText, ExternalLink, Users, Clock } from "lucide-react";
// import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
// import { castVote } from "@/app/actions/polls";
// import type { PollWithDetails } from "@/app/actions/polls/queries";
// import type { UserVoteData } from "@/app/actions/polls/queries";
// import type { CastVoteDto } from "@/lib/validations/poll";
// import { CANDIDATE_MAP } from "@/lib/constants/candidates";
// import {
//   SingleChoiceInteraction,
//   BinaryInteraction,
//   EmojiInteraction,
//   SliderInteraction,
//   MultipleChoiceInteraction,
//   RankingInteraction,
// } from "@/components/polls/poll/interactions";
//
// const OPTION_COLORS = [
//   "#3B82F6",
//   "#EF4444",
//   "#10B981",
//   "#F59E0B",
//   "#8B5CF6",
//   "#EC4899",
//   "#06B6D4",
//   "#F97316",
//   "#6366F1",
//   "#14B8A6",
// ];
//
// const SOURCE_TYPE_LABELS: Record<string, string> = {
//   NEWS: "뉴스",
//   PAPER: "논문",
//   ARTICLE: "기사",
//   VIDEO: "영상",
//   OTHER: "기타",
// };
//
// const INTERACTION_TYPE_LABELS: Record<string, string> = {
//   SINGLE_CHOICE: "단일 선택",
//   BINARY: "양자택일",
//   EMOJI_REACTION: "이모지 반응",
//   SLIDER: "스펙트럼",
//   MULTIPLE_CHOICE: "복수 선택",
//   RANKING: "순위 매기기",
// };
//
// interface VoteCardProps {
//   poll: PollWithDetails;
//   isOpen: boolean;
//   onClose: () => void;
//   isLoggedIn: boolean;
//   userVote?: UserVoteData | null;
// }
//
// export function VoteCard({ poll, isOpen, onClose, isLoggedIn, userVote }: VoteCardProps) {
//   const [selectedOption, setSelectedOption] = useState<string | null>(null);
//   const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
//   const [sliderValue, setSliderValue] = useState(50);
//   const [ranking, setRanking] = useState<string[]>(() => poll.options.map((o) => o.id));
//   const [hasVoted, setHasVoted] = useState(!!userVote);
//   const [showSources, setShowSources] = useState(false);
//   const [isPending, startTransition] = useTransition();
//
//   const interactionType = poll.interactionType;
//
//   const handleVote = () => {
//     if (!isLoggedIn) {
//       toast.error("로그인이 필요합니다");
//       return;
//     }
//
//     let dto: CastVoteDto;
//
//     switch (interactionType) {
//       case "SINGLE_CHOICE":
//         if (!selectedOption) return;
//         dto = { pollId: poll.id, interactionType: "SINGLE_CHOICE", optionId: selectedOption };
//         break;
//       case "BINARY":
//         if (!selectedOption) return;
//         dto = { pollId: poll.id, interactionType: "BINARY", optionId: selectedOption };
//         break;
//       case "EMOJI_REACTION":
//         if (!selectedOption) return;
//         dto = { pollId: poll.id, interactionType: "EMOJI_REACTION", optionId: selectedOption };
//         break;
//       case "SLIDER":
//         dto = { pollId: poll.id, interactionType: "SLIDER", sliderValue };
//         break;
//       case "MULTIPLE_CHOICE":
//         if (selectedOptions.length === 0) return;
//         dto = {
//           pollId: poll.id,
//           interactionType: "MULTIPLE_CHOICE",
//           selectedOptionIds: selectedOptions,
//         };
//         break;
//       case "RANKING":
//         dto = { pollId: poll.id, interactionType: "RANKING", rankingData: ranking };
//         break;
//     }
//
//     startTransition(async () => {
//       const result = await castVote(dto);
//       if (result.error) {
//         toast.error(result.error);
//       } else {
//         toast.success("투표가 완료되었습니다");
//         setHasVoted(true);
//       }
//     });
//   };
//
//   const handleClose = () => {
//     setSelectedOption(null);
//     setSelectedOptions([]);
//     setSliderValue(50);
//     setRanking(poll.options.map((o) => o.id));
//     setShowSources(false);
//     onClose();
//   };
//
//   const handleMultipleToggle = (optionId: string) => {
//     setSelectedOptions((prev) =>
//       prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
//     );
//   };
//
//   if (!isOpen) return null;
//
//   const isPollActive = poll.status === "ACTIVE";
//   const showResults = hasVoted || !isPollActive;
//   const endDate = poll.endsAt ? new Date(poll.endsAt).toLocaleDateString("ko-KR") : null;
//   const categoryLabel = poll.type === "OFFICIAL" ? "공식 여론조사" : "제안";
//   const typeLabel = INTERACTION_TYPE_LABELS[interactionType] ?? "";
//
//   const isVoteDisabled = (() => {
//     switch (interactionType) {
//       case "SINGLE_CHOICE":
//       case "BINARY":
//       case "EMOJI_REACTION":
//         return !selectedOption || isPending || !isLoggedIn;
//       case "SLIDER":
//         return isPending || !isLoggedIn;
//       case "MULTIPLE_CHOICE":
//         return selectedOptions.length === 0 || isPending || !isLoggedIn;
//       case "RANKING":
//         return isPending || !isLoggedIn;
//     }
//   })();
//
//   return (
//     <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
//       {/* Backdrop */}
//       <div
//         className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
//         onClick={handleClose}
//         onKeyDown={(e) => e.key === "Escape" && handleClose()}
//         role="button"
//         tabIndex={0}
//         aria-label="닫기"
//       />
//
//       {/* Card */}
//       <div className="relative max-h-[90vh] w-full max-w-md overflow-hidden rounded-t-2xl bg-card shadow-2xl animate-in slide-in-from-bottom duration-300 md:rounded-2xl">
//         {/* Header */}
//         <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-4 py-3">
//           <div className="flex items-center gap-2">
//             <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
//               {categoryLabel}
//             </span>
//             {interactionType !== "SINGLE_CHOICE" && (
//               <span className="rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
//                 {typeLabel}
//               </span>
//             )}
//           </div>
//           <button
//             type="button"
//             onClick={handleClose}
//             className="rounded-full p-1 transition-colors hover:bg-muted"
//             aria-label="닫기"
//           >
//             <X className="h-5 w-5 text-muted-foreground" />
//           </button>
//         </div>
//
//         {/* Content */}
//         <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-4">
//           <h2 className="mb-2 text-lg font-bold text-foreground text-balance">{poll.title}</h2>
//
//           {poll.description && (
//             <p className="mb-4 text-sm text-muted-foreground">{poll.description}</p>
//           )}
//
//           {/* Meta Info */}
//           <div className="mb-6 flex items-center gap-4 text-xs text-muted-foreground">
//             <div className="flex items-center gap-1">
//               <Users className="h-3.5 w-3.5" />
//               <span>{poll.totalVotes.toLocaleString()}명 참여</span>
//             </div>
//             {endDate && (
//               <div className="flex items-center gap-1">
//                 <Clock className="h-3.5 w-3.5" />
//                 <span>{endDate}까지</span>
//               </div>
//             )}
//           </div>
//
//           {/* Voting or Results */}
//           {!showResults ? (
//             <InteractionView
//               interactionType={interactionType}
//               options={poll.options}
//               selectedOption={selectedOption}
//               onSelectOption={setSelectedOption}
//               selectedOptions={selectedOptions}
//               onToggleOption={handleMultipleToggle}
//               sliderValue={sliderValue}
//               onSliderChange={setSliderValue}
//               ranking={ranking}
//               onRankingChange={setRanking}
//               disabled={isPending}
//             />
//           ) : (
//             <ResultView
//               interactionType={interactionType}
//               options={poll.options}
//               totalVotes={poll.totalVotes}
//               userVote={userVote}
//               selectedOption={selectedOption}
//               selectedOptions={selectedOptions}
//               sliderValue={sliderValue}
//               ranking={ranking}
//             />
//           )}
//
//           {/* Sources Toggle */}
//           {poll.sources.length > 0 && (
//             <>
//               <button
//                 type="button"
//                 onClick={() => setShowSources(!showSources)}
//                 className="mb-4 flex w-full items-center justify-between rounded-xl bg-muted p-3"
//               >
//                 <div className="flex items-center gap-2">
//                   <FileText className="h-4 w-4 text-primary" />
//                   <span className="text-sm font-medium text-foreground">관련 자료 확인하기</span>
//                 </div>
//                 <span className="text-xs text-muted-foreground">{poll.sources.length}개</span>
//               </button>
//
//               {/* Sources List */}
//               {showSources && (
//                 <div className="mb-4 space-y-2 animate-in fade-in duration-200">
//                   {poll.sources.map((source) => (
//                     <a
//                       key={source.id}
//                       href={source.url}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted"
//                     >
//                       <div
//                         className={`rounded px-2 py-0.5 text-xs font-medium ${
//                           source.sourceType === "NEWS"
//                             ? "bg-chart-1/10 text-chart-1"
//                             : source.sourceType === "PAPER"
//                               ? "bg-chart-2/10 text-chart-2"
//                               : "bg-chart-4/10 text-chart-4"
//                         }`}
//                       >
//                         {SOURCE_TYPE_LABELS[source.sourceType] ?? "기타"}
//                       </div>
//                       <div className="min-w-0 flex-1">
//                         <p className="text-sm text-foreground line-clamp-2">{source.title}</p>
//                         {source.description && (
//                           <p className="mt-1 text-xs text-muted-foreground">{source.description}</p>
//                         )}
//                       </div>
//                       <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
//                     </a>
//                   ))}
//                 </div>
//               )}
//             </>
//           )}
//         </div>
//
//         {/* Footer */}
//         <div className="sticky bottom-0 border-t border-border bg-card p-4">
//           {!showResults ? (
//             <Button className="w-full" size="lg" disabled={isVoteDisabled} onClick={handleVote}>
//               {isPending ? "투표 중..." : isLoggedIn ? "투표하기" : "로그인 후 투표"}
//             </Button>
//           ) : (
//             <Button
//               className="w-full bg-transparent"
//               size="lg"
//               variant="outline"
//               onClick={handleClose}
//             >
//               닫기
//             </Button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
//
// // ----- Interaction View -----
//
// interface InteractionViewProps {
//   interactionType: string;
//   options: PollWithDetails["options"];
//   selectedOption: string | null;
//   onSelectOption: (id: string) => void;
//   selectedOptions: string[];
//   onToggleOption: (id: string) => void;
//   sliderValue: number;
//   onSliderChange: (v: number) => void;
//   ranking: string[];
//   onRankingChange: (ranking: string[]) => void;
//   disabled: boolean;
// }
//
// function InteractionView({
//   interactionType,
//   options,
//   selectedOption,
//   onSelectOption,
//   selectedOptions,
//   onToggleOption,
//   sliderValue,
//   onSliderChange,
//   ranking,
//   onRankingChange,
//   disabled,
// }: InteractionViewProps) {
//   switch (interactionType) {
//     case "BINARY":
//       return (
//         <BinaryInteraction
//           options={options}
//           selectedOption={selectedOption}
//           onSelect={onSelectOption}
//           disabled={disabled}
//         />
//       );
//     case "EMOJI_REACTION":
//       return (
//         <EmojiInteraction
//           options={options}
//           selectedOption={selectedOption}
//           onSelect={onSelectOption}
//           disabled={disabled}
//         />
//       );
//     case "SLIDER":
//       return (
//         <SliderInteraction
//           options={options}
//           sliderValue={sliderValue}
//           onSliderChange={onSliderChange}
//           disabled={disabled}
//         />
//       );
//     case "MULTIPLE_CHOICE":
//       return (
//         <MultipleChoiceInteraction
//           options={options}
//           selectedOptions={selectedOptions}
//           onToggle={onToggleOption}
//           disabled={disabled}
//         />
//       );
//     case "RANKING":
//       return (
//         <RankingInteraction
//           options={options}
//           ranking={ranking}
//           onRankingChange={onRankingChange}
//           disabled={disabled}
//         />
//       );
//     default:
//       return (
//         <SingleChoiceInteraction
//           options={options}
//           selectedOption={selectedOption}
//           onSelect={onSelectOption}
//           disabled={disabled}
//         />
//       );
//   }
// }
//
// // ----- Result View -----
//
// interface ResultViewProps {
//   interactionType: string;
//   options: PollWithDetails["options"];
//   totalVotes: number;
//   userVote?: UserVoteData | null;
//   selectedOption: string | null;
//   selectedOptions: string[];
//   sliderValue: number;
//   ranking: string[];
// }
//
// function ResultView({
//   interactionType,
//   options,
//   totalVotes,
//   userVote,
//   selectedOption,
//   selectedOptions,
//   sliderValue,
//   ranking,
// }: ResultViewProps) {
//   switch (interactionType) {
//     case "BINARY":
//       return (
//         <BinaryResult
//           options={options}
//           totalVotes={totalVotes}
//           userVote={userVote}
//           selectedOption={selectedOption}
//         />
//       );
//     case "EMOJI_REACTION":
//       return (
//         <EmojiResult
//           options={options}
//           totalVotes={totalVotes}
//           userVote={userVote}
//           selectedOption={selectedOption}
//         />
//       );
//     case "SLIDER":
//       return (
//         <SliderResult
//           options={options}
//           totalVotes={totalVotes}
//           userSliderValue={userVote?.sliderValue ?? sliderValue}
//         />
//       );
//     case "MULTIPLE_CHOICE":
//       return (
//         <MultipleChoiceResult
//           options={options}
//           totalVotes={totalVotes}
//           userVote={userVote}
//           selectedOptions={selectedOptions}
//         />
//       );
//     case "RANKING":
//       return (
//         <RankingResult
//           options={options}
//           totalVotes={totalVotes}
//           userVote={userVote}
//           ranking={ranking}
//         />
//       );
//     default:
//       return (
//         <SingleChoiceResult
//           options={options}
//           totalVotes={totalVotes}
//           userVote={userVote}
//           selectedOption={selectedOption}
//         />
//       );
//   }
// }
//
// // ----- Result Components -----
//
// function SingleChoiceResult({
//   options,
//   totalVotes,
//   userVote,
//   selectedOption,
// }: {
//   options: PollWithDetails["options"];
//   totalVotes: number;
//   userVote?: UserVoteData | null;
//   selectedOption: string | null;
// }) {
//   const votedOptionId = userVote?.optionId ?? selectedOption;
//
//   return (
//     <div className="mb-6 space-y-4">
//       <p className="mb-3 text-sm font-medium text-foreground">현재 투표 결과</p>
//       <div className="grid grid-cols-2 gap-3">
//         {options.map((option, index) => {
//           const candidateInfo = CANDIDATE_MAP[option.text];
//           const color = candidateInfo?.color ?? OPTION_COLORS[index % OPTION_COLORS.length]!;
//           const percentage = totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;
//
//           return (
//             <div
//               key={option.id}
//               className={`relative overflow-hidden rounded-xl border ${
//                 option.id === votedOptionId ? "border-primary" : "border-border"
//               }`}
//             >
//               <div className="absolute inset-0 opacity-20" style={{ backgroundColor: color }} />
//               <div className="relative flex flex-col items-center p-3">
//                 <div
//                   className="mb-2 flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-card"
//                   style={{ backgroundColor: color }}
//                 >
//                   {option.text[0]}
//                 </div>
//                 {candidateInfo && (
//                   <p className="text-xs text-muted-foreground">{candidateInfo.party}</p>
//                 )}
//                 <p className="text-sm font-medium text-foreground">{option.text}</p>
//                 <p className="mt-1 text-2xl font-bold" style={{ color }}>
//                   {percentage.toFixed(1)}%
//                 </p>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }
//
// function BinaryResult({
//   options,
//   totalVotes,
//   userVote,
//   selectedOption,
// }: {
//   options: PollWithDetails["options"];
//   totalVotes: number;
//   userVote?: UserVoteData | null;
//   selectedOption: string | null;
// }) {
//   const votedOptionId = userVote?.optionId ?? selectedOption;
//   const optionA = options[0];
//   const optionB = options[1];
//   if (!optionA || !optionB) return null;
//
//   const pctA = totalVotes > 0 ? (optionA.voteCount / totalVotes) * 100 : 50;
//   const pctB = totalVotes > 0 ? (optionB.voteCount / totalVotes) * 100 : 50;
//
//   return (
//     <div className="mb-6">
//       <p className="mb-4 text-sm font-medium text-foreground">현재 투표 결과</p>
//       <div className="overflow-hidden rounded-2xl border border-border">
//         {/* Bar */}
//         <div className="flex h-12">
//           <div
//             className="flex items-center justify-center bg-blue-500 text-sm font-bold text-white transition-all"
//             style={{ width: `${pctA}%` }}
//           >
//             {pctA.toFixed(1)}%
//           </div>
//           <div
//             className="flex items-center justify-center bg-red-500 text-sm font-bold text-white transition-all"
//             style={{ width: `${pctB}%` }}
//           >
//             {pctB.toFixed(1)}%
//           </div>
//         </div>
//         {/* Labels */}
//         <div className="flex justify-between p-3">
//           <div className="flex items-center gap-2">
//             <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
//               A
//             </span>
//             <div>
//               <p
//                 className={`text-sm font-medium ${votedOptionId === optionA.id ? "text-blue-500" : "text-foreground"}`}
//               >
//                 {optionA.text}
//               </p>
//               <p className="text-xs text-muted-foreground">
//                 {optionA.voteCount.toLocaleString()}명
//               </p>
//             </div>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="text-right">
//               <p
//                 className={`text-sm font-medium ${votedOptionId === optionB.id ? "text-red-500" : "text-foreground"}`}
//               >
//                 {optionB.text}
//               </p>
//               <p className="text-xs text-muted-foreground">
//                 {optionB.voteCount.toLocaleString()}명
//               </p>
//             </div>
//             <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white">
//               B
//             </span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
//
// function EmojiResult({
//   options,
//   totalVotes,
//   userVote,
//   selectedOption,
// }: {
//   options: PollWithDetails["options"];
//   totalVotes: number;
//   userVote?: UserVoteData | null;
//   selectedOption: string | null;
// }) {
//   const votedOptionId = userVote?.optionId ?? selectedOption;
//   const maxVotes = Math.max(...options.map((o) => o.voteCount), 1);
//
//   return (
//     <div className="mb-6">
//       <p className="mb-4 text-sm font-medium text-foreground">현재 반응 결과</p>
//       <div className="space-y-3">
//         {options.map((option) => {
//           const parts = option.text.split(" ");
//           const emoji = parts[0] ?? "";
//           const label = parts.slice(1).join(" ");
//           const pct = totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;
//           const barWidth = (option.voteCount / maxVotes) * 100;
//           const isVoted = option.id === votedOptionId;
//
//           return (
//             <div
//               key={option.id}
//               className={`rounded-xl border p-3 ${isVoted ? "border-primary bg-primary/5" : "border-border"}`}
//             >
//               <div className="mb-2 flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                   <span className="text-2xl">{emoji}</span>
//                   {label && <span className="text-sm font-medium text-foreground">{label}</span>}
//                 </div>
//                 <span className="text-sm font-bold text-foreground">{pct.toFixed(1)}%</span>
//               </div>
//               <div className="h-2 overflow-hidden rounded-full bg-muted">
//                 <div
//                   className="h-full rounded-full bg-primary transition-all"
//                   style={{ width: `${barWidth}%` }}
//                 />
//               </div>
//               <p className="mt-1 text-xs text-muted-foreground">
//                 {option.voteCount.toLocaleString()}명
//               </p>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }
//
// function SliderResult({
//   options,
//   totalVotes,
//   userSliderValue,
// }: {
//   options: PollWithDetails["options"];
//   totalVotes: number;
//   userSliderValue: number;
// }) {
//   const leftLabel = options[0]?.text ?? "0";
//   const rightLabel = options[1]?.text ?? "100";
//   // For demo purposes, show the user's value + fake average
//   const fakeAverage = 52;
//
//   return (
//     <div className="mb-6">
//       <p className="mb-4 text-sm font-medium text-foreground">투표 결과</p>
//       <div className="rounded-2xl border border-border p-5">
//         <div className="mb-4 flex justify-center gap-8">
//           <div className="text-center">
//             <p className="text-xs text-muted-foreground">내 응답</p>
//             <p className="text-2xl font-bold text-primary">{userSliderValue}</p>
//           </div>
//           <div className="text-center">
//             <p className="text-xs text-muted-foreground">평균</p>
//             <p className="text-2xl font-bold text-foreground">{fakeAverage}</p>
//           </div>
//         </div>
//
//         <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
//           <div className="h-full rounded-full bg-primary/30" style={{ width: `${fakeAverage}%` }} />
//           {/* User marker */}
//           <div
//             className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow"
//             style={{ left: `${userSliderValue}%` }}
//           />
//         </div>
//
//         <div className="mt-2 flex justify-between">
//           <span className="text-xs text-muted-foreground">{leftLabel}</span>
//           <span className="text-xs text-muted-foreground">{rightLabel}</span>
//         </div>
//
//         <p className="mt-4 text-center text-xs text-muted-foreground">
//           {totalVotes.toLocaleString()}명 참여
//         </p>
//       </div>
//     </div>
//   );
// }
//
// function MultipleChoiceResult({
//   options,
//   totalVotes,
//   userVote,
//   selectedOptions,
// }: {
//   options: PollWithDetails["options"];
//   totalVotes: number;
//   userVote?: UserVoteData | null;
//   selectedOptions: string[];
// }) {
//   const userSelected = userVote?.selectedOptionIds ?? selectedOptions;
//   const maxVotes = Math.max(...options.map((o) => o.voteCount), 1);
//
//   return (
//     <div className="mb-6">
//       <p className="mb-4 text-sm font-medium text-foreground">현재 투표 결과 (복수 선택)</p>
//       <div className="space-y-3">
//         {[...options]
//           .sort((a, b) => b.voteCount - a.voteCount)
//           .map((option) => {
//             const barWidth = (option.voteCount / maxVotes) * 100;
//             const isUserSelected = userSelected.includes(option.id);
//             // percentage relative to totalVotes (can exceed 100% since multiple choice)
//             const pct = totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;
//
//             return (
//               <div
//                 key={option.id}
//                 className={`rounded-xl border p-3 ${isUserSelected ? "border-primary bg-primary/5" : "border-border"}`}
//               >
//                 <div className="mb-2 flex items-center justify-between">
//                   <span className="text-sm font-medium text-foreground">{option.text}</span>
//                   <span className="text-sm font-bold text-foreground">{pct.toFixed(1)}%</span>
//                 </div>
//                 <div className="h-2 overflow-hidden rounded-full bg-muted">
//                   <div
//                     className="h-full rounded-full bg-primary transition-all"
//                     style={{ width: `${barWidth}%` }}
//                   />
//                 </div>
//                 <p className="mt-1 text-xs text-muted-foreground">
//                   {option.voteCount.toLocaleString()}명
//                 </p>
//               </div>
//             );
//           })}
//       </div>
//     </div>
//   );
// }
//
// function RankingResult({
//   options,
//   totalVotes,
//   userVote,
//   ranking,
// }: {
//   options: PollWithDetails["options"];
//   totalVotes: number;
//   userVote?: UserVoteData | null;
//   ranking: string[];
// }) {
//   // Show ranking by voteCount (which tracks #1 picks)
//   const userRanking = (userVote?.rankingData as string[] | undefined) ?? ranking;
//   const sorted = [...options].sort((a, b) => b.voteCount - a.voteCount);
//   const maxVotes = Math.max(...options.map((o) => o.voteCount), 1);
//
//   const RANK_COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"];
//
//   return (
//     <div className="mb-6">
//       <p className="mb-4 text-sm font-medium text-foreground">종합 순위 (1위 선택 기준)</p>
//       <div className="space-y-2">
//         {sorted.map((option, index) => {
//           const color = RANK_COLORS[index % RANK_COLORS.length]!;
//           const barWidth = (option.voteCount / maxVotes) * 100;
//           const userRank = userRanking.indexOf(option.id) + 1;
//
//           return (
//             <div
//               key={option.id}
//               className="flex items-center gap-3 rounded-xl border border-border p-3"
//             >
//               <div
//                 className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
//                 style={{ backgroundColor: color }}
//               >
//                 {index + 1}
//               </div>
//               <div className="min-w-0 flex-1">
//                 <div className="mb-1 flex items-center justify-between">
//                   <span className="text-sm font-medium text-foreground">{option.text}</span>
//                   <span className="text-xs text-muted-foreground">
//                     {option.voteCount.toLocaleString()}표
//                   </span>
//                 </div>
//                 <div className="h-1.5 overflow-hidden rounded-full bg-muted">
//                   <div
//                     className="h-full rounded-full transition-all"
//                     style={{ width: `${barWidth}%`, backgroundColor: color }}
//                   />
//                 </div>
//               </div>
//               {userRank > 0 && (
//                 <span className="shrink-0 text-xs text-muted-foreground">내 {userRank}위</span>
//               )}
//             </div>
//           );
//         })}
//       </div>
//       <p className="mt-3 text-center text-xs text-muted-foreground">
//         {totalVotes.toLocaleString()}명 참여
//       </p>
//     </div>
//   );
// }

interface VoteCardProps {
  poll: Record<string, unknown>;
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  userVote?: Record<string, unknown> | null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function VoteCard(_props: VoteCardProps) {
  return null;
}
