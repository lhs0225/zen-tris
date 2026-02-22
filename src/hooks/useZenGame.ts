import { useReducer, useCallback, useRef, useEffect } from 'react';
import type { GameState, GameAction, Piece, CellValue } from '../types/game';
import { COLS, ROWS, INITIAL_SPEED, NIRVANA_GOAL, SHAPES, BUDDHIST_COLORS, GUARDIANS } from '../constants';

// --- 초기 상태 ---
function createEmptyGrid(): CellValue[][] {
  return Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
}

function createInitialRowIds(): number[] {
  return Array.from({ length: ROWS }, (_, i) => i);
}

const initialState: GameState = {
  grid: createEmptyGrid(),
  rowIds: createInitialRowIds(),
  nextRowId: ROWS,
  activePiece: null,
  karma: 0,
  merit: 0,
  linesCleared: 0,
  gameOver: false,
  isNirvana: false,
  feedback: '',
  samsaraCount: 0,
  activeGuardian: null,
  guardianTimer: 0,
  clearingRows: [],
  lastEvent: null,
  isMuted: false,
};

// --- 유틸리티 ---
function spawnPiece(forceType: string | null = null): Piece {
  const keys = forceType ? [forceType] : Object.keys(SHAPES).filter(k => k !== 'DOT');
  const type = keys[Math.floor(Math.random() * keys.length)];
  const shape = SHAPES[type];
  const colorKey = Math.floor(Math.random() * 5) + 1;
  return {
    pos: { x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 },
    shape,
    color: BUDDHIST_COLORS[colorKey],
  };
}

function checkCollision(
  piece: Piece,
  newPos: { x: number; y: number },
  grid: CellValue[][],
): boolean {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const nextX = newPos.x + x;
        const nextY = newPos.y + y;
        if (nextX < 0 || nextX >= COLS || nextY >= ROWS || (nextY >= 0 && grid[nextY][nextX])) {
          return true;
        }
      }
    }
  }
  return false;
}

function rotatePiece(piece: Piece): Piece {
  const newShape = piece.shape[0].map((_, i) =>
    piece.shape.map(row => row[i]).reverse()
  );
  return { ...piece, shape: newShape };
}

function pickRandomGuardian(): string {
  const keys = Object.keys(GUARDIANS);
  return keys[Math.floor(Math.random() * keys.length)];
}

// --- 리듀서 ---
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'MOVE': {
      if (!state.activePiece || state.gameOver || state.isNirvana || state.clearingRows.length > 0) return state;
      const newPos = {
        x: state.activePiece.pos.x + action.dir.x,
        y: state.activePiece.pos.y + action.dir.y,
      };
      if (!checkCollision(state.activePiece, newPos, state.grid)) {
        return {
          ...state,
          activePiece: { ...state.activePiece, pos: newPos },
          lastEvent: { type: 'PIECE_MOVE' },
        };
      }
      // 아래로 이동 중 충돌 → 고정 시그널 (LOCK_PIECE는 외부에서 dispatch)
      if (action.dir.y > 0) {
        return lockPieceLogic(state);
      }
      return state;
    }

    case 'ROTATE': {
      if (!state.activePiece || state.gameOver || state.isNirvana || state.clearingRows.length > 0) return state;
      const rotated = rotatePiece(state.activePiece);
      if (!checkCollision(rotated, state.activePiece.pos, state.grid)) {
        return {
          ...state,
          activePiece: rotated,
          feedback: '똑... (회전)',
          lastEvent: { type: 'PIECE_ROTATE' },
        };
      }
      return state;
    }

    case 'TICK': {
      if (!state.activePiece || state.gameOver || state.isNirvana || state.clearingRows.length > 0) return state;
      const newPos = { x: state.activePiece.pos.x, y: state.activePiece.pos.y + 1 };
      if (!checkCollision(state.activePiece, newPos, state.grid)) {
        return { ...state, activePiece: { ...state.activePiece, pos: newPos } };
      }
      return lockPieceLogic(state);
    }

    case 'SPAWN_PIECE': {
      return { ...state, activePiece: action.piece };
    }

    case 'LINES_REMOVED': {
      // 애니메이션 완료 후 실제 줄 제거
      const clearedIndices = state.clearingRows;
      if (clearedIndices.length === 0) return state;

      const filteredGrid = state.grid.filter((_, i) => !clearedIndices.includes(i));
      const filteredRowIds = state.rowIds.filter((_, i) => !clearedIndices.includes(i));
      const newRowCount = clearedIndices.length;

      // 새 빈 줄을 위에 추가
      const newRows: CellValue[][] = Array(newRowCount).fill(null).map(() => Array(COLS).fill(0));
      const newRowIds = Array.from({ length: newRowCount }, (_, i) => state.nextRowId + i);

      const newGrid = [...newRows, ...filteredGrid];
      const newRowIdsArr = [...newRowIds, ...filteredRowIds];

      let newState: GameState = {
        ...state,
        grid: newGrid,
        rowIds: newRowIdsArr,
        nextRowId: state.nextRowId + newRowCount,
        clearingRows: [],
        karma: Math.max(0, state.karma - clearedIndices.length * 12),
        merit: state.merit + clearedIndices.length * 108,
      };

      const newTotal = state.linesCleared + clearedIndices.length;
      newState.linesCleared = newTotal;
      if (newTotal >= NIRVANA_GOAL) {
        newState.isNirvana = true;
        newState.lastEvent = { type: 'NIRVANA' };
      }

      // 4줄 이상 → 사천왕 강림
      if (clearedIndices.length >= 4) {
        const guardian = pickRandomGuardian();
        newState = applyGuardianEffect(newState, guardian);
      }

      return newState;
    }

    case 'TRIGGER_GUARDIAN': {
      return applyGuardianEffect(state, action.guardian);
    }

    case 'GUARDIAN_TICK': {
      if (state.guardianTimer <= 1) {
        return { ...state, guardianTimer: 0, activeGuardian: null };
      }
      return { ...state, guardianTimer: state.guardianTimer - 1 };
    }

    case 'USE_MERCY': {
      if (state.merit < 300) {
        return {
          ...state,
          feedback: '공덕이 부족하여 자비를 베풀 수 없습니다.',
          lastEvent: { type: 'MERCY_FAIL' },
        };
      }
      const newGrid = [...state.grid];
      newGrid.pop();
      newGrid.unshift(Array(COLS).fill(0));
      // rowIds도 동기화
      const newRowIds = [state.nextRowId, ...state.rowIds.slice(0, -1)];
      return {
        ...state,
        grid: newGrid,
        rowIds: newRowIds,
        nextRowId: state.nextRowId + 1,
        merit: state.merit - 300,
        karma: Math.min(100, state.karma + 15),
        feedback: '자비의 손길: 바닥의 업보를 한 층 비웠습니다.',
        lastEvent: { type: 'MERCY_USE' },
      };
    }

    case 'SAMSARA': {
      if (state.samsaraCount >= 3) {
        return {
          ...state,
          gameOver: true,
          lastEvent: { type: 'GAME_OVER' },
        };
      }
      // 하단 5줄만 남기고 정화
      const newGrid: CellValue[][] = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
      for (let i = 0; i < 5; i++) newGrid[ROWS - 1 - i] = [...state.grid[ROWS - 1 - i]];

      const newLife = state.samsaraCount + 1;
      return {
        ...state,
        grid: newGrid,
        rowIds: Array.from({ length: ROWS }, (_, i) => state.nextRowId + i),
        nextRowId: state.nextRowId + ROWS,
        activePiece: null,
        samsaraCount: newLife,
        karma: 50,
        clearingRows: [],
        feedback: `제 ${newLife}생: 다시 윤회의 굴레에 듭니다.`,
        lastEvent: { type: 'SAMSARA', life: newLife },
      };
    }

    case 'RESET': {
      return { ...initialState, grid: createEmptyGrid(), rowIds: createInitialRowIds() };
    }

    case 'TOGGLE_MUTE': {
      return { ...state, isMuted: !state.isMuted };
    }

    case 'CLEAR_EVENT': {
      return { ...state, lastEvent: null, feedback: '' };
    }

    default:
      return state;
  }
}

// --- 피스 고정 로직 ---
function lockPieceLogic(state: GameState): GameState {
  if (!state.activePiece) return state;

  const newGrid = state.grid.map(row => [...row]);
  let needSamsara = false;

  state.activePiece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        const finalY = state.activePiece!.pos.y + y;
        if (finalY < 0) {
          needSamsara = true;
        } else {
          newGrid[finalY][state.activePiece!.pos.x + x] = state.activePiece!.color;
        }
      }
    });
  });

  if (needSamsara) {
    // 윤회 처리
    if (state.samsaraCount >= 3) {
      return { ...state, gameOver: true, activePiece: null, lastEvent: { type: 'GAME_OVER' } };
    }
    const newLife = state.samsaraCount + 1;
    const samsaraGrid: CellValue[][] = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    for (let i = 0; i < 5; i++) samsaraGrid[ROWS - 1 - i] = [...state.grid[ROWS - 1 - i]];

    return {
      ...state,
      grid: samsaraGrid,
      rowIds: Array.from({ length: ROWS }, (_, i) => state.nextRowId + i),
      nextRowId: state.nextRowId + ROWS,
      activePiece: null,
      samsaraCount: newLife,
      karma: 50,
      clearingRows: [],
      feedback: `제 ${newLife}생: 다시 윤회의 굴레에 듭니다.`,
      lastEvent: { type: 'SAMSARA', life: newLife },
    };
  }

  // 완성 줄 감지
  const fullRows: number[] = [];
  newGrid.forEach((row, i) => {
    if (row.every(cell => cell !== 0)) fullRows.push(i);
  });

  if (fullRows.length > 0) {
    // 줄 감지만 하고, 실제 제거는 애니메이션 후
    return {
      ...state,
      grid: newGrid,
      activePiece: null,
      clearingRows: fullRows,
      feedback: '당! (소멸)',
      lastEvent: { type: 'LINE_CLEAR', count: fullRows.length },
    };
  }

  // 줄 없이 고정
  return {
    ...state,
    grid: newGrid,
    activePiece: null,
    karma: Math.min(100, state.karma + 4),
    lastEvent: { type: 'PIECE_LOCK' },
  };
}

// --- 사천왕 효과 적용 ---
function applyGuardianEffect(state: GameState, guardian: string): GameState {
  let newState: GameState = {
    ...state,
    activeGuardian: guardian,
    guardianTimer: 10,
    feedback: `${GUARDIANS[guardian].name} 강림!`,
    lastEvent: { type: 'GUARDIAN_SUMMON', guardian },
  };

  if (guardian === 'GWANGMOK') {
    // 무작위 15개 블록 제거
    const newGrid = newState.grid.map(row => [...row]);
    let removed = 0;
    let attempts = 0;
    while (removed < 15 && attempts < 300) {
      const ry = Math.floor(Math.random() * ROWS);
      const rx = Math.floor(Math.random() * COLS);
      if (newGrid[ry][rx] !== 0) {
        newGrid[ry][rx] = 0;
        removed++;
      }
      attempts++;
    }
    newState = { ...newState, grid: newGrid };
  }

  if (guardian === 'DAMUN') {
    // 구멍 메우기
    const newGrid = newState.grid.map(row => [...row]);
    for (let x = 0; x < COLS; x++) {
      let foundBlock = false;
      for (let y = 0; y < ROWS; y++) {
        if (newGrid[y][x] !== 0) foundBlock = true;
        if (foundBlock && newGrid[y][x] === 0) newGrid[y][x] = 'bg-stone-600';
      }
    }
    newState = { ...newState, grid: newGrid };
  }

  return newState;
}

// --- 커스텀 훅 ---
export function useZenGame() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const gameLoopRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const guardianIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // 피스 스폰
  useEffect(() => {
    if (!state.activePiece && !state.gameOver && !state.isNirvana && state.clearingRows.length === 0) {
      const piece = state.activeGuardian === 'JEUNGJANG' ? spawnPiece('DOT') : spawnPiece();
      dispatch({ type: 'SPAWN_PIECE', piece });
    }
  }, [state.activePiece, state.gameOver, state.isNirvana, state.clearingRows.length, state.activeGuardian]);

  // 게임 루프 (requestAnimationFrame)
  useEffect(() => {
    if (state.gameOver || state.isNirvana) return;

    let speed = INITIAL_SPEED - (state.karma * 6);
    if (state.activeGuardian === 'JIGUK') speed *= 2.5;
    const interval = Math.max(80, speed);

    const tick = (timestamp: number) => {
      if (timestamp - lastTickRef.current >= interval) {
        lastTickRef.current = timestamp;
        dispatch({ type: 'TICK' });
      }
      gameLoopRef.current = requestAnimationFrame(tick);
    };

    gameLoopRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [state.karma, state.gameOver, state.isNirvana, state.activeGuardian]);

  // 피드백 자동 클리어
  useEffect(() => {
    if (state.feedback) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => dispatch({ type: 'CLEAR_EVENT' }), 2000);
    }
    return () => clearTimeout(feedbackTimerRef.current);
  }, [state.feedback]);

  // 사천왕 타이머
  useEffect(() => {
    if (state.guardianTimer > 0) {
      guardianIntervalRef.current = setInterval(() => dispatch({ type: 'GUARDIAN_TICK' }), 1000);
      return () => clearInterval(guardianIntervalRef.current);
    }
  }, [state.guardianTimer > 0]);

  // 라인 클리어 애니메이션 후 자동 제거 (Framer Motion이 없을 때의 fallback)
  useEffect(() => {
    if (state.clearingRows.length > 0) {
      const timer = setTimeout(() => dispatch({ type: 'LINES_REMOVED' }), 500);
      return () => clearTimeout(timer);
    }
  }, [state.clearingRows]);

  // --- 액션 핸들러 ---
  const move = useCallback((dir: { x: number; y: number }) => {
    dispatch({ type: 'MOVE', dir });
  }, []);

  const rotate = useCallback(() => {
    dispatch({ type: 'ROTATE' });
  }, []);

  const useMercy = useCallback(() => {
    dispatch({ type: 'USE_MERCY' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const toggleMute = useCallback(() => {
    dispatch({ type: 'TOGGLE_MUTE' });
  }, []);

  const removeClearedLines = useCallback(() => {
    dispatch({ type: 'LINES_REMOVED' });
  }, []);

  return {
    state,
    actions: { move, rotate, useMercy, reset, toggleMute, removeClearedLines },
  };
}
