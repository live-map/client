"use client";

import type { PollOption } from "@/lib/types/poll";
import { CANDIDATE_MAP } from "@/lib/constants/candidates";

const OPTION_COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
  "#6366F1",
  "#14B8A6",
];

interface SingleChoiceInteractionProps {
  options: Pick<PollOption, "id" | "text" | "voteCount">[];
  selectedOption: string | null;
  onSelect: (optionId: string) => void;
  disabled: boolean;
}

export function SingleChoiceInteraction({
  options,
  selectedOption,
  onSelect,
  disabled,
}: SingleChoiceInteractionProps) {
  return (
    <div className="mb-6 space-y-3">
      <p className="mb-3 text-sm font-medium text-foreground">투표할 항목을 선택해주세요</p>
      {options.map((option, index) => {
        const candidateInfo = CANDIDATE_MAP[option.text];
        const color = candidateInfo?.color ?? OPTION_COLORS[index % OPTION_COLORS.length]!;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            disabled={disabled}
            className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 transition-all ${
              selectedOption === option.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/30"
            }`}
          >
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-card"
              style={{ backgroundColor: color }}
            >
              {option.text[0]}
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">{option.text}</p>
              {candidateInfo && (
                <p className="text-xs text-muted-foreground">{candidateInfo.party}</p>
              )}
            </div>
            <div
              className={`h-5 w-5 rounded-full border-2 ${
                selectedOption === option.id
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              }`}
            >
              {selectedOption === option.id && (
                <svg
                  className="h-full w-full text-primary-foreground"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
