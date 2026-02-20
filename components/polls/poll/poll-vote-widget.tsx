"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  SingleChoiceInteraction,
  BinaryInteraction,
  MultipleChoiceInteraction,
  SliderInteraction,
  RankingInteraction,
} from "@/components/polls/poll/interactions";
import type { PollWithDetails } from "@/app/actions/polls/queries";

interface PollVoteWidgetProps {
  poll: PollWithDetails;
  onVote: (value: string | string[] | number | Record<string, number>) => void;
  disabled?: boolean;
}

export function PollVoteWidget({ poll, onVote, disabled = false }: PollVoteWidgetProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [sliderValue, setSliderValue] = useState(50);
  const [ranking, setRanking] = useState<string[]>(
    poll.options.sort((a, b) => a.order - b.order).map((o) => o.id)
  );

  const options = poll.options
    .sort((a, b) => a.order - b.order)
    .map((o) => ({ id: o.id, text: o.text, voteCount: o.voteCount }));

  const interactionType = poll.interactionType;

  const handleSubmit = () => {
    switch (interactionType) {
      case "BINARY":
      case "SINGLE_CHOICE":
      case "YES_NO":
        if (selectedOption) onVote(selectedOption);
        break;
      case "MULTIPLE_CHOICE":
        if (selectedOptions.length > 0) onVote(selectedOptions);
        break;
      case "SLIDER":
        onVote(sliderValue);
        break;
      case "RANKING":
        onVote(ranking);
        break;
      case "EMOJI_REACTION":
        if (selectedOption) onVote(selectedOption);
        break;
      default:
        if (selectedOption) onVote(selectedOption);
    }
  };

  const canSubmit = () => {
    switch (interactionType) {
      case "BINARY":
      case "SINGLE_CHOICE":
      case "YES_NO":
      case "EMOJI_REACTION":
        return !!selectedOption;
      case "MULTIPLE_CHOICE":
        return selectedOptions.length > 0;
      case "SLIDER":
      case "RANKING":
        return true;
      default:
        return !!selectedOption;
    }
  };

  const handleSingleSelect = (optionId: string) => {
    setSelectedOption(optionId);
    // For binary, vote immediately on selection
    if (interactionType === "BINARY" || interactionType === "YES_NO") {
      onVote(optionId);
    }
  };

  const handleMultiToggle = (optionId: string) => {
    setSelectedOptions((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
    );
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">투표하기</h3>

      {(interactionType === "BINARY" || interactionType === "YES_NO") && (
        <BinaryInteraction
          options={options}
          selectedOption={selectedOption}
          onSelect={handleSingleSelect}
          disabled={disabled}
        />
      )}

      {interactionType === "SINGLE_CHOICE" && (
        <>
          <SingleChoiceInteraction
            options={options}
            selectedOption={selectedOption}
            onSelect={setSelectedOption}
            disabled={disabled}
          />
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit() || disabled}
            className="w-full mt-2"
          >
            투표하기
          </Button>
        </>
      )}

      {interactionType === "MULTIPLE_CHOICE" && (
        <>
          <MultipleChoiceInteraction
            options={options}
            selectedOptions={selectedOptions}
            onToggle={handleMultiToggle}
            disabled={disabled}
          />
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit() || disabled}
            className="w-full mt-2"
          >
            투표하기 ({selectedOptions.length}개 선택)
          </Button>
        </>
      )}

      {interactionType === "SLIDER" && (
        <>
          <SliderInteraction
            options={options}
            sliderValue={sliderValue}
            onSliderChange={setSliderValue}
            disabled={disabled}
          />
          <Button onClick={handleSubmit} disabled={disabled} className="w-full mt-2">
            {sliderValue}점으로 투표하기
          </Button>
        </>
      )}

      {interactionType === "RANKING" && (
        <>
          <RankingInteraction
            options={options}
            ranking={ranking}
            onRankingChange={setRanking}
            disabled={disabled}
          />
          <Button onClick={handleSubmit} disabled={disabled} className="w-full mt-2">
            이 순위로 투표하기
          </Button>
        </>
      )}

      {interactionType === "EMOJI_REACTION" && (
        <>
          <SingleChoiceInteraction
            options={options}
            selectedOption={selectedOption}
            onSelect={setSelectedOption}
            disabled={disabled}
          />
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit() || disabled}
            className="w-full mt-2"
          >
            투표하기
          </Button>
        </>
      )}
    </div>
  );
}
