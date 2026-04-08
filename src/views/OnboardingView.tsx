import { motion } from 'motion/react';

export default function OnboardingView({ onFinish }: { onFinish: () => void; key?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center h-full text-center space-y-8 px-4"
    >
      <div className="w-40 h-40 bg-zinc-900 border border-zinc-800 rounded-[40px] flex items-center justify-center shadow-lg relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent opacity-50"></div>
        <span className="text-[96px] text-zinc-100 font-black relative z-10 font-jp drop-shadow-md">ア</span>
      </div>
      <div className="space-y-3">
        <h2 className="text-3xl font-black text-zinc-100">Welcome</h2>
        <p className="text-zinc-400 text-base max-w-[280px] mx-auto font-medium">
          Master Katakana, Vocabulary, and Japanese Time reading.
        </p>
      </div>
      <button 
        onClick={onFinish} 
        className="mt-12 bg-indigo-500 text-white font-bold py-4 px-12 rounded-full shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all hover:bg-indigo-400 text-lg"
      >
        Start Journey
      </button>
    </motion.div>
  );
}
