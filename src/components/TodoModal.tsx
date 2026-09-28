import React, { useState, useEffect, useRef } from 'react';
import { TodoItem, SubTask, TodoType } from '../types/todo';
import { 
  X, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  ShoppingCart, 
  CheckSquare, 
  Minus, 
  Check, 
  Edit2
} from 'lucide-react';

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (todo: TodoItem) => void;
  initialTodo?: TodoItem | null;
  defaultType?: TodoType;
  userId: string;
}

export const TodoModal: React.FC<TodoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTodo,
  defaultType = 'saman',
  userId,
}) => {
  const [title, setTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [type, setType] = useState<TodoType>(defaultType);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);

  // Item Draft Fields
  const [itemTitle, setItemTitle] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQty, setItemQty] = useState('1');

  // Input ref to keep mobile keyboard open seamlessly without viewport jumping
  const itemTitleInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialTodo) {
      setTitle(initialTodo.title);
      setType(initialTodo.type || 'saman');
      setSubtasks(initialTodo.subtasks || []);
      setIsEditingTitle(false);
    } else {
      const defaultTitle = defaultType === 'ecommerce' 
        ? 'ऑनलाइन शॉपिंग' 
        : defaultType === 'saman' 
        ? 'किराना सामान लिस्ट' 
        : 'दैनिक कार्य';
      
      setTitle(defaultTitle);
      setType(defaultType);
      setSubtasks([]);
      setIsEditingTitle(false);
    }
    setItemTitle('');
    setItemPrice('');
    setItemQty('1');
  }, [initialTodo, defaultType, isOpen]);

  // Focus item input automatically on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        itemTitleInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isPriced = type === 'saman' || type === 'ecommerce';
  const liveTotal = subtasks.reduce((sum, s) => sum + (s.price || 0) * (s.quantity || 1), 0);

  // Stepper handlers for quantity
  const handleQtyDec = () => {
    const q = Math.max(1, (parseInt(itemQty, 10) || 1) - 1);
    setItemQty(String(q));
    itemTitleInputRef.current?.focus();
  };

  const handleQtyInc = () => {
    const q = (parseInt(itemQty, 10) || 1) + 1;
    setItemQty(String(q));
    itemTitleInputRef.current?.focus();
  };

  // Add Item to list without any viewport jitter or screen jumping
  const handleAddItem = (e?: React.FormEvent | React.MouseEvent | React.TouchEvent) => {
    if (e) e.preventDefault();
    if (!itemTitle.trim()) {
      itemTitleInputRef.current?.focus();
      return;
    }

    const numPrice = isPriced && itemPrice.trim() !== '' ? Math.max(0, parseFloat(itemPrice)) : undefined;
    const numQty = isPriced && itemQty.trim() !== '' ? Math.max(1, parseInt(itemQty, 10)) : 1;

    const newItem: SubTask = {
      id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: itemTitle.trim(),
      completed: false,
      price: isNaN(Number(numPrice)) ? undefined : numPrice,
      quantity: isNaN(Number(numQty)) ? 1 : numQty,
      createdAt: Date.now(),
    };

    setSubtasks(prev => [...prev, newItem]);
    setItemTitle('');
    setItemPrice('');
    setItemQty('1');

    // Smoothly scroll ONLY the internal list container to bottom (NO scrollIntoView, NO screen shift)
    requestAnimationFrame(() => {
      if (listContainerRef.current) {
        listContainerRef.current.scrollTop = listContainerRef.current.scrollHeight;
      }
      itemTitleInputRef.current?.focus();
    });
  };

  const handleRemoveItem = (id: string) => {
    setSubtasks(prev => prev.filter(s => s.id !== id));
    requestAnimationFrame(() => {
      itemTitleInputRef.current?.focus();
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const now = Date.now();
    const todoData: TodoItem = {
      id: initialTodo ? initialTodo.id : 'todo_' + now + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      title: title.trim(),
      color: 'emerald',
      type,
      priority: 'medium',
      completed: initialTodo ? initialTodo.completed : false,
      category: isPriced ? (type === 'ecommerce' ? 'ई-कॉमर्स' : 'सामान') : 'कार्य',
      subtasks,
      createdAt: initialTodo ? initialTodo.createdAt : now,
      updatedAt: now,
    };

    onSave(todoData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/80 backdrop-blur-sm sm:p-4 animate-in fade-in duration-150">
      
      {/* Modal Container: Solid frame, stable layout, zero viewport bounce */}
      <div 
        className="w-full sm:max-w-xl bg-zinc-900 border-t sm:border border-zinc-800 sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col h-[90dvh] sm:h-auto sm:max-h-[85vh] text-zinc-100 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        
        {/* 1. Header Bar */}
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0 gap-2">
          
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors shrink-0"
              title="बंद करें"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title */}
            <div className="min-w-0 flex-1">
              {isEditingTitle ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyDown={e => { if (e.key === 'Enter') setIsEditingTitle(false); }}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none w-full font-bold"
                    autoFocus
                  />
                  <button 
                    type="button" 
                    onClick={() => setIsEditingTitle(false)}
                    className="p-1 text-zinc-300"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => setIsEditingTitle(true)}
                  className="flex items-center gap-1.5 cursor-pointer group truncate"
                  title="नाम बदलने के लिए टैप करें"
                >
                  <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                    {title}
                  </h2>
                  <Edit2 className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 shrink-0" />
                </div>
              )}
            </div>
          </div>

          {/* Right: Live Total & Save Button */}
          <div className="flex items-center gap-2 shrink-0">
            {isPriced && (
              <div className="flex items-baseline gap-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg">
                <span className="text-[10px] text-zinc-400 font-sans">कुल:</span>
                <span className="text-xs sm:text-sm font-bold text-white font-mono">
                  ₹{liveTotal.toLocaleString()}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white active:scale-95 text-zinc-950 font-bold rounded-xl text-xs transition-transform shadow-sm shrink-0"
            >
              सेव करें
            </button>
          </div>

        </div>

        {/* 2. Type Selector Tabs */}
        <div className="px-4 py-1.5 bg-zinc-950/70 border-b border-zinc-800 flex items-center justify-between gap-1 shrink-0">
          <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setType('saman');
                if (!initialTodo && title.includes('कार्य')) setTitle('किराना सामान लिस्ट');
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all ${
                type === 'saman' ? 'bg-zinc-100 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3 h-3" />
              <span>किराना/सामान</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('ecommerce');
                if (!initialTodo && !title.includes('शॉपिंग')) setTitle('ऑनलाइन शॉपिंग');
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all ${
                type === 'ecommerce' ? 'bg-zinc-100 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ShoppingCart className="w-3 h-3" />
              <span>ई-कॉमर्स</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('checklist');
                if (!initialTodo && !title.includes('कार्य')) setTitle('दैनिक कार्य');
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all ${
                type === 'checklist' ? 'bg-zinc-100 text-zinc-950 shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <CheckSquare className="w-3 h-3" />
              <span>टास्क</span>
            </button>
          </div>

          <span className="text-[11px] text-zinc-400 font-mono font-medium">
            {subtasks.length} आइटम्स
          </span>
        </div>

        {/* 3. Middle Scrollable Items Area (Smooth container-only scroll, NO page jump) */}
        <div 
          ref={listContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-1.5"
        >
          {subtasks.length > 0 ? (
            <div className="space-y-1.5 pb-2">
              {subtasks.map((s, idx) => {
                const subtotal = (s.price || 0) * (s.quantity || 1);
                return (
                  <div 
                    key={s.id || idx} 
                    className="flex items-center justify-between gap-2 p-2.5 bg-zinc-950 border border-zinc-800/90 rounded-xl text-xs hover:border-zinc-700 transition-colors"
                  >
                    {/* Index + Title */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-[11px] font-mono text-zinc-500 w-4 shrink-0 text-right">
                        {idx + 1}.
                      </span>
                      <span className="text-zinc-100 font-medium truncate">
                        {s.title}
                      </span>
                    </div>

                    {/* Price and Calculation Badge */}
                    {isPriced && s.price !== undefined && (
                      <div className="font-mono text-xs text-right shrink-0 flex items-center gap-1">
                        {s.quantity && s.quantity > 1 ? (
                          <span className="text-[11px] text-zinc-400">
                            {s.quantity}×₹{s.price} =
                          </span>
                        ) : null}
                        <span className="text-white font-bold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
                          ₹{subtotal.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Delete Item */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(s.id)}
                      className="p-1 text-zinc-400 hover:text-rose-400 transition-colors shrink-0 ml-1"
                      title="हटाएं"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-center p-4">
              <div className="w-9 h-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-2">
                {isPriced ? <ShoppingBag className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
              </div>
              <p className="text-xs font-semibold text-zinc-300">
                {isPriced ? 'सामान की लिस्ट अभी खाली है' : 'टास्क लिस्ट अभी खाली है'}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                नीचे नाम और कीमत डालकर लगातार जोड़ते जाएं
              </p>
            </div>
          )}
        </div>

        {/* 4. Fixed Bottom Input Bar: Perfectly stable, anchored above keyboard */}
        <div className="shrink-0 bg-zinc-950 border-t border-zinc-800 p-2.5 sm:p-3">
          
          <form 
            onSubmit={handleAddItem}
            className="space-y-2 max-w-2xl mx-auto"
          >
            {/* Product Name input */}
            <div>
              <input
                ref={itemTitleInputRef}
                type="text"
                value={itemTitle}
                onChange={e => setItemTitle(e.target.value)}
                placeholder={isPriced ? "सामान का नाम (e.g. आटा 5kg, तेल 1L, चीनी)..." : "टास्क का नाम..."}
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400"
              />
            </div>

            {/* Price + Quantity Stepper + Add Button */}
            <div className="flex items-center gap-2">
              
              {/* Price input */}
              {isPriced && (
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-2 text-xs text-zinc-400 font-mono">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={itemPrice}
                    onChange={e => setItemPrice(e.target.value)}
                    placeholder="कीमत"
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-6 pr-2 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 font-mono"
                  />
                </div>
              )}

              {/* Quantity Stepper */}
              {isPriced && (
                <div className="flex items-center bg-zinc-900 border border-zinc-700/80 rounded-xl p-0.5 shrink-0">
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onTouchStart={e => e.preventDefault()}
                    onClick={handleQtyDec}
                    className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-white active:bg-zinc-800 rounded-lg text-xs"
                    title="मात्रा कम करें"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>

                  <input
                    type="number"
                    min="1"
                    value={itemQty}
                    onChange={e => setItemQty(e.target.value)}
                    className="w-8 bg-transparent text-center text-xs font-mono font-bold text-white focus:outline-none"
                    title="मात्रा (Quantity)"
                  />

                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onTouchStart={e => e.preventDefault()}
                    onClick={handleQtyInc}
                    className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-white active:bg-zinc-800 rounded-lg text-xs"
                    title="मात्रा बढ़ाएं"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Add Button - Prevents virtual keyboard blur on mobile */}
              <button
                type="submit"
                onMouseDown={e => e.preventDefault()}
                onTouchStart={e => e.preventDefault()}
                className="px-4 py-2 bg-zinc-100 hover:bg-white active:scale-95 text-zinc-950 font-bold rounded-xl text-xs sm:text-sm transition-transform flex items-center justify-center gap-1 shrink-0 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>जोड़ें</span>
              </button>

            </div>

            {/* Helper micro-text */}
            <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
              <span>Enter दबाएं या 'जोड़ें' दबाएं (कीबोर्ड खुला रहेगा)</span>
              {isPriced && liveTotal > 0 && (
                <span className="font-mono text-zinc-300">
                  टोटल: ₹{liveTotal.toLocaleString()}
                </span>
              )}
            </div>

          </form>

        </div>

      </div>
    </div>
  );
};
