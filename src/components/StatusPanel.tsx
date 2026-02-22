import React from 'react';
import {
  LucideHeart, LucideSkull, LucideSparkles, LucideVolume2, LucideVolumeX,
} from 'lucide-react';
import { NIRVANA_GOAL } from '../constants';

interface StatusPanelProps {
  karma: number;
  merit: number;
  linesCleared: number;
  samsaraCount: number;
  isMuted: boolean;
  onUseMercy: () => void;
  onToggleMute: () => void;
}

const StatusPanel: React.FC<StatusPanelProps> = ({
  karma, merit, linesCleared, samsaraCount, isMuted, onUseMercy, onToggleMute,
}) => {
  return (
    <div className="space-y-5">
      <div className="bg-white/70 p-6 rounded-3xl border border-amber-200 backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-6xl font-black text-amber-700 tracking-tighter italic">禪-TRIS</h1>
          <button
            onClick={onToggleMute}
            className="p-2 rounded-full hover:bg-amber-100 transition-colors"
            title={isMuted ? '소리 켜기' : '소리 끄기'}
          >
            {isMuted
              ? <LucideVolumeX size={20} className="text-stone-400" />
              : <LucideVolume2 size={20} className="text-amber-600" />
            }
          </button>
        </div>
        <p className="text-stone-400 text-base mb-6 uppercase tracking-widest">Digital Samsara Simulator</p>

        <div className="space-y-5">
          <div>
            <div className="flex justify-between text-sm mb-1.5 text-stone-500 font-medium">
              <span>현생의 업보 (Karma)</span>
              <span className={karma > 80 ? 'text-red-500 animate-pulse font-bold' : ''}>{Math.floor(karma)}%</span>
            </div>
            <div className="h-3 bg-stone-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-700 rounded-full ${karma > 70 ? 'bg-red-500' : 'bg-amber-500'}`}
                style={{ width: `${karma}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1.5 text-stone-500 font-medium">
              <span>성불까지의 여정 ({linesCleared}/{NIRVANA_GOAL})</span>
              <span>{Math.floor((linesCleared / NIRVANA_GOAL) * 100)}%</span>
            </div>
            <div className="h-3 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                style={{ width: `${(linesCleared / NIRVANA_GOAL) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/70 p-5 rounded-2xl border border-amber-200 text-center shadow-md">
          <LucideSkull size={24} className="mx-auto mb-2 text-stone-400" />
          <div className="text-3xl font-black">{samsaraCount}</div>
          <div className="text-xs text-stone-400 uppercase font-semibold mt-1">윤회 횟수</div>
        </div>
        <div className="bg-white/70 p-5 rounded-2xl border border-amber-200 text-center shadow-md">
          <LucideSparkles size={24} className="mx-auto mb-2 text-amber-500" />
          <div className="text-3xl font-black text-amber-600">{merit}</div>
          <div className="text-xs text-stone-400 uppercase font-semibold mt-1">누적 공덕</div>
        </div>
      </div>

      <button
        onClick={onUseMercy}
        disabled={merit < 300}
        className={`w-full py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg ${
          merit >= 300
            ? 'bg-amber-600 hover:bg-amber-500 text-white'
            : 'bg-stone-200 text-stone-400 cursor-not-allowed'
        }`}
      >
        <LucideHeart size={22} /> 자비의 손길 (300 공덕)
      </button>
    </div>
  );
};

export default StatusPanel;
