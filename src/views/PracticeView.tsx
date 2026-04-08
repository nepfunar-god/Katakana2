import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Check, Shuffle, Layers, Crown, ChartBar, Play, X } from 'lucide-react';
import { RAW_DATA } from '../data';
import { speak } from '../utils/tts';
import { playClick, playFlip } from '../utils/audio';

export default function PracticeView() {
  const [queue, setQueue] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [lang, setLang] = useState('en');
  const [customWords, setCustomWords] = useState<any[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [pracType, setPracType] = useState<'kana' | 'word'>('kana');
  const [pracCount, setPracCount] = useState<number | 'all'>(20);
  const [streak, setStreak] = useState(0);
  const [timeXp, setTimeXp] = useState(0);

  const allItems = useMemo(() => [
    ...RAW_DATA.basic, ...RAW_DATA.dakuten, ...RAW_DATA.handakuten, ...RAW_DATA.words, ...customWords
  ], [customWords]);

  useEffect(() => {
    const prog = JSON.parse(localStorage.getItem('kn_progress') || '{}');
    setProgress(prog);
    const custom = JSON.parse(localStorage.getItem('kn_custom') || '[]');
    setCustomWords(custom);
    setLang(localStorage.getItem('kn_lang') || 'en');
    setStreak(parseInt(localStorage.getItem('kn_streak') || '0'));
    
    const tmXp = parseInt(localStorage.getItem('tm_xp') || '0');
    const tmLevel = parseInt(localStorage.getItem('tm_level') || '1');
    setTimeXp(tmXp + ((tmLevel - 1) * 100));
  }, []);

  const startPractice = () => {
    let pool = [];
    if (pracType === 'kana') {
      pool = [...RAW_DATA.basic, ...RAW_DATA.dakuten, ...RAW_DATA.handakuten];
    } else {
      pool = [...RAW_DATA.words, ...customWords];
    }

    if (pool.length === 0) return;

    pool.sort(() => Math.random() - 0.5);
    if (pracCount !== 'all') {
      pool = pool.slice(0, pracCount);
    }

    setQueue(pool);
    setIndex(0);
    setFlipped(false);
    setIsActive(true);
  };

  const rateCard = (rating: number) => {
    playClick();
    const item = queue[index];
    const newProgress = { ...progress };
    if (!newProgress[item.id]) newProgress[item.id] = { box: 0, next: 0 };
    
    const p = newProgress[item.id];
    if (rating === 1) {
      p.box = 1;
      p.next = Date.now() + 60000;
    } else {
      p.box += (rating === 5 ? 1 : 0.5);
      p.next = Date.now() + (Math.pow(2.5, Math.floor(p.box)) * 60000);
    }
    
    setProgress(newProgress);
    localStorage.setItem('kn_progress', JSON.stringify(newProgress));
    
    setFlipped(false);
    setTimeout(() => setIndex(i => i + 1), 150);
  };

  if (!isActive) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm mx-auto flex flex-col gap-5 pt-4 px-4 pb-4">
        <div className="bg-[#1A1D24] rounded-[28px] p-6 shadow-sm relative overflow-hidden">
          <div className="absolute -top-4 -right-4 p-3 opacity-[0.03]"><Crown className="w-24 h-24 text-white" /></div>
          <h3 className="text-lg font-bold text-zinc-100 mb-5 flex items-center gap-2"><ChartBar className="w-5 h-5 text-amber-500" /> Your Stats</h3>
          <div className="flex justify-between items-end relative z-10">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Streak</p>
              <p className="text-4xl font-black text-zinc-100">{streak}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Time XP</p>
              <p className="text-4xl font-black text-cyan-400">{timeXp}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#1A1D24] p-5 rounded-[28px]">
            <label className="block text-xs text-zinc-500 uppercase font-bold tracking-wider mb-4">1. Choose Content</label>
            <div className="flex gap-3">
              <button onClick={() => { playClick(); setPracType('kana'); }} className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${pracType === 'kana' ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/50' : 'text-zinc-400 bg-[#222630]/50 hover:bg-[#222630]'}`}>Kana</button>
              <button onClick={() => { playClick(); setPracType('word'); }} className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${pracType === 'word' ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/50' : 'text-zinc-400 bg-[#222630]/50 hover:bg-[#222630]'}`}>Words</button>
            </div>
          </div>
          <div className="bg-[#1A1D24] p-5 rounded-[28px]">
            <label className="block text-xs text-zinc-500 uppercase font-bold tracking-wider mb-4">2. Flashcard Count</label>
            <div className="grid grid-cols-4 gap-3">
              {[20, 50, 100, 'all'].map(cnt => (
                <button key={cnt} onClick={() => { playClick(); setPracCount(cnt as any); }} className={`py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 ${pracCount === cnt ? 'bg-[#2A2E38] text-zinc-100' : 'text-zinc-400 bg-[#222630]/50 hover:bg-[#222630]'}`}>
                  {cnt === 'all' ? 'ALL' : cnt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={() => { playClick(); startPractice(); }} className="w-full py-4 bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-bold rounded-full shadow-md shadow-cyan-500/20 text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all mt-2">
          Start Review <Play className="w-5 h-5" fill="currentColor" />
        </button>
      </motion.div>
    );
  }

  if (queue.length === 0 || index >= queue.length) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center px-4 max-w-sm mx-auto">
        <div className="w-24 h-24 bg-[#1A1D24] rounded-full flex items-center justify-center mb-6 shadow-sm">
          <Check className="w-12 h-12 text-cyan-400" />
        </div>
        <h3 className="text-2xl font-bold text-zinc-100 mb-2">Session Complete!</h3>
        <p className="text-zinc-500 text-sm mb-8">Great job reviewing your flashcards.</p>
        <button onClick={() => setIsActive(false)} className="w-full max-w-[280px] py-4 bg-[#222630] text-zinc-100 rounded-full font-bold text-base hover:bg-[#2A2E38] flex items-center justify-center gap-2 active:scale-95 transition-all">
          Back to Menu
        </button>
      </motion.div>
    );
  }

  const item = queue[index];

  const getTextSizeClass = (text: string) => {
    const len = text.length;
    if (len <= 2) return 'text-[80px]';
    if (len === 3) return 'text-[60px]';
    if (len === 4) return 'text-[48px]';
    if (len === 5) return 'text-[40px]';
    if (len === 6) return 'text-[32px]';
    return 'text-[28px]';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full pb-4 px-4 relative max-w-sm mx-auto w-full">
      <button onClick={() => { playClick(); setIsActive(false); }} className="absolute top-4 left-4 w-10 h-10 bg-[#1A1D24] text-zinc-400 rounded-full flex items-center justify-center hover:bg-[#222630] hover:text-zinc-200 transition-colors active:scale-95 z-20 shadow-sm">
        <X className="w-5 h-5" />
      </button>
      <div className="absolute top-5 right-4 text-sm font-mono text-zinc-500 font-bold bg-[#1A1D24] px-3 py-1.5 rounded-full shadow-sm">{index + 1} / {queue.length}</div>

      <div className="w-full max-w-[300px] aspect-[3/4] relative perspective-1000 z-10 mt-20" onClick={() => { if(!flipped) { playFlip(); setFlipped(true); speak(item.c); } }}>
        <motion.div 
          className="relative w-full h-full text-center transform-style-3d cursor-pointer"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 260, damping: 25 }}
        >
          {/* Front */}
          <div className="absolute w-full h-full backface-hidden bg-[#1A1D24] rounded-[32px] shadow-lg flex flex-col items-center justify-center p-6 hover:bg-[#222630]/80 transition-colors border border-[#222630]" style={{ backfaceVisibility: 'hidden' }}>
            <div className="absolute top-6 right-6 w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse shadow-[0_0_10px_rgba(213,0,249,0.6)]"></div>
            <span className="text-zinc-500 text-xs uppercase tracking-widest mb-10 font-bold">Tap to Reveal</span>
            <div className={`${getTextSizeClass(item.c)} font-jp font-black text-zinc-100 mb-8 drop-shadow-sm whitespace-nowrap tracking-tighter w-full text-center px-2`}>{item.c}</div>
          </div>
          {/* Back */}
          <div className="absolute w-full h-full backface-hidden bg-[#1A1D24] rounded-[32px] shadow-lg flex flex-col items-center justify-center p-6 ring-1 ring-cyan-500/20" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <span className="text-2xl text-cyan-400 font-bold font-mono mb-3 bg-cyan-500/10 px-4 py-1.5 rounded-xl">{item.r}</span>
            <div className="w-12 h-1.5 bg-[#222630] rounded-full my-5"></div>
            <p className="text-2xl text-zinc-100 font-bold text-center leading-snug">{item.m || item.r.toUpperCase()}</p>
            <p className="text-sm text-zinc-500 mt-3 text-center font-medium">{lang === 'ne' ? item.n : ''}</p>
            <button onClick={(e) => { e.stopPropagation(); speak(item.c); }} className="mt-8 w-12 h-12 rounded-full bg-[#222630] text-zinc-300 flex items-center justify-center active:scale-90 transition-transform hover:bg-[#2A2E38] hover:text-cyan-400 shadow-sm">
              <Volume2 className="w-6 h-6" />
            </button>
          </div>
        </motion.div>
      </div>

      <div className="h-[80px] mt-10 w-full max-w-[300px]">
        <AnimatePresence>
          {flipped && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="w-full flex justify-between gap-3"
            >
              <button onClick={() => rateCard(1)} className="flex-1 py-4 bg-[#1A1D24] text-purple-400 rounded-2xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform ring-1 ring-purple-500/20 hover:bg-purple-500/10 shadow-sm">Again</button>
              <button onClick={() => rateCard(3)} className="flex-1 py-4 bg-[#1A1D24] text-blue-400 rounded-2xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform ring-1 ring-blue-500/20 hover:bg-blue-500/10 shadow-sm">Hard</button>
              <button onClick={() => rateCard(5)} className="flex-1 py-4 bg-[#1A1D24] text-cyan-400 rounded-2xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-transform ring-1 ring-cyan-500/20 hover:bg-cyan-500/10 shadow-sm">Good</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
