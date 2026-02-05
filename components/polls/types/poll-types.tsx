"use client";

import React from "react";
import { useState } from "react";
import { Check, GripVertical, ChevronDown, ChevronUp } from "lucide-react";

// 투표 타입 정의
export type PollType =
  | "binary" // 양자택일 (기존)
  | "multiple" // 다지선다 (3개 이상 옵션 중 1개)
  | "checkbox" // 복수선택
  | "scale" // 척도/슬라이더
  | "ranking" // 순위 투표
  | "yesno" // 찬반 투표
  | "prediction"; // 예측 투표

export interface PollOption {
  id: string;
  label: string;
  percent?: number;
  color?: string;
}

interface BasePollProps {
  options: PollOption[];
  onVote: (value: string | string[] | number | Record<string, number>) => void;
  hasVoted: boolean;
  selectedValue?: string | string[] | number | Record<string, number>;
}

// 1. 다지선다 투표 (3개 이상 옵션 중 1개 선택)
export function MultiplePoll({ options, onVote, hasVoted, selectedValue }: BasePollProps) {
  const [selected, setSelected] = useState<string | null>((selectedValue as string) || null);

  const handleSelect = (optionId: string) => {
    if (hasVoted) return;
    setSelected(optionId);
    onVote(optionId);
  };

  return (
    <div className="space-y-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => handleSelect(option.id)}
          disabled={hasVoted}
          className={`w-full p-3 rounded-xl border text-left transition-all ${
            selected === option.id
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          } ${hasVoted ? "cursor-default" : "cursor-pointer"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  selected === option.id
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                }`}
              >
                {selected === option.id && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              <span
                className={`text-sm ${selected === option.id ? "font-medium text-foreground" : "text-foreground/80"}`}
              >
                {option.label}
              </span>
            </div>
            {hasVoted && option.percent !== undefined && (
              <span className="text-sm font-semibold" style={{ color: option.color }}>
                {option.percent}%
              </span>
            )}
          </div>
          {hasVoted && option.percent !== undefined && (
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${option.percent}%`, backgroundColor: option.color || "#3B82F6" }}
              />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// 2. 복수선택 투표 (여러 개 선택 가능)
export function CheckboxPoll({ options, onVote, hasVoted, selectedValue }: BasePollProps) {
  const [selected, setSelected] = useState<string[]>((selectedValue as string[]) || []);

  const handleToggle = (optionId: string) => {
    if (hasVoted) return;
    const newSelected = selected.includes(optionId)
      ? selected.filter((id) => id !== optionId)
      : [...selected, optionId];
    setSelected(newSelected);
  };

  const handleSubmit = () => {
    if (selected.length > 0) {
      onVote(selected);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">여러 개 선택 가능</p>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => handleToggle(option.id)}
          disabled={hasVoted}
          className={`w-full p-3 rounded-xl border text-left transition-all ${
            selected.includes(option.id)
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          } ${hasVoted ? "cursor-default" : "cursor-pointer"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                  selected.includes(option.id)
                    ? "bg-primary"
                    : "border-2 border-muted-foreground/30"
                }`}
              >
                {selected.includes(option.id) && (
                  <Check className="w-3 h-3 text-primary-foreground" />
                )}
              </div>
              <span
                className={`text-sm ${selected.includes(option.id) ? "font-medium text-foreground" : "text-foreground/80"}`}
              >
                {option.label}
              </span>
            </div>
            {hasVoted && option.percent !== undefined && (
              <span className="text-sm font-semibold" style={{ color: option.color }}>
                {option.percent}%
              </span>
            )}
          </div>
          {hasVoted && option.percent !== undefined && (
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${option.percent}%`, backgroundColor: option.color || "#3B82F6" }}
              />
            </div>
          )}
        </button>
      ))}
      {!hasVoted && selected.length > 0 && (
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-3 mt-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          선택 완료 ({selected.length}개)
        </button>
      )}
    </div>
  );
}

// 3. 척도/슬라이더 투표
interface ScalePollProps extends Omit<BasePollProps, "options"> {
  min?: number;
  max?: number;
  step?: number;
  labels?: { min: string; max: string };
  results?: { average: number; distribution: number[] };
}

export function ScalePoll({
  onVote,
  hasVoted,
  selectedValue,
  min = 1,
  max = 10,
  step = 1,
  labels = { min: "전혀 동의하지 않음", max: "매우 동의함" },
  results,
}: ScalePollProps) {
  const [value, setValue] = useState<number>(
    (selectedValue as number) || Math.floor((min + max) / 2)
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(Number(e.target.value));
  };

  const handleSubmit = () => {
    onVote(value);
  };

  const steps = Array.from({ length: (max - min) / step + 1 }, (_, i) => min + i * step);

  return (
    <div className="space-y-4">
      <div className="px-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={hasVoted}
          className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary disabled:cursor-default"
        />
        <div className="flex justify-between mt-2">
          {steps.map((s) => (
            <span
              key={s}
              className={`text-[10px] ${value === s ? "text-primary font-bold" : "text-muted-foreground"}`}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{labels.min}</span>
        <span>{labels.max}</span>
      </div>
      {!hasVoted && (
        <div className="text-center">
          <p className="text-2xl font-bold text-primary mb-3">{value}</p>
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            이 점수로 투표
          </button>
        </div>
      )}
      {hasVoted && results && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-2">평균 점수</p>
          <p className="text-3xl font-bold text-primary">{results.average.toFixed(1)}</p>
          <div className="flex items-end gap-1 mt-3 h-16">
            {results.distribution.map((count, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-primary/20 rounded-t"
                  style={{ height: `${(count / Math.max(...results.distribution)) * 100}%` }}
                />
                <span className="text-[9px] text-muted-foreground mt-1">{min + idx}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 4. 순위 투표 (드래그 앤 드롭)
export function RankingPoll({ options, onVote, hasVoted, selectedValue }: BasePollProps) {
  const [ranking, setRanking] = useState<string[]>(
    (selectedValue as string[]) || options.map((o) => o.id)
  );
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleDragStart = (optionId: string) => {
    if (hasVoted) return;
    setDraggedItem(optionId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId || hasVoted) return;

    const newRanking = [...ranking];
    const draggedIndex = newRanking.indexOf(draggedItem);
    const targetIndex = newRanking.indexOf(targetId);

    newRanking.splice(draggedIndex, 1);
    newRanking.splice(targetIndex, 0, draggedItem);
    setRanking(newRanking);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSubmit = () => {
    onVote(ranking);
  };

  const getOption = (id: string) => options.find((o) => o.id === id);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">드래그하여 순위를 정해주세요</p>
      {ranking.map((optionId, index) => {
        const option = getOption(optionId);
        if (!option) return null;
        return (
          <div
            key={option.id}
            draggable={!hasVoted}
            onDragStart={() => handleDragStart(option.id)}
            onDragOver={(e) => handleDragOver(e, option.id)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              draggedItem === option.id
                ? "border-primary bg-primary/10 opacity-50"
                : "border-border"
            } ${hasVoted ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
          >
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{index + 1}</span>
            </div>
            <span className="text-sm text-foreground flex-1">{option.label}</span>
            {!hasVoted && <GripVertical className="w-4 h-4 text-muted-foreground" />}
            {hasVoted && option.percent !== undefined && (
              <span className="text-sm font-semibold" style={{ color: option.color }}>
                {option.percent}점
              </span>
            )}
          </div>
        );
      })}
      {!hasVoted && (
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-3 mt-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          이 순위로 투표
        </button>
      )}
    </div>
  );
}

// 5. 찬반 투표
export function YesNoPoll({ options, onVote, hasVoted, selectedValue }: BasePollProps) {
  const yesOption = options[0];
  const noOption = options[1];

  const handleVote = (optionId: string) => {
    if (hasVoted) return;
    onVote(optionId);
  };

  return (
    <div className="space-y-3">
      {!hasVoted ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleVote(yesOption.id)}
            className="py-6 rounded-xl bg-emerald-500 text-white font-semibold text-base hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            {yesOption.label}
          </button>
          <button
            type="button"
            onClick={() => handleVote(noOption.id)}
            className="py-6 rounded-xl bg-rose-500 text-white font-semibold text-base hover:opacity-90 transition-opacity active:scale-[0.98]"
          >
            {noOption.label}
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-foreground">{yesOption.label}</span>
            <span className="text-sm font-bold text-emerald-500">{yesOption.percent}%</span>
          </div>
          <div className="relative h-8 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${yesOption.percent}%` }}
            />
            <div
              className="absolute right-0 top-0 h-full bg-rose-500 transition-all duration-500"
              style={{ width: `${noOption.percent}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow">
                {selectedValue === yesOption.id ? yesOption.label : noOption.label} 선택
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center mt-3">
            <span className="text-sm font-medium text-foreground">{noOption.label}</span>
            <span className="text-sm font-bold text-rose-500">{noOption.percent}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

// 6. 예측 투표
interface PredictionPollProps extends BasePollProps {
  deadline?: string;
  currentOdds?: Record<string, number>;
}

export function PredictionPoll({
  options,
  onVote,
  hasVoted,
  selectedValue,
  deadline = "경기 시작 전",
  currentOdds,
}: PredictionPollProps) {
  const [selected, setSelected] = useState<string | null>((selectedValue as string) || null);

  const handleSelect = (optionId: string) => {
    if (hasVoted) return;
    setSelected(optionId);
  };

  const handleSubmit = () => {
    if (selected) {
      onVote(selected);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>예측 마감: {deadline}</span>
        {currentOdds && <span>실시간 배당률</span>}
      </div>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleSelect(option.id)}
            disabled={hasVoted}
            className={`w-full p-4 rounded-xl border text-left transition-all ${
              selected === option.id
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            } ${hasVoted ? "cursor-default" : "cursor-pointer"}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    selected === option.id
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {selected === option.id && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <span
                  className={`text-sm ${selected === option.id ? "font-medium text-foreground" : "text-foreground/80"}`}
                >
                  {option.label}
                </span>
              </div>
              <div className="text-right">
                {currentOdds && currentOdds[option.id] && (
                  <span className="text-xs text-muted-foreground">
                    {(currentOdds[option.id] * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
            {hasVoted && option.percent !== undefined && (
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">예측 비율</span>
                  <span className="font-semibold" style={{ color: option.color }}>
                    {option.percent}%
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${option.percent}%`,
                      backgroundColor: option.color || "#3B82F6",
                    }}
                  />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
      {!hasVoted && selected && (
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          이 예측으로 참여
        </button>
      )}
    </div>
  );
}

// 7. 플로팅 투표 바 (하단에서 빠르게 투표)
interface FloatingVoteBarProps {
  pollType: PollType;
  options: PollOption[];
  onVote: (value: string | string[] | number | Record<string, number>) => void;
  scaleConfig?: {
    min?: number;
    max?: number;
    labels?: { min: string; max: string };
  };
}

export function FloatingVoteBar({ pollType, options, onVote, scaleConfig }: FloatingVoteBarProps) {
  const [scaleValue, setScaleValue] = useState(5);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [rankingOptions, setRankingOptions] = useState<string[]>(options.map((o) => o.id));

  const toggleOption = (optionId: string) => {
    setSelectedOptions((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
    );
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const newRanking = [...rankingOptions];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < newRanking.length) {
      [newRanking[index], newRanking[newIndex]] = [newRanking[newIndex], newRanking[index]];
      setRankingOptions(newRanking);
    }
  };

  const getOptionLabel = (id: string) => options.find((o) => o.id === id)?.label || id;

  // 양자택일 (binary)
  if (pollType === "binary") {
    return (
      <div className="px-4 py-3">
        <div className="flex gap-2">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onVote(option.id)}
              className="flex-1 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: option.color }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 찬반 (yesno)
  if (pollType === "yesno") {
    return (
      <div className="px-4 py-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onVote(options[0]?.id || "yes")}
            className="flex-1 py-3 rounded-xl font-semibold text-sm text-white bg-emerald-500 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            {options[0]?.label || "찬성"}
          </button>
          <button
            type="button"
            onClick={() => onVote(options[1]?.id || "no")}
            className="flex-1 py-3 rounded-xl font-semibold text-sm text-white bg-rose-500 hover:opacity-90 active:scale-[0.98] transition-all"
          >
            {options[1]?.label || "반대"}
          </button>
        </div>
      </div>
    );
  }

  // 다지선다 (multiple)
  if (pollType === "multiple") {
    return (
      <div className="px-4 py-2">
        <p className="text-[10px] text-muted-foreground mb-1.5">하나를 선택하세요</p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onVote(option.id)}
              className="flex-shrink-0 py-2 px-3 rounded-lg border border-border text-xs text-foreground hover:border-primary hover:bg-primary/5 transition-all whitespace-nowrap"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 복수선택 (checkbox)
  if (pollType === "checkbox") {
    return (
      <div className="px-4 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] text-muted-foreground">복수선택 가능</p>
          {selectedOptions.length > 0 && (
            <button
              type="button"
              onClick={() => onVote(selectedOptions)}
              className="text-xs font-semibold text-primary"
            >
              완료 ({selectedOptions.length})
            </button>
          )}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => toggleOption(option.id)}
              className={`flex-shrink-0 py-2 px-3 rounded-lg border text-xs transition-all whitespace-nowrap ${
                selectedOptions.includes(option.id)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-foreground hover:border-primary/50"
              }`}
            >
              {selectedOptions.includes(option.id) && <Check className="w-3 h-3 inline mr-1" />}
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 척도 (scale)
  if (pollType === "scale") {
    const min = scaleConfig?.min || 1;
    const max = scaleConfig?.max || 10;

    return (
      <div className="px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground w-12">
            {scaleConfig?.labels?.min || "최소"}
          </span>
          <input
            type="range"
            min={min}
            max={max}
            value={scaleValue}
            onChange={(e) => setScaleValue(Number(e.target.value))}
            className="flex-1 h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
          />
          <span className="text-[10px] text-muted-foreground w-12 text-right">
            {scaleConfig?.labels?.max || "최대"}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-lg font-bold text-primary">{scaleValue}점</span>
          <button
            type="button"
            onClick={() => onVote(scaleValue)}
            className="py-2 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90"
          >
            투표하기
          </button>
        </div>
      </div>
    );
  }

  // 순위 (ranking)
  if (pollType === "ranking") {
    return (
      <div className="px-4 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] text-muted-foreground">순위를 조정하세요</p>
          <button
            type="button"
            onClick={() => onVote(rankingOptions)}
            className="text-xs font-semibold text-primary"
          >
            완료
          </button>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {rankingOptions.map((optionId, index) => (
            <div
              key={optionId}
              className="flex-shrink-0 flex items-center gap-1 bg-muted/50 rounded-lg px-2 py-1.5"
            >
              <span className="text-[10px] font-bold text-primary">{index + 1}</span>
              <span className="text-xs text-foreground whitespace-nowrap">
                {getOptionLabel(optionId)}
              </span>
              <div className="flex">
                <button
                  type="button"
                  onClick={() => moveItem(index, "up")}
                  disabled={index === 0}
                  className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(index, "down")}
                  disabled={index === rankingOptions.length - 1}
                  className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 예측 (prediction)
  if (pollType === "prediction") {
    return (
      <div className="px-4 py-2">
        <p className="text-[10px] text-muted-foreground mb-1.5">예측할 항목을 선택하세요</p>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onVote(option.id)}
              className="flex-shrink-0 py-2 px-3 rounded-lg border border-border text-xs text-foreground hover:border-cyan-500 hover:bg-cyan-500/5 transition-all whitespace-nowrap"
            >
              {option.label}
              {option.percent && (
                <span className="text-[9px] text-muted-foreground ml-1">({option.percent}%)</span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 기본 fallback
  return (
    <div className="px-4 py-3">
      <p className="text-sm text-muted-foreground text-center">투표를 진행해주세요</p>
    </div>
  );
}
