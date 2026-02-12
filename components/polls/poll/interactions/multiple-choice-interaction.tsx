"use client";

import { Check } from "lucide-react";
import type { PollOption } from "@/lib/types/poll";

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

interface MultipleChoiceInteractionProps {
  options: Pick<PollOption, "id" | "text" | "voteCount">[];
  selectedOptions: string[];
  onToggle: (optionId: string) => void;
  disabled: boolean;
}

export function MultipleChoiceInteraction({
  options,
  selectedOptions,
  onToggle,
  disabled,
}: MultipleChoiceInteractionProps) {
  return (
    <div className="mb-6 space-y-3">
      <p className="mb-3 text-sm font-medium text-foreground">
        해당하는 항목을 모두 선택해주세요
        <span className="ml-1 text-xs text-muted-foreground">(복수 선택 가능)</span>
      </p>
      {options.map((option, index) => {
        const isSelected = selectedOptions.includes(option.id);
        const color = OPTION_COLORS[index % OPTION_COLORS.length]!;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onToggle(option.id)}
            disabled={disabled}
            className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 transition-all ${
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/30"
            }`}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-card"
              style={{ backgroundColor: color }}
            >
              {option.text[0]}
            </div>
            <p className="flex-1 text-left font-medium text-foreground">{option.text}</p>
            <div
              className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
              }`}
            >
              {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
            </div>
          </button>
        );
      })}
      {selectedOptions.length > 0 && (
        <p className="text-xs text-muted-foreground">{selectedOptions.length}개 선택됨</p>
      )}
    </div>
  );
}
