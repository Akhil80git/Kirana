import React, { useState } from 'react';
import { TodoItem } from '../types/todo';
import { SubtaskItem } from './SubtaskItem';
import { formatCardDateTime } from '../lib/dateUtils';
import confetti from 'canvas-confetti';
import { 
  Check, 
  MoreHorizontal, 
  Share2, 
  Trash2, 
  Edit3, 
  ShoppingBag, 
  CheckSquare, 
  ShoppingCart,
  Clock
} from 'lucide-react';

interface TodoCardProps {
  todo: TodoItem;
  onUpdate: (updated: TodoItem) => void;
  onDelete: (id: string) => void;
  onEdit: (todo: TodoItem) => void;
  onShare: (todo: TodoItem) => void;
}

export const TodoCard: React.FC<TodoCardProps> = ({
  todo,
  onUpdate,
  onDelete,
  onEdit,
  onShare,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isSamanType = todo.type === 'saman' || todo.type === 'ecommerce';
  const { formatted: dateStr, isToday: cardIsToday } = formatCardDateTime(todo.createdAt);

  // Subtask calculations
  const totalSubtasks = todo.subtasks?.length || 0;
  const completedSubtasks = todo.subtasks?.filter(s => s.completed).length || 0;
  const progressPercent = totalSubtasks > 0 
    ? Math.round((completedSubtasks / totalSubtasks) * 100) 
    : (todo.completed ? 100 : 0);

  // Price calculations for Saman lists
  let grandTotal = 0;
  let boughtTotal = 0;
  let remainingTotal = 0;

  if (isSamanType && todo.subtasks) {
    todo.subtasks.forEach(s => {
      const itemCost = (s.price || 0) * (s.quantity || 1);
      grandTotal += itemCost;
      if (s.completed) {
        boughtTotal += itemCost;
      } else {
        remainingTotal += itemCost;
      }
    });
  }

  // Fast check/uncheck for individual subtask
  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = (todo.subtasks || []).map(s => {
      if (s.id === subtaskId) {
        return { ...s, completed: !s.completed };
      }
      return s;
    });

    const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(s => s.completed);

    if (allCompleted && !todo.completed) {
      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
        });
      } catch {
        // ignore
      }
    }

    onUpdate({
      ...todo,
      subtasks: updatedSubtasks,
      completed: allCompleted,
      updatedAt: Date.now(),
    });
  };

  // Fast check/uncheck for entire list
  const handleToggleAll = () => {
    const nextCompleted = !todo.completed;
    const updatedSubtasks = (todo.subtasks || []).map(s => ({
      ...s,
      completed: nextCompleted,
    }));

    onUpdate({
      ...todo,
      completed: nextCompleted,
      subtasks: updatedSubtasks,
      updatedAt: Date.now(),
    });
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden transition-all duration-200 flex flex-col bg-zinc-900 border ${
      cardIsToday 
        ? 'border-zinc-600 ring-1 ring-zinc-500/40 shadow-lg' 
        : 'border-zinc-800/90 shadow-sm hover:border-zinc-700'
    } ${todo.completed ? 'opacity-65' : ''}`}>

      {/* Today High-Visibility Header Tag (Clean & Non-garish) */}
      {cardIsToday && (
        <div className="bg-zinc-800/80 border-b border-zinc-700/60 px-3.5 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-zinc-100 font-bold text-xs tracking-tight">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>आज का काम (Today's Focus)</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-700/50">
            आज
          </span>
        </div>
      )}

      {/* Main Header Area */}
      <div className="p-4 pb-2.5">
        <div className="flex items-start justify-between gap-3">
          
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Master Check / Uncheck Box */}
            <button
              type="button"
              onClick={handleToggleAll}
              className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                todo.completed
                  ? 'bg-zinc-100 text-zinc-950 font-black shadow-sm'
                  : 'border border-zinc-600 bg-zinc-800/80 hover:border-zinc-400'
              }`}
              title={todo.completed ? 'Mark uncheck' : 'Mark check'}
              aria-label="Toggle entire list"
            >
              {todo.completed && <Check className="w-4 h-4 stroke-[3]" />}
            </button>

            <div className="min-w-0 flex-1">
              {/* Type & Real Date/Time Row */}
              <div className="flex items-center gap-2 flex-wrap mb-1 text-[11px]">
                <span className="inline-flex items-center gap-1 text-zinc-400 font-medium">
                  {todo.type === 'ecommerce' ? (
                    <>
                      <ShoppingCart className="w-3.5 h-3.5 text-zinc-400" />
                      <span>ई-कॉमर्स</span>
                    </>
                  ) : isSamanType ? (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5 text-zinc-400" />
                      <span>सामान</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-zinc-400" />
                      <span>टास्क</span>
                    </>
                  )}
                </span>

                <span className="text-zinc-600">·</span>

                {/* Real Date & Time Display */}
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-zinc-400 bg-zinc-950/80 px-1.5 py-0.5 rounded border border-zinc-800">
                  <Clock className="w-2.5 h-2.5 text-zinc-500" />
                  <span>{dateStr}</span>
                </span>
              </div>

              {/* Title */}
              <h3 className={`text-base font-bold tracking-tight transition-all leading-snug ${
                todo.completed ? 'line-through text-zinc-500' : 'text-zinc-100'
              }`}>
                {todo.title}
              </h3>
            </div>
          </div>

          {/* Minimal 3-dots Menu for Edit / Delete */}
          <div className="relative shrink-0 flex items-center">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              title="Options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-20"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-8 z-30 w-36 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 text-xs text-zinc-200">
                  <button
                    onClick={() => { setMenuOpen(false); onEdit(todo); }}
                    className="w-full text-left px-3 py-2 hover:bg-zinc-800 flex items-center gap-2 text-zinc-200"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>बदलें (Edit)</span>
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); onShare(todo); }}
                    className="w-full text-left px-3 py-2 hover:bg-zinc-800 flex items-center gap-2 text-zinc-200"
                  >
                    <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>शेयर (Share)</span>
                  </button>
                  <div className="my-1 border-t border-zinc-800" />
                  <button
                    onClick={() => { setMenuOpen(false); onDelete(todo.id); }}
                    className="w-full text-left px-3 py-2 hover:bg-rose-500/10 text-rose-400 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>हटाएं (Delete)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-2.5 w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-300 bg-zinc-400"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Items Area (Pure Check / Uncheck) */}
      <div className="px-4 py-2 space-y-1.5 flex-1 overflow-y-auto max-h-72">
        {todo.subtasks && todo.subtasks.length > 0 ? (
          todo.subtasks.map(subtask => (
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              isSamanType={isSamanType}
              onToggle={handleToggleSubtask}
            />
          ))
        ) : (
          <div className="py-4 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
            <span>कोई आइटम नहीं है</span>
          </div>
        )}
      </div>

      {/* Bottom Summary Bar */}
      <div className="p-3 bg-zinc-950/70 border-t border-zinc-800/80 mt-auto">
        {isSamanType ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">
                कुल सामान (Total):
              </span>
              <span className="text-base font-extrabold text-white font-mono">
                ₹{grandTotal.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5 border-t border-zinc-900">
              <span className="text-zinc-300">
                लिया गया: ₹{boughtTotal.toLocaleString()}
              </span>
              <span className="text-zinc-400">
                बाकी: ₹{remainingTotal.toLocaleString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>
              {completedSubtasks} of {totalSubtasks} पूरे
            </span>
            <span className="font-bold text-zinc-200 font-mono">
              {progressPercent}%
            </span>
          </div>
        )}
      </div>

    </div>
  );
};
