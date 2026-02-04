"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import type { PollOption } from "@/lib/generated/prisma/client";

interface SliderInteractionProps {
  options: Pick<PollOption, "id" | "text" | "voteCount">[];
  sliderValue: number;
  onSliderChange: (value: number) => void;
  disabled: boolean;
}

export function SliderInteraction({
  options,
  sliderValue,
  onSliderChange,
  disabled,
}: SliderInteractionProps) {
  // First option = left label, second option = right label
  const leftLabel = options[0]?.text ?? "0";
  const rightLabel = options[1]?.text ?? "100";

  const getColor = (value: number) => {
    if (value <= 30) return "bg-blue-500";
    if (value <= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="mb-6">
      <p className="mb-4 text-sm font-medium text-foreground">
        슬라이더를 움직여 의견을 표현해주세요
      </p>

      <div className="rounded-2xl border border-border bg-muted/30 p-5">
        <div className="mb-6 flex justify-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full ${getColor(sliderValue)} text-xl font-bold text-white transition-colors`}
          >
            {sliderValue}
          </div>
        </div>

        <SliderPrimitive.Root
          className="relative flex h-5 w-full touch-none select-none items-center"
          value={[sliderValue]}
          onValueChange={([v]) => v !== undefined && onSliderChange(v)}
          max={100}
          step={1}
          disabled={disabled}
        >
          <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted">
            <SliderPrimitive.Range className="absolute h-full bg-primary" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
        </SliderPrimitive.Root>

        <div className="mt-2 flex justify-between">
          <span className="text-xs text-muted-foreground">{leftLabel}</span>
          <span className="text-xs text-muted-foreground">{rightLabel}</span>
        </div>
      </div>
    </div>
  );
}
