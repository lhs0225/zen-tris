import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideSun, LucideSkull, LucideRefreshCw } from 'lucide-react';

interface GameOverlayProps {
  gameOver: boolean;
  isNirvana: boolean;
  samsaraCount: number;
  onReset: () => void;
}

const GameOverlay: React.FC<GameOverlayProps> = ({ gameOver, isNirvana, samsaraCount, onReset }) => {
  const showOverlay = gameOver || isNirvana;

  return (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 bg-amber-50/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-8 z-30"
        >
          {isNirvana ? (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              <motion.div
                className="w-24 h-24 bg-yellow-400 rounded-full blur-2xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <LucideSun size={80} className="text-amber-500 mb-6 relative" />
              </motion.div>
              <h2 className="text-4xl font-black mb-4 text-amber-600 tracking-tighter">아뇩다라삼먁삼보리</h2>
              <p className="mb-8 text-stone-500 text-base leading-relaxed">
                모든 번뇌의 사슬을 끊고<br />영원한 자유(Empty)에 이르렀습니다.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <LucideSkull size={64} className="text-red-600 mb-6 mx-auto" />
              </motion.div>
              <h2 className="text-4xl font-black mb-4 text-red-600 tracking-tighter">제행무상 (諸行無常)</h2>
              <p className="mb-4 text-stone-500 text-base leading-relaxed">
                세상의 모든 것은 변하나니<br />쌓인 업보를 내려놓고 다시 태어나소서.
              </p>
              <p className="mb-8 text-stone-400 text-sm">
                윤회 {samsaraCount}회 경험
              </p>
            </motion.div>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReset}
            className="bg-stone-800 text-white px-8 py-3 rounded-full text-lg font-black flex items-center gap-2"
          >
            <LucideRefreshCw size={20} /> 정토로 돌아가기
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameOverlay;
