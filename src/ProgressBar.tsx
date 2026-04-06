import React from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';

interface ProgressBarProps {
  progress: number; // 0 to 100
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const isComplete = progress === 100;

  return (
    <div className="relative w-full h-8 bg-slate-200 rounded-full overflow-hidden shadow-inner">
      <motion.div
        className="h-full bg-victory-green"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      
      <div className="absolute inset-0 flex items-center justify-center">
        {isComplete ? (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="flex items-center space-x-2 text-white font-bold"
          >
            <Crown className="w-6 h-6" />
            <span>CHECKMATE</span>
          </motion.div>
        ) : (
          <span className="text-xs font-semibold text-slate-600">
            {Math.round(progress)}%
          </span>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
