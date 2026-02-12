"use client";

import type { PollOption } from "@/lib/types/poll";

interface EmojiInteractionProps {
  options: Pick<PollOption, "id" | "text" | "voteCount">[];
  selectedOption: string | null;
  onSelect: (optionId: string) => void;
  disabled: boolean;
}

export function EmojiInteraction({
  options,
  selectedOption,
  onSelect,
  disabled,
}: EmojiInteractionProps) {
  return (
    <div className="mb-6">
      <p className="mb-4 text-sm font-medium text-foreground">이모지로 의견을 표현해주세요</p>
      <div className="flex flex-wrap justify-center gap-3">
        {options.map((option) => {
          const isSelected = selectedOption === option.id;
          // option.text contains the emoji + optional label like "😀 좋아요"
          const parts = option.text.split(" ");
          const emoji = parts[0] ?? "";
          const label = parts.slice(1).join(" ");

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              disabled={disabled}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 px-4 py-3 transition-all ${
                isSelected
                  ? "border-primary bg-primary/10 scale-110"
                  : "border-border hover:border-muted-foreground/30 hover:scale-105"
              }`}
            >
              <span className="text-3xl">{emoji}</span>
              {label && (
                <span
                  className={`text-[10px] font-medium ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                >
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {selectedOption && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          선택: {options.find((o) => o.id === selectedOption)?.text}
        </p>
      )}
    </div>
  );
}
