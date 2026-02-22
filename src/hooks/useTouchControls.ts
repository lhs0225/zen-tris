import { useRef, useCallback } from 'react';
import { useGesture } from '@use-gesture/react';
import SoundManager from '../audio/SoundManager';

interface TouchControlsConfig {
  onMove: (dir: { x: number; y: number }) => void;
  onRotate: () => void;
  onMercy: () => void;
  enabled: boolean;
}

export function useTouchControls({ onMove, onRotate, onMercy, enabled }: TouchControlsConfig) {
  const lastMoveRef = useRef<number>(0);
  const soundInitRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isLongPressRef = useRef(false);

  // 연속 이동 방지 (최소 간격 80ms)
  const throttledMove = useCallback((dir: { x: number; y: number }) => {
    const now = Date.now();
    if (now - lastMoveRef.current < 80) return;
    lastMoveRef.current = now;
    onMove(dir);
  }, [onMove]);

  const bind = useGesture(
    {
      onDragStart: () => {
        if (!enabled) return;

        // 첫 터치에서 AudioContext 웜업
        if (!soundInitRef.current) {
          SoundManager.getInstance().warmup();
          soundInitRef.current = true;
        }

        // 길게 누르기 타이머 시작
        isLongPressRef.current = false;
        longPressTimerRef.current = setTimeout(() => {
          isLongPressRef.current = true;
          if (navigator.vibrate) navigator.vibrate(50);
          onMercy();
        }, 500);
      },

      onDrag: ({ direction: [dx, dy], distance: [distX, distY], velocity: [, vy], tap, cancel }) => {
        if (!enabled) return;

        // 이동이 감지되면 길게 누르기 취소
        if (distX > 10 || distY > 10) {
          clearTimeout(longPressTimerRef.current);
        }

        // 길게 누르기 발동 후에는 무시
        if (isLongPressRef.current) return;

        // 탭 → 회전
        if (tap) {
          clearTimeout(longPressTimerRef.current);
          onRotate();
          return;
        }

        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        // 수평 스와이프 (좌/우 이동)
        if (absX > absY && distX > 15) {
          throttledMove({ x: dx > 0 ? 1 : -1, y: 0 });
          cancel();
          return;
        }

        // 아래 스와이프 (소프트 드롭)
        if (dy > 0 && distY > 20) {
          throttledMove({ x: 0, y: 1 });
          cancel();
          return;
        }

        // 위 스와이프 (빠른 회전)
        if (dy < 0 && distY > 30 && vy > 0.3) {
          onRotate();
          cancel();
          return;
        }
      },

      onDragEnd: () => {
        clearTimeout(longPressTimerRef.current);
        isLongPressRef.current = false;
      },
    },
    {
      drag: {
        filterTaps: true,
        threshold: 8,
      },
    }
  );

  return bind;
}
