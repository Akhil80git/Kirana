import React from 'react';
import { TodoItem } from '../types/todo';
import { CheckCircle, ShoppingBag, ListTodo, CheckSquare } from 'lucide-react';

interface StatsOverviewProps {
  todos: TodoItem[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ todos }) => {
  let totalTasks = 0;
  let completedTasks = 0;
  let totalSamanPrice = 0;
  let boughtSamanPrice = 0;
  let remainingSamanPrice = 0;
  let samanItemCount = 0;

  todos.forEach(todo => {
    const isSaman = todo.type === 'saman';

    if (todo.subtasks && todo.subtasks.length > 0) {
      todo.subtasks.forEach(sub => {
        totalTasks += 1;
        if (sub.completed) completedTasks += 1;

        if (isSaman && sub.price !== undefined && sub.price > 0) {
          const cost = sub.price * (sub.quantity || 1);
          samanItemCount += 1;
          totalSamanPrice += cost;
          if (sub.completed) {
            boughtSamanPrice += cost;
          } else {
            remainingSamanPrice += cost;
          }
        }
      });
    } else {
      totalTasks += 1;
      if (todo.completed) completedTasks += 1;
    }
  });

  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-4">
      
      {/* 1. Total Lists */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">कुल लिस्ट (Total Lists)</span>
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <ListTodo className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {todos.length}
          </span>
          <span className="text-xs text-slate-400">
            ({totalTasks} आइटम्स)
          </span>
        </div>
      </div>

      {/* 2. Tasks Completed / Progress */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">प्रोग्रेस (Progress)</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
            {completionPercentage}%
          </span>
          <span className="text-xs text-slate-400">
            ({completedTasks}/{totalTasks} चेक)
          </span>
        </div>
        <div className="mt-2.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* 3. Total Saman Amount */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">कुल सामान राशि (Total)</span>
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
            ₹{totalSamanPrice.toLocaleString()}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-slate-400">
          <span>{samanItemCount} सामान की कुल कीमत</span>
        </div>
      </div>

      {/* 4. Bought vs Remaining breakdown */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-1">
          <span>सामान स्थिति (Status)</span>
        </div>
        <div className="mt-2 space-y-1 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-emerald-400">खरीदा गया (Paid):</span>
            <span className="font-bold text-white font-mono">₹{boughtSamanPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">बाकी (Pending):</span>
            <span className="font-bold text-white font-mono">₹{remainingSamanPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>

    </div>
  );
};
