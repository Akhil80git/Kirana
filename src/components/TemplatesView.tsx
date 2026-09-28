import React from 'react';
import { TodoType } from '../types/todo';
import { ShoppingBag, ShoppingCart, CheckSquare, ArrowRight } from 'lucide-react';

interface TemplatesViewProps {
  onSelectType: (type: TodoType) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ onSelectType }) => {
  const options: {
    type: TodoType;
    title: string;
    description: string;
    icon: React.ReactNode;
    features: string[];
    btnText: string;
  }[] = [
    {
      type: 'saman',
      title: 'किराना & सामान लिस्ट (Saman)',
      description: 'घर का राशन, किराना सामान या बाजार की खरीदारी।',
      icon: <ShoppingBag className="w-5 h-5 text-zinc-200" />,
      features: ['हर सामान का नाम', 'कीमत (Price ₹) और मात्रा (Qty)', 'ऑटो कुल योग (Auto Total)'],
      btnText: '+ सामान लिस्ट जोड़ें',
    },
    {
      type: 'ecommerce',
      title: 'ई-कॉमर्स / ऑनलाइन शॉपिंग (E-Commerce)',
      description: 'Amazon, Flipkart या ऑनलाइन स्टोर्स से खरीदे जाने वाले प्रोडक्ट्स।',
      icon: <ShoppingCart className="w-5 h-5 text-zinc-200" />,
      features: ['प्रोडक्ट का नाम', 'फाइनल प्राइस ₹', 'खरीदने की कुल लिस्ट'],
      btnText: '+ ई-कॉमर्स लिस्ट जोड़ें',
    },
    {
      type: 'checklist',
      title: 'साधारण टास्क चेकलिस्ट (Todo Tasks)',
      description: 'दैनिक कार्य, जरूरी काम या ऑफिस के काम बिना किसी प्राइस के।',
      icon: <CheckSquare className="w-5 h-5 text-zinc-200" />,
      features: ['काम का नाम', 'क्लीन चेक / अनचेक', 'प्रोग्रेस ट्रैकर'],
      btnText: '+ टास्क चेकलिस्ट जोड़ें',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-4">
      
      {/* Header */}
      <div className="pb-1">
        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
          नयी लिस्ट का प्रकार चुनें
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          जिस तरह की लिस्ट बनानी हो, उस पर क्लिक करें।
        </p>
      </div>

      {/* 3 Clean Direct Add Cards (No yellow, no loud gradients) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {options.map(opt => (
          <div
            key={opt.type}
            onClick={() => onSelectType(opt.type)}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-150 cursor-pointer shadow-sm hover:shadow-md group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-3">
                {opt.icon}
              </div>

              <h3 className="text-sm font-bold text-white group-hover:text-zinc-200 transition-colors">
                {opt.title}
              </h3>

              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {opt.description}
              </p>

              <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-1.5 text-[11px] text-zinc-300">
                {opt.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800">
              <button
                type="button"
                className="w-full py-2 px-3 bg-zinc-800 group-hover:bg-zinc-100 group-hover:text-zinc-950 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>{opt.btnText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
