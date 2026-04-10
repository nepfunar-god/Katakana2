import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Type, Languages, X, Medal, ChevronLeft } from 'lucide-react';
import { RAW_DATA } from '../data';
import { speak } from '../utils/tts';
import { playCorrect, playIncorrect, playClick } from '../utils/audio';
import { ViewState } from '../App';

type QuizState = 'menu' | 'active' | 'results';

export default function QuizView({ setStreak, setView }: { setStreak: (s: number | ((prev: number) => number)) => void; setView: (view: ViewState) => void; key?: string }) {
  const [quizState, setQuizState] = useState<QuizState>('menu');
  const [len, setLen] = useState<number | 'all'>(10);
  const [mode, setMode] = useState<'kana' | 'word'>('kana');
  const [questions, setQuestions] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [options, setOptions] = useState<any[]>([]);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(100);
  const [lang, setLang] = useState('en');
  const [customWords, setCustomWords] = useState<any[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bestTimes, setBestTimes] = useState({ kana: 0, word: 0 });
  const [liveTime, setLiveTime] = useState(0);

  useEffect(() => {
    setLang(localStorage.getItem('kn_lang') || 'en');
    setCustomWords(JSON.parse(localStorage.getItem('kn_custom') || '[]'));
    setBestTimes({
      kana: parseFloat(localStorage.getItem('kn_best_kana') || '0'),
      word: parseFloat(localStorage.getItem('kn_best_word') || '0')
    });
  }, []);

  useEffect(() => {
    const handleBack = (e: Event) => {
      if (quizState !== 'menu') {
        e.preventDefault();
        setQuizState('menu');
      }
    };
    window.addEventListener('hardwareBackButton', handleBack);
    return () => window.removeEventListener('hardwareBackButton', handleBack);
  }, [quizState]);

  const startQuiz = (selectedMode: 'kana' | 'word') => {
    setMode(selectedMode);
    let pool = selectedMode === 'kana' 
      ? [...RAW_DATA.basic, ...RAW_DATA.dakuten] 
      : [...RAW_DATA.words, ...customWords];
    
    pool.sort(() => Math.random() - 0.5);
    if (len !== 'all') {
      pool = pool.slice(0, len as number);
    }
    
    if (pool.length < 4) return alert("Not enough items!");
    
    setQuestions(pool);
    setIndex(0);
    setScore(0);
    setQuizState('active');
    generateOptions(pool[0], pool);
    setTimeLeft(100);
    setStartTime(Date.now());
    setLiveTime(0);
  };

  const generateOptions = (correctItem: any, pool: any[]) => {
    const others = pool.filter(x => x.id !== correctItem.id).sort(() => Math.random() - 0.5).slice(0, 3);
    const opts = [correctItem, ...others].sort(() => Math.random() - 0.5);
    setOptions(opts);
    setSelectedOpt(null);
    setTimeLeft(100);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (quizState === 'active' && selectedOpt === null) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        setLiveTime((Date.now() - startTime) / 1000);
      }, 100);
    }
    return () => clearInterval(timer);
  }, [quizState, selectedOpt, index, startTime]);

  useEffect(() => {
    if (timeLeft <= 0 && quizState === 'active' && selectedOpt === null) {
      handleTimeout();
    }
  }, [timeLeft, quizState, selectedOpt]);

  const handleTimeout = () => {
    setSelectedOpt('timeout');
    setTimeout(() => nextQuestion(), 1000);
  };

  const handleAnswer = (optId: string) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(optId);
    if (optId === questions[index].id) {
      playCorrect();
      setScore(s => s + 10);
      speak(questions[index].c); // Auto-play audio on correct answer
    } else {
      playIncorrect();
    }
    setTimeout(() => nextQuestion(), 1000);
  };

  const nextQuestion = () => {
    if (index + 1 >= questions.length) {
      const finalDuration = (Date.now() - startTime) / 1000;
      setDuration(finalDuration);
      setQuizState('results');
      const acc = Math.round((score / (questions.length * 10)) * 100);
      
      if (acc >= 80) {
        const currentBest = bestTimes[mode];
        if (currentBest === 0 || finalDuration < currentBest) {
          const newBest = { ...bestTimes, [mode]: finalDuration };
          setBestTimes(newBest);
          localStorage.setItem(`kn_best_${mode}`, finalDuration.toString());
        }
        if (acc >= 60) setStreak(s => (s as number) + 1);
      }
    } else {
      setIndex(i => i + 1);
      generateOptions(questions[index + 1], questions);
    }
  };

  if (quizState === 'menu') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full justify-center gap-6 max-w-sm mx-auto px-4 pb-4 relative">
        <button onClick={() => { playClick(); setView('practice'); }} className="absolute top-4 left-4 w-10 h-10 bg-[#1A1D24] text-zinc-400 rounded-full flex items-center justify-center hover:bg-[#222630] hover:text-zinc-200 transition-colors active:scale-95 shadow-sm">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center mb-4 mt-12">
          <h2 className="text-3xl font-black text-zinc-100 tracking-tight">Quiz Arena</h2>
          <p className="text-sm text-zinc-500 mt-2">Test your knowledge and speed</p>
          <div className="flex gap-3 justify-center mt-6">
            {[10, 25, 'all'].map(l => (
              <button 
                key={l} onClick={() => { playClick(); setLen(l as any); }}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95 ${len === l ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20' : 'bg-[#1A1D24] text-zinc-400 hover:bg-[#222630]'}`}
              >
                {l === 'all' ? 'ALL' : l}
              </button>
            ))}
          </div>
        </div>
        
        <button onClick={() => { playClick(); startQuiz('kana'); }} className="group relative overflow-hidden bg-[#1A1D24] p-6 rounded-[28px] text-left active:scale-[0.98] transition-all shadow-sm hover:bg-[#222630]/80">
          <div className="absolute -top-4 -right-4 p-5 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <Type className="w-28 h-28 text-cyan-400" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-zinc-100 mb-2 group-hover:text-cyan-400 transition-colors">Kana Challenge</h3>
            <p className="text-sm text-zinc-500 mb-4">Basic, Dakuten & Handakuten</p>
            <div className="bg-amber-500/10 text-amber-500 text-xs px-3 py-1.5 rounded-full font-bold font-mono inline-flex items-center gap-1.5">
              <Medal className="w-4 h-4" /> Best: {bestTimes.kana > 0 ? `${bestTimes.kana.toFixed(1)}s` : '--:--'}
            </div>
          </div>
        </button>

        <button onClick={() => { playClick(); startQuiz('word'); }} className="group relative overflow-hidden bg-[#1A1D24] p-6 rounded-[28px] text-left active:scale-[0.98] transition-all shadow-sm hover:bg-[#222630]/80">
          <div className="absolute -top-4 -right-4 p-5 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
            <Languages className="w-28 h-28 text-purple-400" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-zinc-100 mb-2 group-hover:text-purple-400 transition-colors">Vocab Master</h3>
            <p className="text-sm text-zinc-500 mb-4">Identify words and meanings</p>
            <div className="bg-amber-500/10 text-amber-500 text-xs px-3 py-1.5 rounded-full font-bold font-mono inline-flex items-center gap-1.5">
              <Medal className="w-4 h-4" /> Best: {bestTimes.word > 0 ? `${bestTimes.word.toFixed(1)}s` : '--:--'}
            </div>
          </div>
        </button>
      </motion.div>
    );
  }

  if (quizState === 'active') {
    const item = questions[index];
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full px-4 relative pt-4 max-w-sm mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => setQuizState('menu')} className="w-10 h-10 bg-[#1A1D24] text-zinc-400 rounded-full flex items-center justify-center hover:bg-[#222630] hover:text-zinc-200 transition-colors active:scale-95"><X className="w-5 h-5" /></button>
          <div className="flex-1 mx-4 h-2.5 bg-[#1A1D24] rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500 transition-all duration-100 ease-linear rounded-full" style={{ width: `${timeLeft}%` }}></div>
          </div>
          <span className="text-xs font-bold font-mono text-zinc-400 bg-[#1A1D24] px-3 py-1.5 rounded-full">{index + 1}/{questions.length}</span>
        </div>

        <div className="absolute top-16 right-4 flex gap-5 text-xs font-bold uppercase tracking-wider text-zinc-500">
          <div className="flex flex-col items-end">Score <span className="text-cyan-400 text-xl font-black leading-none mt-1.5">{score}</span></div>
          <div className="flex flex-col items-end">Time <span className="text-zinc-100 text-xl font-black leading-none mt-1.5">{liveTime.toFixed(1)}<span className="text-xs text-zinc-500 ml-0.5">s</span></span></div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center -mt-10">
          <div className="relative w-full text-center mb-12">
            <div className={`${item.c.length > 5 ? 'text-5xl' : 'text-[80px]'} font-black text-zinc-100 drop-shadow-sm z-10 relative font-jp`}>{item.c}</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-[320px]">
            {options.map(opt => {
              let btnClass = "py-4 bg-[#1A1D24] rounded-[16px] text-zinc-200 font-bold text-base shadow-sm active:scale-95 transition-all hover:bg-[#222630]";
              if (selectedOpt !== null) {
                if (opt.id === item.id) btnClass = "py-4 bg-cyan-500 text-white font-bold text-base shadow-md shadow-cyan-500/20 rounded-[16px]";
                else if (opt.id === selectedOpt) btnClass = "py-4 bg-purple-500 text-white font-bold text-base shadow-md shadow-purple-500/20 rounded-[16px]";
                else btnClass += " opacity-40 scale-95";
              }
              
              let text = opt.r;
              if (mode === 'word') text = lang === 'ne' ? (opt.n || opt.m) : opt.m;

              return (
                <button key={opt.id} onClick={() => handleAnswer(opt.id)} className={btnClass}>
                  {text}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  }

  // Results
  const acc = questions.length > 0 ? Math.round((score / (questions.length * 10)) * 100) : 0;
  const isNewRecord = acc >= 80 && (bestTimes[mode] === 0 || duration <= bestTimes[mode]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full text-center px-4 max-w-sm mx-auto">
      <div className="w-24 h-24 bg-[#1A1D24] rounded-full flex items-center justify-center mb-6 shadow-sm">
        <Trophy className={`w-12 h-12 ${isNewRecord ? 'text-amber-400' : 'text-cyan-400'}`} />
      </div>
      <h2 className="text-3xl font-black text-zinc-100 mb-2">Complete!</h2>
      <p className="text-zinc-500 text-sm mb-8">You've finished the quiz.</p>
      
      <div className="bg-[#1A1D24] p-6 rounded-[28px] w-full max-w-[300px] mb-10 shadow-sm relative overflow-hidden">
        {isNewRecord && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>}
        <div className="flex justify-between items-center">
          <div className="text-left">
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Accuracy</p>
            <p className="text-3xl font-black text-cyan-400">{acc}%</p>
          </div>
          <div className="w-px h-12 bg-[#222630]"></div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Time</p>
            <p className="text-3xl font-black text-zinc-100">{duration.toFixed(1)}<span className="text-base text-zinc-500 ml-0.5">s</span></p>
          </div>
        </div>
        {isNewRecord && <p className="text-xs font-bold text-amber-500 mt-5 flex items-center justify-center gap-1.5 bg-amber-500/10 py-2 rounded-xl"><Medal className="w-4 h-4" /> New Record!</p>}
      </div>

      <button onClick={() => setQuizState('menu')} className="w-full max-w-[300px] py-4 bg-[#222630] text-zinc-100 rounded-full font-bold text-base hover:bg-[#2A2E38] flex items-center justify-center gap-2 active:scale-95 transition-all">
        Back to Menu
      </button>
    </motion.div>
  );
}
