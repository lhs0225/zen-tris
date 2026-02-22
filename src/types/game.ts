import React from 'react';

// --- 기본 게임 타입 ---
export type CellValue = string | number;

export interface Piece {
  pos: { x: number; y: number };
  shape: number[][];
  color: string;
}

export interface Guardian {
  name: string;
  icon: React.ReactNode;
  desc: string;
}

// --- 게임 이벤트 (사운드/애니메이션 트리거) ---
export type GameEvent =
  | { type: 'PIECE_MOVE' }
  | { type: 'PIECE_ROTATE' }
  | { type: 'PIECE_LOCK' }
  | { type: 'LINE_CLEAR'; count: number }
  | { type: 'GUARDIAN_SUMMON'; guardian: string }
  | { type: 'SAMSARA'; life: number }
  | { type: 'NIRVANA' }
  | { type: 'GAME_OVER' }
  | { type: 'MERCY_USE' }
  | { type: 'MERCY_FAIL' }
  | { type: 'KARMA_WARNING' };

// --- 게임 상태 ---
export interface GameState {
  grid: CellValue[][];
  rowIds: number[];          // 각 줄 고유 ID (AnimatePresence용)
  nextRowId: number;
  activePiece: Piece | null;
  karma: number;
  merit: number;
  linesCleared: number;
  gameOver: boolean;
  isNirvana: boolean;
  feedback: string;
  samsaraCount: number;
  activeGuardian: string | null;
  guardianTimer: number;
  clearingRows: number[];    // 클리어 애니메이션 중인 줄 인덱스
  lastEvent: GameEvent | null;
  isMuted: boolean;
}

// --- 리듀서 액션 ---
export type GameAction =
  | { type: 'MOVE'; dir: { x: number; y: number } }
  | { type: 'ROTATE' }
  | { type: 'TICK' }
  | { type: 'SPAWN_PIECE'; piece: Piece }
  | { type: 'LOCK_PIECE' }
  | { type: 'LINES_DETECTED'; rowIndices: number[] }
  | { type: 'LINES_REMOVED' }
  | { type: 'TRIGGER_GUARDIAN'; guardian: string }
  | { type: 'GUARDIAN_TICK' }
  | { type: 'USE_MERCY' }
  | { type: 'SAMSARA' }
  | { type: 'RESET' }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'CLEAR_EVENT' };
