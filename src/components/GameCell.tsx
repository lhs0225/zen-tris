import React from 'react';
import type { CellValue } from '../types/game';

interface GameCellProps {
  color: CellValue;
  isClearing: boolean;
}

// React.memo: color나 isClearing이 안 바뀌면 리렌더 안 함
const GameCell = React.memo(({ color, isClearing }: GameCellProps) => {
  const bg = color || 'bg-amber-50/40';
  const hasBlock = color !== 0 && color !== 'bg-amber-50/40';

  return (
    <div
      className={`${bg} rounded-sm transition-colors duration-150 ${
        hasBlock ? 'shadow-[inset_0_0_6px_rgba(0,0,0,0.15)] border border-black/10' : ''
      } ${isClearing ? 'animate-line-clear' : ''}`}
    />
  );
}, (prev, next) => prev.color === next.color && prev.isClearing === next.isClearing);

GameCell.displayName = 'GameCell';

export default GameCell;
