import React from 'react';
import { LucideShield } from 'lucide-react';
import { GUARDIANS } from '../constants';

interface LorePanelProps {
  activeGuardian: string | null;
}

const LorePanel: React.FC<LorePanelProps> = ({ activeGuardian }) => {
  return (
    <div className="space-y-5">
      <div className="bg-white/70 p-6 rounded-3xl border border-amber-200 shadow-lg">
        <h3 className="text-stone-500 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
          <LucideShield size={18} /> 사천왕의 가호 (4줄 제거 시)
        </h3>
        <div className="space-y-3">
          {Object.entries(GUARDIANS).map(([key, g]) => (
            <div
              key={key}
              className={`flex gap-3 p-3 rounded-xl border transition-all ${
                activeGuardian === key
                  ? 'bg-amber-100 border-amber-500 scale-105 shadow-lg'
                  : 'border-transparent opacity-50'
              }`}
            >
              <div className="mt-0.5">{g.icon}</div>
              <div>
                <div className="text-base font-bold text-stone-700">{g.name}</div>
                <div className="text-xs text-stone-400 leading-snug">{g.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 italic text-stone-500 text-sm leading-relaxed space-y-3 shadow-md">
        <p>"블록은 번뇌요, 비움은 깨달음이라."</p>
        <p>"채울수록 고통(Karma)은 가중되며, 108번뇌를 지우는 자만이 생사윤회의 굴레를 벗어날 수 있느니라."</p>
      </div>
    </div>
  );
};

export default LorePanel;
