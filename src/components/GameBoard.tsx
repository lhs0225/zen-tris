import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameCell from './GameCell';
import type { GameState } from '../types/game';
import { COLS, ROWS } from '../constants';

interface GameBoardProps {
  state: GameState;
  onLinesClearComplete: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ state, onLinesClearComplete }) => {
  const { grid, rowIds, activePiece, karma, clearingRows } = state;

  // 카르마 시각 필터
  const karmaFilter: React.CSSProperties = {
    filter: `sepia(${karma * 0.5}%) hue-rotate(${karma * 0.7}deg) contrast(${100 + karma * 0.5}%)`,
  };

  // 셀 색상 계산 (활성 피스 오버레이)
  const getCellColor = (x: number, y: number) => {
    let color = grid[y][x] || 'bg-amber-50/40';
    if (activePiece) {
      const { pos, shape, color: activeColor } = activePiece;
      if (
        y >= pos.y && y < pos.y + shape.length &&
        x >= pos.x && x < pos.x + shape[0].length
      ) {
        if (shape[y - pos.y][x - pos.x]) color = activeColor;
      }
    }
    return color;
  };

  return (
    <div className="p-1.5 bg-amber-100 rounded-2xl border-4 border-amber-200 shadow-[0_8px_40px_rgba(180,140,60,0.2)] relative overflow-hidden">
      {/* 카르마 흔들림 효과 */}
      <motion.div
        animate={{
          x: karma > 85 ? [0, -2, 2, -1, 1, 0] : 0,
          y: karma > 85 ? [0, 1, -1, 2, -2, 0] : 0,
        }}
        transition={{
          x: { repeat: Infinity, duration: 0.3, ease: 'easeInOut' },
          y: { repeat: Infinity, duration: 0.25, ease: 'easeInOut' },
        }}
        className="grid gap-px bg-amber-200/50"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
          width: 'min(360px, 45vw)',
          aspectRatio: '1 / 2',
          ...karmaFilter,
        }}
      >
        <AnimatePresence
          mode="popLayout"
          onExitComplete={onLinesClearComplete}
        >
          {grid.map((row, y) => (
            <motion.div
              key={rowIds[y]}
              className="contents"
              initial={false}
              exit={{
                opacity: 0,
                filter: 'brightness(2.5) blur(6px)',
                transition: { duration: 0.4, ease: 'easeOut' },
              }}
              layout
            >
              {row.map((_, x) => (
                <GameCell
                  key={x}
                  color={getCellColor(x, y)}
                  isClearing={clearingRows.includes(y)}
                />
              ))}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default GameBoard;
