import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, BookOpen, Settings2, X } from 'lucide-react';
import { TIME_DATA } from '../data';
import { speak } from '../utils/tts';
import { playCorrect, playIncorrect, playClick } from '../utils/audio';

export default function TimeView() {
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [mode, setMode] = useState<'quiz' | 'type'>('quiz');
  const [question, setQuestion] = useState<any>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [showRef, setShowRef] = useState(false);
  const [typeInput, setTypeInput] = useState('');
  const [flashOpt, setFlashOpt] = useState<{opt: string, isCorrect: boolean} | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [requireAmPm, setRequireAmPmState] = useState<boolean>(() => {
    return localStorage.getItem('time_require_ampm') !== 'false';
  });
  const requireAmPmRef = useRef(requireAmPm);
  const setRequireAmPm = (val: boolean) => {
    setRequireAmPmState(val);
    requireAmPmRef.current = val;
    localStorage.setItem('time_require_ampm', val.toString());
    generateQuestion();
  };
  const [scriptFormat, setScriptFormatState] = useState<'random' | 'romaji' | 'hiragana' | 'kanji'>(() => {
    return (localStorage.getItem('time_script_fmt') as any) || 'random';
  });
  const scriptFormatRef = useRef(scriptFormat);
  const setScriptFormat = (fmt: 'random' | 'romaji' | 'hiragana' | 'kanji') => {
    setScriptFormatState(fmt);
    scriptFormatRef.current = fmt;
    localStorage.setItem('time_script_fmt', fmt);
  };

  useEffect(() => {
    setXp(parseInt(localStorage.getItem('tm_xp') || '0'));
    setLevel(parseInt(localStorage.getItem('tm_level') || '1'));
    generateQuestion();
  }, []);

  useEffect(() => {
    const handleBack = (e: Event) => {
      if (showRef) {
        e.preventDefault();
        setShowRef(false);
        return;
      }
      if (showSettings) {
        e.preventDefault();
        setShowSettings(false);
        return;
      }
    };
    window.addEventListener('hardwareBackButton', handleBack);
    return () => window.removeEventListener('hardwareBackButton', handleBack);
  }, [showRef, showSettings]);

  const saveStats = (newXp: number, newLevel: number) => {
    localStorage.setItem('tm_xp', newXp.toString());
    localStorage.setItem('tm_level', newLevel.toString());
    setXp(newXp);
    setLevel(newLevel);
  };

  const getMinStr = (m: number) => {
    if (m === 0) return { r: "", h: "", k: "" };
    if (TIME_DATA.mins[m as keyof typeof TIME_DATA.mins]) return TIME_DATA.mins[m as keyof typeof TIME_DATA.mins];
    const t = Math.floor(m / 10), o = m % 10;
    let tR = "", tH = "", tK = "";
    if (t === 1) { tR = "juu"; tH = "じゅう"; tK = "十"; }
    else if (t === 2) { tR = "nijuu"; tH = "にじゅう"; tK = "二十"; }
    else if (t === 3) { tR = "sanjuu"; tH = "さんじゅう"; tK = "三十"; }
    else if (t === 4) { tR = "yonjuu"; tH = "よんじゅう"; tK = "四十"; }
    else if (t === 5) { tR = "gojuu"; tH = "ごじゅう"; tK = "五十"; }
    const oD = TIME_DATA.mins[o as keyof typeof TIME_DATA.mins];
    return { r: tR + oD.r, h: tH + oD.h, k: tK + oD.k };
  };

  const generateQuestion = (fmt?: string) => {
    const reqAmPm = requireAmPmRef.current;
    const h = Math.floor(Math.random() * 12) + 1;
    const m = Math.floor(Math.random() * 60);
    const isPm = Math.random() < 0.5;
    const perR = isPm ? "gogo" : "gozen";
    const perH = isPm ? "ごご" : "ごぜん";
    const perK = isPm ? "午後" : "午前";
    
    const hD = TIME_DATA.hours[h as keyof typeof TIME_DATA.hours];
    const mD = getMinStr(m);
    
    const cR = reqAmPm ? `${perR} ${hD.r} ${mD.r}`.trim() : `${hD.r} ${mD.r}`.trim();
    const cH = reqAmPm ? `${perH}${hD.h}${mD.h}` : `${hD.h}${mD.h}`;
    const cK = reqAmPm ? `${perK}${hD.k}${mD.k}` : `${hD.k}${mD.k}`;
    let alts = [];
    if (m === 30) {
      if (reqAmPm) {
        alts.push(`${perR} ${hD.r} han`, `${perH}${hD.h}はん`, `${perK}${hD.k}半`);
      } else {
        alts.push(`${hD.r} han`, `${hD.h}はん`, `${hD.k}半`);
      }
    }

    const qData = {
      display: reqAmPm ? `${h}:${m < 10 ? '0' + m : m} ${isPm ? 'PM' : 'AM'}` : `${h}:${m < 10 ? '0' + m : m}`,
      correctR: cR, correctH: cH, correctK: cK,
      audio: reqAmPm ? cK : `${hD.k}${mD.k}`,
      valids: [cR, cH, cK, ...alts]
    };
    setQuestion(qData);
    setTypeInput('');
    setFlashOpt(null);

    let formatType = 0;
    const currentFmt = fmt || scriptFormatRef.current;
    if (currentFmt === 'random') formatType = Math.floor(Math.random() * 3);
    else if (currentFmt === 'romaji') formatType = 0;
    else if (currentFmt === 'hiragana') formatType = 1;
    else if (currentFmt === 'kanji') formatType = 2;

    let correctOpt = qData.correctR;
    if (formatType === 1) correctOpt = qData.correctH;
    else if (formatType === 2) correctOpt = qData.correctK;

    let opts = [correctOpt];

    const formatOpt = (hVal: number, mVal: number, isPmVal: boolean) => {
      const perR = isPmVal ? "gogo" : "gozen";
      const perH = isPmVal ? "ごご" : "ごぜん";
      const perK = isPmVal ? "午後" : "午前";
      const hD = TIME_DATA.hours[hVal as keyof typeof TIME_DATA.hours];
      const mD = getMinStr(mVal);
      
      if (formatType === 0) return reqAmPm ? `${perR} ${hD.r} ${mD.r}`.trim() : `${hD.r} ${mD.r}`.trim();
      if (formatType === 1) return reqAmPm ? `${perH}${hD.h}${mD.h}` : `${hD.h}${mD.h}`;
      return reqAmPm ? `${perK}${hD.k}${mD.k}` : `${hD.k}${mD.k}`;
    };

    const addOpt = (hVal: number, mVal: number, isPmVal: boolean) => {
      let validH = hVal;
      if (validH < 1) validH = 12;
      if (validH > 12) validH = 1;
      let validM = mVal;
      if (validM < 0) validM += 60;
      if (validM >= 60) validM -= 60;

      const s = formatOpt(validH, validM, isPmVal);
      if (!opts.includes(s) && !qData.valids.includes(s)) opts.push(s);
    };

    if (reqAmPm) addOpt(h, m, !isPm); // Wrong AM/PM
    addOpt(h, m + 5, isPm); // Close minute
    addOpt(h, m - 5, isPm); // Close minute
    addOpt(h + 1, m, isPm); // Close hour
    addOpt(h - 1, m, isPm); // Close hour
    if (m === 30) addOpt(h, 0, isPm); // Confuse half past with o'clock

    while (opts.length < 4) {
      const rh = Math.floor(Math.random() * 12) + 1, rm = Math.floor(Math.random() * 60);
      const rper = Math.random() < 0.5;
      addOpt(rh, rm, rper);
    }
    
    opts = opts.slice(0, 4);
    setOptions(opts.sort(() => Math.random() - 0.5));
  };

  const handleAnswer = (ans: string, isQuizOpt: boolean = false) => {
    if (flashOpt) return; 
    const norm = ans.trim().toLowerCase().replace(/\s+/g, ' ');
    const isC = question.valids.some((v: string) => v.toLowerCase().replace(/\s+/g, ' ') === norm);
    
    if (isQuizOpt) setFlashOpt({ opt: ans, isCorrect: isC });

    if (isC) {
      playCorrect();
      let newXp = xp + 20;
      let newLevel = level;
      if (newXp >= 100) { newXp -= 100; newLevel++; }
      saveStats(newXp, newLevel);
      speak(question.audio);
      addHistory(true, ans);
      setTimeout(generateQuestion, 1000);
    } else {
      playIncorrect();
      addHistory(false, ans);
      setTimeout(generateQuestion, 2000);
    }
  };

  const addHistory = (isC: boolean, ans: string) => {
    setHistory(prev => [{ display: question.display, isC, ans, correctR: question.correctR }, ...prev].slice(0, 10));
  };

  if (showSettings) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col w-full max-w-sm mx-auto px-4 h-full pt-4 pb-4">
        <div className="flex items-center justify-between mb-6 mt-2">
          <h2 className="text-2xl font-black text-zinc-100 tracking-tight">Time Settings</h2>
          <button onClick={() => { playClick(); setShowSettings(false); }} className="w-10 h-10 bg-[#1A1D24] rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="bg-[#1A1D24] p-5 rounded-2xl shadow-sm mb-3">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Require AM/PM (Gozen/Gogo)</label>
            <button
              onClick={() => { playClick(); setRequireAmPm(!requireAmPm); }}
              className={`w-12 h-6 rounded-full transition-colors relative ${requireAmPm ? 'bg-cyan-500' : 'bg-[#222630]'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${requireAmPm ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          <p className="text-[10px] text-zinc-500">If enabled, you must include gozen (AM) or gogo (PM) in your answers.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col w-full max-w-sm mx-auto px-4 h-full pt-4 pb-4">
      <div className="bg-[#1A1D24] p-4 rounded-[20px] shadow-sm mb-4 relative">
        <button 
          onClick={() => { playClick(); setShowSettings(true); }}
          className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <Settings2 className="w-5 h-5" />
        </button>
        <div className="flex justify-between items-end mb-2 font-bold pr-8">
          <span className="text-cyan-400 text-xs tracking-widest uppercase">Level {level}</span>
          <span className="text-zinc-500 text-xs uppercase tracking-wider">{xp} / 100 XP</span>
        </div>
        <div className="w-full bg-[#222630] rounded-full overflow-hidden h-2">
          <div className="h-full bg-cyan-500 transition-all duration-500 rounded-full" style={{ width: `${xp}%` }}></div>
        </div>
      </div>

      <div className="flex bg-[#1A1D24] p-1.5 rounded-[16px] mb-3 shadow-sm">
        <button onClick={() => { playClick(); setMode('quiz'); }} className={`flex-1 text-center py-2 rounded-[12px] text-sm font-bold transition-all ${mode === 'quiz' ? 'text-zinc-100 bg-[#222630] shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Quiz Mode</button>
        <button onClick={() => { playClick(); setMode('type'); }} className={`flex-1 text-center py-2 rounded-[12px] text-sm font-bold transition-all ${mode === 'type' ? 'text-zinc-100 bg-[#222630] shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Typing Mode</button>
      </div>

      {mode === 'quiz' && (
        <div className="flex bg-[#1A1D24] p-1.5 rounded-[16px] mb-5 shadow-sm">
          {(['random', 'romaji', 'hiragana', 'kanji'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => { playClick(); setScriptFormat(fmt); generateQuestion(fmt); }}
              className={`flex-1 text-center py-2 rounded-[12px] text-xs font-bold transition-all capitalize ${scriptFormat === fmt ? 'text-zinc-100 bg-[#222630] shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {fmt}
            </button>
          ))}
        </div>
      )}

      {question && (
        <div className="text-center mb-4 relative px-4">
          <div className="text-5xl font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.2)] tracking-tighter tabular-nums leading-none mb-2">{question.display}</div>
          <button onClick={() => speak(question.audio)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#1A1D24] text-zinc-400 flex items-center justify-center hover:bg-[#222630] hover:text-cyan-400 transition-colors shadow-sm active:scale-95">
            <Volume2 className="w-4 h-4" />
          </button>
          <div className="text-zinc-500 text-[10px] font-medium uppercase tracking-wider">What time is this in Japanese?</div>
        </div>
      )}

      {mode === 'quiz' ? (
        <div className="grid grid-cols-2 gap-2 w-full mb-4">
          {options.map(opt => {
            let btnClass = "bg-[#1A1D24] p-3 rounded-[16px] text-zinc-100 font-medium font-jp text-sm shadow-sm active:scale-[0.98] transition-all flex items-center justify-center text-center min-h-[56px] break-words hover:bg-[#222630]";
            if (flashOpt?.opt === opt) {
              btnClass = flashOpt.isCorrect 
                ? "bg-cyan-500 text-white p-3 rounded-[16px] font-medium font-jp text-sm shadow-md flex items-center justify-center text-center min-h-[56px] break-words scale-[1.02] transition-all" 
                : "bg-purple-500 text-white p-3 rounded-[16px] font-medium font-jp text-sm shadow-md flex items-center justify-center text-center min-h-[56px] break-words scale-[0.98] transition-all";
            }
            return (
              <button key={opt} onClick={() => handleAnswer(opt, true)} className={btnClass}>
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="w-full mb-4">
          <input 
            type="text" 
            value={typeInput}
            onChange={e => setTypeInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAnswer(typeInput)}
            placeholder={requireAmPm ? "e.g. gozen kuji, 午前九時" : "e.g. kuji, 九時"} 
            autoComplete="off" 
            className="w-full p-3 text-center bg-[#1A1D24] rounded-[16px] text-zinc-100 outline-none focus:ring-1 focus:ring-cyan-500/50 mb-3 shadow-sm placeholder:text-zinc-600 font-medium text-sm"
          />
          <button onClick={() => handleAnswer(typeInput)} className="w-full py-3 bg-cyan-500 text-white font-bold text-sm rounded-full shadow-md active:scale-[0.98] transition-all hover:bg-cyan-400">
            Submit Answer
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0">
        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-1">Practice History</div>
        <div className="flex flex-col gap-2.5 overflow-y-auto pr-1 pb-2 custom-scrollbar flex-1">
          {history.slice(0, 5).map((h, i) => (
            <div key={i} className={`rounded-[16px] p-3 flex items-center justify-between ${h.isC ? 'bg-cyan-500/10 ring-1 ring-cyan-500/20' : 'bg-purple-500/10 ring-1 ring-purple-500/20'} flex-shrink-0`}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-black text-base text-zinc-100">{h.display}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${h.isC ? 'bg-cyan-500/20 text-cyan-400' : 'bg-purple-500/20 text-purple-400'}`}>{h.isC ? 'Correct' : 'Incorrect'}</span>
                </div>
                <div className="text-xs text-zinc-400">You: <span className="text-zinc-200 font-jp">{h.ans}</span></div>
                {!h.isC && <div className="text-xs text-cyan-400 mt-1 font-jp font-medium">Ans: {h.correctR}</div>}
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <div className="text-center text-zinc-600 text-sm py-4">No history yet</div>
          )}
        </div>
      </div>

      <button onClick={() => setShowRef(!showRef)} className="w-full mt-3 py-3 bg-[#1A1D24] text-zinc-400 rounded-full text-sm font-bold flex items-center justify-center gap-2 hover:text-zinc-100 hover:bg-[#222630] transition-all shadow-sm flex-shrink-0">
        <BookOpen className="w-5 h-5" /> Show Cheat Sheet
      </button>
      
      <AnimatePresence>
        {showRef && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden flex-shrink min-h-0 flex flex-col">
            <div className="text-cyan-400 font-bold mb-2 mt-2 text-xs uppercase tracking-wider px-2 flex-shrink-0">Hours (Ji)</div>
            <div className="bg-[#1A1D24] rounded-[16px] overflow-hidden shadow-sm overflow-y-auto custom-scrollbar flex-shrink min-h-0">
              <table className="w-full border-collapse text-xs">
                <tbody>
                  <tr><td className="p-2 border-b border-[#222630] text-zinc-300">4:00</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">yoji</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">四時</td></tr>
                  <tr><td className="p-2 border-b border-[#222630] text-zinc-300">7:00</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">shichiji</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">七時</td></tr>
                  <tr><td className="p-2 text-zinc-300">9:00</td><td className="p-2 text-zinc-300 font-jp">kuji</td><td className="p-2 text-zinc-300 font-jp">九時</td></tr>
                </tbody>
              </table>
            </div>
            <div className="text-cyan-400 font-bold mb-2 mt-3 text-xs uppercase tracking-wider px-2 flex-shrink-0">Minutes (1-10)</div>
            <div className="bg-[#1A1D24] rounded-[16px] overflow-hidden shadow-sm overflow-y-auto custom-scrollbar mb-1 flex-shrink min-h-0">
              <table className="w-full border-collapse text-xs">
                <tbody>
                  <tr><td className="p-2 border-b border-[#222630] text-zinc-300">1</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">ippun</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">いっぷん</td></tr>
                  <tr><td className="p-2 border-b border-[#222630] text-zinc-300">2</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">nifun</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">にふん</td></tr>
                  <tr><td className="p-2 border-b border-[#222630] text-zinc-300">3</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">sanpun</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">さんぷん</td></tr>
                  <tr><td className="p-2 border-b border-[#222630] text-zinc-300">4</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">yonpun</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">よんぷん</td></tr>
                  <tr><td className="p-2 border-b border-[#222630] text-zinc-300">5</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">gofun</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">ごふん</td></tr>
                  <tr><td className="p-2 border-b border-[#222630] text-zinc-300">6</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">roppun</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">ろっぷん</td></tr>
                  <tr><td className="p-2 border-b border-[#222630] text-zinc-300">7</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">nanafun</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">ななふん</td></tr>
                  <tr><td className="p-2 border-b border-[#222630] text-zinc-300">8</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">happun</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">はっぷん</td></tr>
                  <tr><td className="p-2 border-b border-[#222630] text-zinc-300">9</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">kyuufun</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">きゅうふん</td></tr>
                  <tr><td className="p-2 border-b border-[#222630] text-zinc-300">10</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">juppun</td><td className="p-2 border-b border-[#222630] text-zinc-300 font-jp">じゅっぷん</td></tr>
                  <tr><td className="p-2 text-zinc-300">30</td><td className="p-2 text-zinc-300 font-jp">han (half)</td><td className="p-2 text-zinc-300 font-jp">半</td></tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
