import React, { useState } from 'react';
import { TodoItem } from '../types/todo';
import { Share2, Copy, Check, X, MessageSquare } from 'lucide-react';

interface ShareListModalProps {
  isOpen: boolean;
  onClose: () => void;
  todo: TodoItem | null;
}

export const ShareListModal: React.FC<ShareListModalProps> = ({
  isOpen,
  onClose,
  todo,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !todo) return null;

  const isSaman = todo.type === 'saman';
  let grandTotal = 0;

  const itemsText = (todo.subtasks || []).map((s, idx) => {
    const statusIcon = s.completed ? '✅' : '⬜';
    if (isSaman && s.price !== undefined && s.price > 0) {
      const subtotal = s.price * (s.quantity || 1);
      grandTotal += subtotal;
      const qtyText = s.quantity && s.quantity > 1 ? `(${s.quantity}x ₹${s.price} = ₹${subtotal})` : `(₹${subtotal})`;
      return `${statusIcon} ${idx + 1}. ${s.title} ${qtyText}`;
    }
    return `${statusIcon} ${idx + 1}. ${s.title}`;
  }).join('\n');

  const totalSummary = isSaman && grandTotal > 0 ? `\n💰 *कुल राशि (Total Amount): ₹${grandTotal.toLocaleString()}*` : '';
  const shareText = `📋 *${todo.title}*\n\n${itemsText || 'कोई आइटम नहीं'}\n${totalSummary}\n\nShared via TaskFlow Pro`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Share2 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">लिस्ट शेयर करें (Share List)</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-300">संदेश प्रिव्यू (Preview):</span>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 whitespace-pre-wrap max-h-56 overflow-y-auto">
              {shareText}
            </pre>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopy}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'कॉपी हो गया!' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handleWhatsApp}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp पर भेजें</span>
            </button>
          </div>
        </div>

        <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-400 hover:text-white"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
