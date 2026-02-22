import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LucideWind, LucideFlame, LucideSun, LucideZap,
  LucideHeart, LucideRefreshCw, LucideMusic,
  LucideShield, LucideSkull, LucideSparkles
} from 'lucide-react';

// --- Constants ---
const COLS = 10;
const ROWS = 20;
const INITIAL_SPEED = 800;
const NIRVANA_GOAL = 108;

const SHAPES: Record<string, number[][]> = {
  I: [[1, 1, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
  O: [[1, 1], [1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  T: [[0, 1, 0], [1, 1, 1]],
  Z: [[1, 1, 0], [0, 1, 1]],
  DOT: [[1]] // 증장천왕의 지혜 (1x1)
};

const BUDDHIST_COLORS: Record<number, string> = {
  1: 'bg-yellow-400', // 황 (중심)
  2: 'bg-blue-500',   // 청 (수행)
  3: 'bg-red-500',    // 적 (정진)
  4: 'bg-slate-100',  // 백 (결백)
  5: 'bg-amber-800',  // 흑 (지혜)
};

interface Guardian {
  name: string;
  icon: React.ReactNode;
  desc: string;
}

const GUARDIANS: Record<string, Guardian> = {
  JIGUK: { name: "지국천왕", icon: <LucideMusic className="text-blue-400" />, desc: "비파 소리로 시간의 흐름을 늦춥니다." },
  GWANGMOK: { name: "광목천왕", icon: <LucideZap className="text-red-400" />, desc: "여의주로 무작위 업보를 소멸시킵니다." },
  JEUNGJANG: { name: "증장천왕", icon: <LucideShield className="text-green-400" />, desc: "번뇌의 형상을 단순하게 바꿉니다." },
  DAMUN: { name: "다문천왕", icon: <LucideSun className="text-yellow-400" />, desc: "보탑의 힘으로 무너진 토대를 메웁니다." }
};

interface Piece {
  pos: { x: number; y: number };
  shape: number[][];
  color: string;
}

type CellValue = string | number;

const App = () => {
  const [grid, setGrid] = useState<CellValue[][]>(Array(ROWS).fill(null).map(() => Array(COLS).fill(0)));
  const [activePiece, setActivePiece] = useState<Piece | null>(null);
  const [karma, setKarma] = useState(0);
  const [merit, setMerit] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isNirvana, setIsNirvana] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [samsaraCount, setSamsaraCount] = useState(0);
  const [activeGuardian, setActiveGuardian] = useState<string | null>(null);
  const [guardianTimer, setGuardianTimer] = useState(0);

  const gameLoopRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // --- Sound & Visual Feedback ---
  const triggerEvent = (msg: string, _type = "default") => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 2000);
  };

  // --- Core Game Logic ---
  const spawnPiece = useCallback((forceType: string | null = null): Piece => {
    const keys = forceType ? [forceType] : Object.keys(SHAPES).filter(k => k !== 'DOT');
    const type = keys[Math.floor(Math.random() * keys.length)];
    const shape = SHAPES[type];
    const colorKey = Math.floor(Math.random() * 5) + 1;

    return {
      pos: { x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 },
      shape,
      color: BUDDHIST_COLORS[colorKey]
    };
  }, []);

  const checkCollision = (piece: Piece, newPos: { x: number; y: number }, newGrid: CellValue[][] = grid) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const nextX = newPos.x + x;
          const nextY = newPos.y + y;
          if (nextX < 0 || nextX >= COLS || nextY >= ROWS || (nextY >= 0 && newGrid[nextY][nextX])) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const rotate = (piece: Piece) => {
    const newShape = piece.shape[0].map((_, i) => piece.shape.map(row => row[i]).reverse());
    const newPiece = { ...piece, shape: newShape };
    if (!checkCollision(newPiece, piece.pos)) {
      setActivePiece(newPiece);
      setFeedback("똑... (회전)");
    }
  };

  const move = useCallback((dir: { x: number; y: number }) => {
    if (!activePiece || gameOver || isNirvana) return;
    const newPos = { x: activePiece.pos.x + dir.x, y: activePiece.pos.y + dir.y };
    if (!checkCollision(activePiece, newPos)) {
      setActivePiece({ ...activePiece, pos: newPos });
    } else if (dir.y > 0) {
      lockPiece();
    }
  }, [activePiece, grid, gameOver, isNirvana]);

  const triggerGuardian = () => {
    const keys = Object.keys(GUARDIANS);
    const chosen = keys[Math.floor(Math.random() * keys.length)];
    setActiveGuardian(chosen);
    setGuardianTimer(10); // 10초간 유지
    triggerEvent(`${GUARDIANS[chosen].name} 강림!`, "guardian");

    if (chosen === 'GWANGMOK') {
        // 무작위 15개 블록 제거
        setGrid(prev => {
            const newGrid = prev.map(row => [...row]);
            let removed = 0;
            while (removed < 15) {
                const ry = Math.floor(Math.random() * ROWS);
                const rx = Math.floor(Math.random() * COLS);
                if (newGrid[ry][rx] !== 0) {
                    newGrid[ry][rx] = 0;
                    removed++;
                }
            }
            return newGrid;
        });
    }

    if (chosen === 'DAMUN') {
        // 구멍 메우기
        setGrid(prev => {
            const newGrid = prev.map(row => [...row]);
            for (let x = 0; x < COLS; x++) {
                let foundBlock = false;
                for (let y = 0; y < ROWS; y++) {
                    if (newGrid[y][x] !== 0) foundBlock = true;
                    if (foundBlock && newGrid[y][x] === 0) newGrid[y][x] = 'bg-stone-600';
                }
            }
            return newGrid;
        });
    }
  };

  const lockPiece = () => {
    if (!activePiece) return;
    const newGrid = grid.map(row => [...row]);
    activePiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const finalY = activePiece.pos.y + y;
          if (finalY < 0) {
            handleSamsara();
          } else {
            newGrid[finalY][activePiece.pos.x + x] = activePiece.color;
          }
        }
      });
    });

    let lines = 0;
    const filteredGrid = newGrid.filter(row => {
      const isFull = row.every(cell => cell !== 0);
      if (isFull) lines++;
      return !isFull;
    });

    while (filteredGrid.length < ROWS) {
      filteredGrid.unshift(Array(COLS).fill(0));
    }

    setGrid(filteredGrid);
    setActivePiece(null);

    if (lines > 0) {
      setKarma(prev => Math.max(0, prev - lines * 12));
      setMerit(prev => prev + lines * 108);
      setLinesCleared(prev => {
          const newTotal = prev + lines;
          if (newTotal >= NIRVANA_GOAL) setIsNirvana(true);
          return newTotal;
      });
      setFeedback("당! (소멸)");
      if (lines >= 4) triggerGuardian();
    } else {
      setKarma(prev => Math.min(100, prev + 4));
    }
  };

  const handleSamsara = () => {
    if (samsaraCount >= 3) {
        setGameOver(true);
        return;
    }
    setSamsaraCount(prev => prev + 1);
    setKarma(50); // 절반의 업보를 안고 환생
    // 하단 5줄만 남기고 정화
    setGrid(prev => {
        const newGrid: CellValue[][] = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
        for(let i=0; i<5; i++) newGrid[ROWS-1-i] = [...prev[ROWS-1-i]];
        return newGrid;
    });
    triggerEvent(`제 ${samsaraCount + 1}생: 다시 윤회의 굴레에 듭니다.`);
  };

  const useMercy = () => {
    if (merit < 300) {
        triggerEvent("공덕이 부족하여 자비를 베풀 수 없습니다.");
        return;
    }
    setGrid(prev => {
        const newGrid = [...prev];
        newGrid.pop();
        newGrid.unshift(Array(COLS).fill(0));
        return newGrid;
    });
    setMerit(prev => prev - 300);
    setKarma(prev => Math.min(100, prev + 15));
    triggerEvent("자비의 손길: 바닥의 업보를 한 층 비웠습니다.");
  };

  // --- Effects ---
  useEffect(() => {
    if (!activePiece && !gameOver && !isNirvana) {
      const nextPiece = activeGuardian === 'JEUNGJANG' ? spawnPiece('DOT') : spawnPiece();
      setActivePiece(nextPiece);
    }

    let speed = INITIAL_SPEED - (karma * 6);
    if (activeGuardian === 'JIGUK') speed *= 2.5; // 지국천왕의 가호

    gameLoopRef.current = setInterval(() => {
      move({ x: 0, y: 1 });
    }, Math.max(80, speed));

    return () => clearInterval(gameLoopRef.current);
  }, [activePiece, karma, gameOver, isNirvana, activeGuardian, spawnPiece, move]);

  useEffect(() => {
    if (guardianTimer > 0) {
        const t = setInterval(() => setGuardianTimer(p => p - 1), 1000);
        return () => clearInterval(t);
    } else {
        setActiveGuardian(null);
    }
  }, [guardianTimer]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (gameOver || isNirvana) return;
      if (e.key === 'ArrowLeft') move({ x: -1, y: 0 });
      if (e.key === 'ArrowRight') move({ x: 1, y: 0 });
      if (e.key === 'ArrowDown') move({ x: 0, y: 1 });
      if (e.key === 'ArrowUp' && activePiece) rotate(activePiece);
      if (e.key === ' ') useMercy();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePiece, grid, karma, gameOver, isNirvana, move]);

  // --- Visual Styling ---
  const karmaFilter: React.CSSProperties = {
    filter: `sepia(${karma * 0.5}%) hue-rotate(${karma * 0.7}deg) contrast(${100 + karma * 0.5}%)`,
    transform: karma > 85 ? `translate(${Math.random()*4-2}px, ${Math.random()*4-2}px)` : 'none'
  };

  return (
    <div className="min-h-screen bg-amber-50 text-stone-800 flex items-center justify-center p-4 font-serif select-none overflow-hidden">
      {/* Mandala Background Decoration */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none flex items-center justify-center">
        <div className="w-[800px] h-[800px] border-[40px] border-amber-600 rounded-full animate-spin-slow" />
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6 relative z-10 items-start">

        {/* Left Side: Status & Samsara */}
        <div className="space-y-5">
          <div className="bg-white/70 p-6 rounded-3xl border border-amber-200 backdrop-blur-md shadow-lg">
            <h1 className="text-6xl font-black text-amber-700 mb-1 tracking-tighter italic">禪-TRIS</h1>
            <p className="text-stone-400 text-base mb-6 uppercase tracking-widest">Digital Samsara Simulator</p>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-1.5 text-stone-500 font-medium">
                  <span>현생의 업보 (Karma)</span>
                  <span className={karma > 80 ? "text-red-500 animate-pulse font-bold" : ""}>{Math.floor(karma)}%</span>
                </div>
                <div className="h-3 bg-stone-200 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-700 rounded-full ${karma > 70 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${karma}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1.5 text-stone-500 font-medium">
                  <span>성불까지의 여정 ({linesCleared}/{NIRVANA_GOAL})</span>
                  <span>{Math.floor((linesCleared/NIRVANA_GOAL)*100)}%</span>
                </div>
                <div className="h-3 bg-stone-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${(linesCleared/NIRVANA_GOAL)*100}%` }} />
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
            onClick={useMercy}
            disabled={merit < 300}
            className={`w-full py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg ${merit >= 300 ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}
          >
            <LucideHeart size={22}/> 자비의 손길 (300 공덕)
          </button>
        </div>

        {/* Center: The Board */}
        <div className="relative flex flex-col items-center">
          {activeGuardian && (
              <div className="absolute -top-14 left-0 right-0 flex items-center justify-center gap-2 animate-bounce bg-white/90 py-3 rounded-full border border-amber-300 shadow-xl z-20">
                  {GUARDIANS[activeGuardian].icon}
                  <span className="text-base font-bold text-stone-800">{GUARDIANS[activeGuardian].name}의 가호 ({guardianTimer}s)</span>
              </div>
          )}

          <div className="p-1.5 bg-amber-100 rounded-2xl border-4 border-amber-200 shadow-[0_8px_40px_rgba(180,140,60,0.2)] relative overflow-hidden">
            <div
              className="grid gap-px bg-amber-200/50"
              style={{
                gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                gridTemplateRows: `repeat(${ROWS}, 1fr)`,
                width: 'min(360px, 45vw)',
                aspectRatio: '1 / 2',
                ...karmaFilter
              }}
            >
              {grid.map((row, y) =>
                row.map((cell, x) => {
                  let color = cell || 'bg-amber-50/40';
                  if (activePiece) {
                    const { pos, shape, color: activeColor } = activePiece;
                    if (y >= pos.y && y < pos.y + shape.length && x >= pos.x && x < pos.x + shape[0].length) {
                      if (shape[y - pos.y][x - pos.x]) color = activeColor;
                    }
                  }
                  return (
                    <div
                      key={`${x}-${y}`}
                      className={`${color} rounded-sm transition-all duration-150 ${cell ? 'shadow-[inset_0_0_6px_rgba(0,0,0,0.15)] border border-black/10' : ''}`}
                    />
                  );
                })
              )}
            </div>

            {/* Game Over / Nirvana Overlays */}
            {(gameOver || isNirvana) && (
              <div className="absolute inset-0 bg-amber-50/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-8 z-30">
                {isNirvana ? (
                  <div>
                    <div className="w-24 h-24 bg-yellow-400 rounded-full blur-2xl absolute opacity-40 animate-pulse" />
                    <LucideSun size={80} className="text-amber-500 mb-6 relative animate-spin-slow"/>
                    <h2 className="text-4xl font-black mb-4 text-amber-600 tracking-tighter">아뇩다라삼먁삼보리</h2>
                    <p className="mb-8 text-stone-500 text-base leading-relaxed">
                        모든 번뇌의 사슬을 끊고<br/>영원한 자유(Empty)에 이르렀습니다.
                    </p>
                  </div>
                ) : (
                  <>
                    <LucideSkull size={64} className="text-red-600 mb-6 animate-pulse"/>
                    <h2 className="text-4xl font-black mb-4 text-red-600 tracking-tighter">제행무상 (諸行無常)</h2>
                    <p className="mb-8 text-stone-500 text-base leading-relaxed">
                        세상의 모든 것은 변하나니<br/>쌓인 업보를 내려놓고 다시 태어나소서.
                    </p>
                  </>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="bg-stone-800 text-white px-8 py-3 rounded-full text-lg font-black flex items-center gap-2 hover:scale-105 transition-transform"
                >
                  <LucideRefreshCw size={20}/> 정토로 돌아가기
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 text-center py-2 h-12 text-amber-600 font-bold animate-pulse text-xl">
            {feedback}
          </div>
        </div>

        {/* Right Side: Guardian Info & Lore */}
        <div className="space-y-5">
          <div className="bg-white/70 p-6 rounded-3xl border border-amber-200 shadow-lg">
            <h3 className="text-stone-500 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <LucideShield size={18}/> 사천왕의 가호 (4줄 제거 시)
            </h3>
            <div className="space-y-3">
                {Object.entries(GUARDIANS).map(([key, g]) => (
                    <div key={key} className={`flex gap-3 p-3 rounded-xl border transition-all ${activeGuardian === key ? 'bg-amber-100 border-amber-500 scale-105 shadow-lg' : 'border-transparent opacity-50'}`}>
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

      </div>

      {/* Visual Effects Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}} />
    </div>
  );
};

export default App;
