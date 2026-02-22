import { useEffect, useCallback, useRef } from 'react';
import { useZenGame } from './hooks/useZenGame';
import { useTouchControls } from './hooks/useTouchControls';
import SoundManager from './audio/SoundManager';
import GameBoard from './components/GameBoard';
import GameOverlay from './components/GameOverlay';
import GuardianBanner from './components/GuardianBanner';
import StatusPanel from './components/StatusPanel';
import LorePanel from './components/LorePanel';

const App = () => {
  const { state, actions } = useZenGame();
  const soundInitRef = useRef(false);

  // 사운드: lastEvent 감지 → 자동 재생
  useEffect(() => {
    if (state.lastEvent) {
      SoundManager.getInstance().playEvent(state.lastEvent);
    }
  }, [state.lastEvent]);

  // 사운드: 뮤트 동기화
  useEffect(() => {
    SoundManager.getInstance().setMuted(state.isMuted);
  }, [state.isMuted]);

  // 모바일 터치 컨트롤
  const touchBind = useTouchControls({
    onMove: actions.move,
    onRotate: actions.rotate,
    onMercy: actions.useMercy,
    enabled: !state.gameOver && !state.isNirvana,
  });

  // 키보드 입력 처리
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 첫 키입력에서 AudioContext 웜업 (브라우저 정책)
    if (!soundInitRef.current) {
      SoundManager.getInstance().warmup();
      soundInitRef.current = true;
    }

    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'm'].includes(e.key)) {
      e.preventDefault();
    }
    if (state.gameOver || state.isNirvana) return;

    if (e.key === 'ArrowLeft') actions.move({ x: -1, y: 0 });
    if (e.key === 'ArrowRight') actions.move({ x: 1, y: 0 });
    if (e.key === 'ArrowDown') actions.move({ x: 0, y: 1 });
    if (e.key === 'ArrowUp') actions.rotate();
    if (e.key === ' ') actions.useMercy();
    if (e.key === 'm') actions.toggleMute();
  }, [state.gameOver, state.isNirvana, actions]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen bg-amber-50 text-stone-800 flex items-center justify-center p-4 font-serif select-none overflow-hidden">
      {/* 만다라 배경 */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none flex items-center justify-center">
        <div className="w-[800px] h-[800px] border-[40px] border-amber-600 rounded-full animate-spin-slow" />
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6 relative z-10 items-start">
        {/* 좌측: 상태 패널 */}
        <StatusPanel
          karma={state.karma}
          merit={state.merit}
          linesCleared={state.linesCleared}
          samsaraCount={state.samsaraCount}
          isMuted={state.isMuted}
          onUseMercy={actions.useMercy}
          onToggleMute={actions.toggleMute}
        />

        {/* 중앙: 게임 보드 + 터치 영역 */}
        <div className="relative flex flex-col items-center">
          <GuardianBanner
            activeGuardian={state.activeGuardian}
            guardianTimer={state.guardianTimer}
          />

          <div className="relative" {...touchBind()} style={{ touchAction: 'none' }}>
            <GameBoard
              state={state}
              onLinesClearComplete={actions.removeClearedLines}
            />
            <GameOverlay
              gameOver={state.gameOver}
              isNirvana={state.isNirvana}
              samsaraCount={state.samsaraCount}
              onReset={actions.reset}
            />
          </div>

          {/* 모바일 도움말 */}
          <div className="mt-2 text-center text-xs text-stone-400 lg:hidden">
            탭: 회전 · 스와이프: 이동 · 길게 누르기: 자비
          </div>

          <div className="mt-2 text-center py-2 h-12 text-amber-600 font-bold animate-pulse text-xl">
            {state.feedback}
          </div>
        </div>

        {/* 우측: 사천왕 정보 */}
        <LorePanel activeGuardian={state.activeGuardian} />
      </div>

      {/* 커스텀 애니메이션 */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        @keyframes line-clear {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); background: rgba(255,215,0,0.4); }
          100% { opacity: 0; transform: scale(0.95); filter: blur(4px); }
        }
        .animate-line-clear {
          animation: line-clear 0.4s ease-out forwards;
        }
      `}} />
    </div>
  );
};

export default App;
