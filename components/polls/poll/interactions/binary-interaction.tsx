// [COMMENTED OUT] 여론조사 기능 비활성화 - 이진 선택(A/B) 인터랙션 컴포넌트
//
// "use client";
//
// import type { PollOption } from "@/lib/generated/prisma/client";
//
// interface BinaryInteractionProps {
//   options: Pick<PollOption, "id" | "text" | "voteCount">[];
//   selectedOption: string | null;
//   onSelect: (optionId: string) => void;
//   disabled: boolean;
// }
//
// export function BinaryInteraction({
//   options,
//   selectedOption,
//   onSelect,
//   disabled,
// }: BinaryInteractionProps) {
//   const optionA = options[0];
//   const optionB = options[1];
//
//   if (!optionA || !optionB) return null;
//
//   return (
//     <div className="mb-6">
//       <p className="mb-4 text-sm font-medium text-foreground">어느 쪽에 더 가깝나요?</p>
//       <div className="flex gap-3">
//         {[optionA, optionB].map((option, i) => {
//           const isSelected = selectedOption === option.id;
//           const colors =
//             i === 0
//               ? {
//                   bg: "bg-blue-500",
//                   light: "bg-blue-500/10",
//                   border: "border-blue-500",
//                   text: "text-blue-500",
//                 }
//               : {
//                   bg: "bg-red-500",
//                   light: "bg-red-500/10",
//                   border: "border-red-500",
//                   text: "text-red-500",
//                 };
//
//           return (
//             <button
//               key={option.id}
//               type="button"
//               onClick={() => onSelect(option.id)}
//               disabled={disabled}
//               className={`flex flex-1 flex-col items-center gap-3 rounded-2xl border-2 p-5 transition-all ${
//                 isSelected
//                   ? `${colors.border} ${colors.light}`
//                   : "border-border hover:border-muted-foreground/30"
//               }`}
//             >
//               <div
//                 className={`flex h-16 w-16 items-center justify-center rounded-full ${colors.bg} text-2xl font-bold text-white`}
//               >
//                 {i === 0 ? "A" : "B"}
//               </div>
//               <span
//                 className={`text-center text-sm font-semibold ${isSelected ? colors.text : "text-foreground"}`}
//               >
//                 {option.text}
//               </span>
//               {isSelected && <span className={`text-xs font-medium ${colors.text}`}>선택됨</span>}
//             </button>
//           );
//         })}
//       </div>
//       <div className="mt-3 flex items-center justify-center gap-2">
//         <span className="text-lg font-bold text-blue-500">A</span>
//         <span className="text-xs text-muted-foreground">vs</span>
//         <span className="text-lg font-bold text-red-500">B</span>
//       </div>
//     </div>
//   );
// }

interface BinaryInteractionProps {
  options: unknown[];
  selectedOption: string | null;
  onSelect: (optionId: string) => void;
  disabled: boolean;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function BinaryInteraction(_props: BinaryInteractionProps) {
  return null;
}
