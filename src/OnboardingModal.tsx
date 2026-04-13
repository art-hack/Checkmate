import { useState, type FC } from 'react';
import { 
  Rocket, 
  LayoutDashboard, 
  Zap, 
  X,
  ChevronRight,
  ChevronLeft,
  Command as CommandIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInitializeSample: () => void;
}

const steps = [
  {
    title: "Welcome to CheckMate",
    description: "Multi-project task management with strategic precision. Master your workflows with parallel checklists and nested subtasks.",
    icon: <Rocket className="w-12 h-12 text-action-indigo" />,
    color: "bg-indigo-50 dark:bg-indigo-950/30"
  },
  {
    title: "Parallel Workflows",
    description: "Projects are divided into side-by-side checklists. Track Preparation, Execution, and Review simultaneously in one unified view.",
    icon: <LayoutDashboard className="w-12 h-12 text-victory-green" />,
    color: "bg-emerald-50 dark:bg-emerald-950/30"
  },
  {
    title: "Smart Quick-Add",
    description: "Type tasks instantly. Use '@Project' to route them automatically, or just hit Enter to send them to your system-level Inbox.",
    icon: <Zap className="w-12 h-12 text-amber-400" />,
    color: "bg-amber-50 dark:bg-amber-950/30"
  },
  {
    title: "The Command Palette",
    description: "Press Ctrl+K (or Cmd+K) anywhere to search all tasks, switch projects, or create new items without leaving your keyboard.",
    icon: <CommandIcon className="w-12 h-12 text-slate-600 dark:text-slate-400" />,
    color: "bg-slate-100 dark:bg-slate-800"
  }
];

const OnboardingModal: FC<OnboardingModalProps> = ({ isOpen, onClose, onInitializeSample }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);

  if (!isOpen) return null;

  const nextStep = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsInitializing(true);
      await onInitializeSample();
      // App.tsx handles closing
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden relative border border-slate-200 dark:border-slate-800"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col h-full">
          {/* Top Visual Area */}
          <div className={`h-48 flex items-center justify-center transition-colors duration-500 ${steps[currentStep].color}`}>
            <motion.div
              key={currentStep}
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12 }}
            >
              {steps[currentStep].icon}
            </motion.div>
          </div>

          {/* Content Area */}
          <div className="p-10 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-4"
              >
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {steps[currentStep].title}
                </h2>
                <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                  {steps[currentStep].description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Step Indicators */}
            <div className="flex justify-center space-x-2 mt-8">
              {steps.map((_, i) => (
                <div 
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-action-indigo' : 'w-2 bg-slate-200 dark:bg-slate-700'}`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-10">
              <button 
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Back</span>
              </button>

              <button 
                onClick={nextStep}
                disabled={isInitializing}
                className={`flex items-center space-x-2 bg-action-indigo text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none ${isInitializing ? 'opacity-70 cursor-wait' : ''}`}
              >
                <span>
                  {isInitializing ? 'Starting...' : currentStep === steps.length - 1 ? 'Start Mission' : 'Continue'}
                </span>
                {!isInitializing && <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
            
            {currentStep === steps.length - 1 && (
              <p className="text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest animate-pulse">
                Clicking will initialize your sample project
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingModal;
