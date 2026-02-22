import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GUARDIANS } from '../constants';

interface GuardianBannerProps {
  activeGuardian: string | null;
  guardianTimer: number;
}

const GuardianBanner: React.FC<GuardianBannerProps> = ({ activeGuardian, guardianTimer }) => {
  return (
    <AnimatePresence>
      {activeGuardian && (
        <motion.div
          initial={{ y: -100, opacity: 0, scale: 0.5 }}
          animate={{
            y: 0,
            opacity: 1,
            scale: 1,
            boxShadow: [
              '0 0 0px rgba(255,215,0,0)',
              '0 0 40px rgba(255,215,0,0.6)',
              '0 0 20px rgba(255,215,0,0.3)',
            ],
          }}
          exit={{ y: -50, opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', bounce: 0.3 }}
          className="absolute -top-14 left-0 right-0 flex items-center justify-center gap-2 bg-white/90 py-3 rounded-full border border-amber-300 shadow-xl z-20"
        >
          {GUARDIANS[activeGuardian].icon}
          <span className="text-base font-bold text-stone-800">
            {GUARDIANS[activeGuardian].name}의 가호 ({guardianTimer}s)
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GuardianBanner;
