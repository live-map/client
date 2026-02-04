"use client";

import { useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { PollOption } from "@/lib/generated/prisma/client";

const RANK_COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"];

interface RankingInteractionProps {
  options: Pick<PollOption, "id" | "text" | "voteCount">[];
  ranking: string[];
  onRankingChange: (ranking: string[]) => void;
  disabled: boolean;
}

function SortableItem({ id, rank, text }: { id: string; rank: number; text: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const color = RANK_COLORS[(rank - 1) % RANK_COLORS.length]!;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-xl border-2 border-border bg-card p-3 transition-shadow ${
        isDragging ? "z-10 shadow-lg border-primary/50" : ""
      }`}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {rank}
      </div>
      <p className="flex-1 font-medium text-foreground">{text}</p>
    </div>
  );
}

export function RankingInteraction({ options, ranking, onRankingChange }: RankingInteractionProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = ranking.indexOf(active.id as string);
      const newIndex = ranking.indexOf(over.id as string);
      onRankingChange(arrayMove(ranking, oldIndex, newIndex));
    },
    [ranking, onRankingChange]
  );

  const optionMap = new Map(options.map((o) => [o.id, o]));

  return (
    <div className="mb-6">
      <p className="mb-3 text-sm font-medium text-foreground">
        드래그하여 순위를 매겨주세요
        <span className="ml-1 text-xs text-muted-foreground">(위가 1순위)</span>
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ranking} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {ranking.map((id, index) => {
              const option = optionMap.get(id);
              if (!option) return null;
              return <SortableItem key={id} id={id} rank={index + 1} text={option.text} />;
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
