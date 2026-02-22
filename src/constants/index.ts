import React from 'react';
import {
  LucideMusic, LucideZap, LucideShield, LucideSun,
} from 'lucide-react';
import type { Guardian } from '../types/game';

export const COLS = 10;
export const ROWS = 20;
export const INITIAL_SPEED = 800;
export const NIRVANA_GOAL = 108;

export const SHAPES: Record<string, number[][]> = {
  I: [[1, 1, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
  O: [[1, 1], [1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  T: [[0, 1, 0], [1, 1, 1]],
  Z: [[1, 1, 0], [0, 1, 1]],
  DOT: [[1]], // 증장천왕의 지혜 (1x1)
};

export const BUDDHIST_COLORS: Record<number, string> = {
  1: 'bg-yellow-400', // 황 (중심)
  2: 'bg-blue-500',   // 청 (수행)
  3: 'bg-red-500',    // 적 (정진)
  4: 'bg-slate-100',  // 백 (결백)
  5: 'bg-amber-800',  // 흑 (지혜)
};

export const GUARDIANS: Record<string, Guardian> = {
  JIGUK: {
    name: '지국천왕',
    icon: React.createElement(LucideMusic, { className: 'text-blue-400' }),
    desc: '비파 소리로 시간의 흐름을 늦춥니다.',
  },
  GWANGMOK: {
    name: '광목천왕',
    icon: React.createElement(LucideZap, { className: 'text-red-400' }),
    desc: '여의주로 무작위 업보를 소멸시킵니다.',
  },
  JEUNGJANG: {
    name: '증장천왕',
    icon: React.createElement(LucideShield, { className: 'text-green-400' }),
    desc: '번뇌의 형상을 단순하게 바꿉니다.',
  },
  DAMUN: {
    name: '다문천왕',
    icon: React.createElement(LucideSun, { className: 'text-yellow-400' }),
    desc: '보탑의 힘으로 무너진 토대를 메웁니다.',
  },
};
