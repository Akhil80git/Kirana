import React from 'react';
import { SubTask } from '../types/todo';
import { Check } from 'lucide-react';

interface SubtaskItemProps {
  subtask: SubTask;
  isSamanType: boolean;
  onToggle: (id: string) => void;
}

export const SubtaskItem: React.FC<SubtaskItemProps> = ({
  subtask,
  isSamanType,
  onToggle,
}) => {
  const itemTotal = (subtask.price || 0) * (subtask.quantity || 1);

  return (
    <div 
      onClick={() => onToggle(subtask.id)}
      className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none active:scale-[0.99] ${
        subtask.completed 
          ? 'bg-zinc-950/40 border-zinc-800/60 opacity-60' 
          : 'bg-zinc-950/70 border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-900'
      }`}
    >
      {/* Left: Checkbox & Item Name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(subtask.id);
          }}
          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
            subtask.completed
              ? 'bg-zinc-100 text-zinc-950 font-black shadow-sm'
              : 'border border-zinc-600 bg-zinc-800/80 hover:border-zinc-400'
          }`}
          aria-label={subtask.completed ? 'Mark uncheck' : 'Mark check'}
        >
          {subtask.completed && <Check className="w-4 h-4 stroke-[3]" />}
        </button>

        <span className={`text-sm leading-snug transition-all truncate ${
          subtask.completed 
            ? 'line-through text-zinc-500 font-normal' 
            : 'text-zinc-100 font-medium'
        }`}>
          {subtask.title}
        </span>
      </div>

      {/* Right: Price & Quantity (For Saman / E-commerce lists) */}
      {isSamanType && (subtask.price !== undefined && subtask.price > 0) && (
        <div className="shrink-0 flex items-center gap-1.5 text-right font-mono">
          {subtask.quantity && subtask.quantity > 1 ? (
            <span className="text-[11px] text-zinc-400">
              {subtask.quantity}×₹{subtask.price} =
            </span>
          ) : null}
          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
            subtask.completed 
              ? 'text-zinc-500 line-through bg-zinc-900' 
              : 'text-white bg-zinc-800/90 border border-zinc-700/60'
          }`}>
            ₹{itemTotal.toLocaleString()}
          </span>
        </div>
      )}

    </div>
  );
};
