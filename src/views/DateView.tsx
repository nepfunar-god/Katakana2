import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Calendar } from 'lucide-react';
import { DATE_DATA } from '../data';
import { speak } from '../utils/tts';
import { playCorrect, playIncorrect, playClick } from '../utils/audio';

export default function DateView() {
  const [xp, setXp] = useState(0);
  const [mode, setMode] = useState<'quiz' | 'type'>('quiz');
  const [question, setQuestion] = useState<any>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [showRef, setShowRef] = useState(false);
  const [typeInput, setTypeInput] = useState('');
  const [flashOpt, setFlashOpt] = useState<{opt: string, isCorrect: boolean} | null>(null);
  const [scriptFormat, setScriptFormatState] = useState<'random' | 'romaji' | 'hiragana' | 'kanji'>(() => {
    return (localStorage.getItem('date_script_fmt') as any) || 'random';
  });
  const scriptFormatRef = useRef(scriptFormat);
  const setScriptFormat = (fmt: 'random' | 'romaji' | 'hiragana' | 'kanji') => {
    setScriptFormatState(fmt);
    scriptFormatRef.current = fmt;
    localStorage.setItem('date_script_fmt', fmt);
  };

  useEffect(() => {
    setXp(parseInt(localStorage.getItem('dm_xp') || '0'));
    generateQuestion();
  }, []);

  const saveStats = (newXp: number) => {
    localStorage.setItem('dm_xp', newXp.toString());
    setXp(newXp);
  };

  const getDayStr = (d: number) => {
    if (DATE_DATA.daysIrreg[d as keyof typeof DATE_DATA.daysIrreg]) return DATE_DATA.daysIrreg[d as keyof typeof DATE_DATA.daysIrreg];
    
    const onesR = ["","ichi","ni","san","yon","go","roku","nana","hachi","kyuu"];
    const tensR = ["","juu","nijuu","sanjuu"];
    const getNumR = (n: number) => {
      if(n < 10) return onesR[n];
      return tensR[Math.floor(n/10)] + (n%10 !== 0 ? " " + onesR[n%10] : "");
    };

    const onesH = ["","いち","に","さん","よん","ご","ろく","なな","はち","きゅう"];
    const tensH = ["","じゅう","にじゅう","さんじゅう"];
    const getNumH = (n: number) => {
      if(n < 10) return onesH[n];
      return tensH[Math.floor(n/10)] + onesH[n%10];
    };

    const onesK = ["","一","二","三","四","五","六","七","八","九"];
    const tensK = ["","十","二十","三十"];
    const getNumK = (n: number) => {
      if(n < 10) return onesK[n];
      return tensK[Math.floor(n/10)] + onesK[n%10];
    };

    return { r: getNumR(d) + " nichi", h: getNumH(d) + "にち", k: getNumK(d) + "日" };
  };

  const getYearStr = (y: number) => {
    let yStr = "";
    let yH = "";
    let yK = "";
    const onesR = ["","ichi","ni","san","yon","go","roku","nana","hachi","kyuu"];
    const tensR = ["","juu","nijuu","sanjuu","yonjuu","gojuu","rokujuu","nanajuu","hachijuu","kyuujuu"];
    const getNumR = (n: number) => {
      if(n < 10) return onesR[n];
      return tensR[Math.floor(n/10)] + (n%10 !== 0 ? " " + onesR[n%10] : "");
    };

    const onesH = ["","いち","に","さん","よん","ご","ろく","なな","はち","きゅう"];
    const tensH = ["","じゅう","にじゅう","さんじゅう","よんじゅう","ごじゅう","ろくじゅう","ななじゅう","はちじゅう","きゅうじゅう"];
    const getNumH = (n: number) => {
      if(n < 10) return onesH[n];
      return tensH[Math.floor(n/10)] + onesH[n%10];
    };

    const onesK = ["","一","二","三","四","五","六","七","八","九"];
    const tensK = ["","十","二十","三十","四十","五十","六十","七十","八十","九十"];
    const getNumK = (n: number) => {
      if(n < 10) return onesK[n];
      return tensK[Math.floor(n/10)] + onesK[n%10];
    };

    if(y === 2000) { yStr = "nisen"; yH = "にせん"; yK = "二千"; }
    else if(y > 2000) { yStr = "nisen " + getNumR(y%100); yH = "にせん" + getNumH(y%100); yK = "二千" + getNumK(y%100); }
    else { yStr = y + ""; yH = y + ""; yK = y + ""; }
    return { r: yStr + " nen", h: yH + "ねん", k: yK + "年" };
  };

  const generateQuestion = (fmt?: string) => {
    const type = Math.random() > 0.5 ? 2 : 1; 
    let d;
    if(Math.random() < 0.6) {
      const keys = Object.keys(DATE_DATA.daysIrreg);
      d = parseInt(keys[Math.floor(Math.random() * keys.length)]);
    } else {
      d = Math.floor(Math.random() * 30) + 1;
    }
    const m = Math.floor(Math.random() * 12);
    const y = 2020 + Math.floor(Math.random() * 10);

    const mStr = DATE_DATA.months[m];
    const mH = DATE_DATA.monthsH[m];
    const mK = DATE_DATA.monthsK[m];
    const dObj = getDayStr(d);
    const yObj = getYearStr(y);
    
    let display, cR, cH, cK;

    if(type === 2) {
      display = `${y}/${m+1}/${d}`;
      cR = `${yObj.r} ${mStr} ${dObj.r}`;
      cH = `${yObj.h}${mH}${dObj.h}`;
      cK = `${yObj.k}${mK}${dObj.k}`;
    } else {
      display = `${m+1}/${d}`;
      cR = `${mStr} ${dObj.r}`;
      cH = `${mH}${dObj.h}`;
      cK = `${mK}${dObj.k}`;
    }

    const qData = {
      display: display,
      correctR: cR.replace(/\s+/g, ' ').trim(),
      correctH: cH,
      correctK: cK,
      audio: type === 2 ? `${y}年${m+1}月${d}日` : `${m+1}月${d}日`,
      valids: [cR, cH, cK.replace(/\s/g,'')]
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
    
    const formatOpt = (mVal: number, dVal: number, yVal: number) => {
      const mStr = DATE_DATA.months[mVal];
      const mH = DATE_DATA.monthsH[mVal];
      const mK = DATE_DATA.monthsK[mVal];
      const dObj = getDayStr(dVal);
      const yObj = getYearStr(yVal);
      
      const isYMD = qData.display.length > 5;
      
      if(isYMD) {
        if (formatType === 0) return `${yObj.r} ${mStr} ${dObj.r}`.replace(/\s+/g, ' ').trim();
        if (formatType === 1) return `${yObj.h}${mH}${dObj.h}`;
        return `${yObj.k}${mK}${dObj.k}`;
      } else {
        if (formatType === 0) return `${mStr} ${dObj.r}`.replace(/\s+/g, ' ').trim();
        if (formatType === 1) return `${mH}${dObj.h}`;
        return `${mK}${dObj.k}`;
      }
    };

    const addOpt = (mVal: number, dVal: number, yVal: number) => {
      let validM = mVal;
      if (validM < 0) validM = 11;
      if (validM > 11) validM = 0;
      let validD = dVal;
      if (validD < 1) validD = 31;
      if (validD > 31) validD = 1;

      const s = formatOpt(validM, validD, yVal);
      if(!opts.includes(s) && s !== correctOpt && !qData.valids.includes(s)) opts.push(s);
    };

    // Confusing options
    addOpt(m, d + 1, y); // Close day
    addOpt(m, d - 1, y); // Close day
    addOpt(m + 1, d, y); // Close month
    addOpt(m - 1, d, y); // Close month
    if (d < 20) addOpt(m, d + 10, y); // Similar sounding day (e.g. 4th vs 14th)
    if (d > 10) addOpt(m, d - 10, y);

    while(opts.length < 4) {
      const rm = Math.floor(Math.random() * 12);
      const rd = Math.floor(Math.random() * 30) + 1;
      const ry = 2020 + Math.floor(Math.random() * 10);
      addOpt(rm, rd, ry);
    }
    
    opts = opts.slice(0, 4);
    setOptions(opts.sort(() => Math.random() - 0.5));
  };

  const handleAnswer = (ans: string, isQuizOpt: boolean = false) => {
    if (flashOpt) return;
    const normAns = ans.trim().toLowerCase().replace(/\s+/g, ' ');
    const normCorrR = question.correctR.trim().toLowerCase().replace(/\s+/g, ' ');
    const normCorrK = question.correctK;
    
    const isC = normAns === normCorrR || normAns === normCorrK || question.valids.some((v: string) => v.toLowerCase().replace(/\s+/g, '') === normAns.replace(/\s+/g, ''));

    if (isQuizOpt) setFlashOpt({ opt: ans, isCorrect: isC });

    if (isC) {
      playCorrect();
      saveStats(xp + 15);
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
    setHistory(prev => [{ display: question.display, isC, ans, correctR: question.correctR, correctK: question.correctK }, ...prev].slice(0, 10));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col w-full max-w-sm mx-auto px-4 h-full pt-4 pb-4">
      <div className="bg-[#1A1D24] p-4 rounded-[20px] shadow-sm mb-4">
        <div className="flex justify-between items-end mb-2 font-bold">
          <span className="text-cyan-400 text-xs tracking-widest uppercase">Calendar XP</span>
          <span className="text-zinc-400 text-xs">{xp} XP</span>
        </div>
        <div className="w-full bg-[#222630] rounded-full overflow-hidden h-2">
          <div className="h-full bg-cyan-500 transition-all duration-500 rounded-full" style={{ width: `${Math.min(100, (xp % 1000) / 10)}%` }}></div>
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
          <div className="text-zinc-500 text-[10px] font-medium uppercase tracking-wider">How do you say this date?</div>
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
            placeholder="e.g. nisen nijuu nen..." 
            autoComplete="off" 
            className="w-full p-3 text-center bg-[#1A1D24] rounded-[16px] text-zinc-100 outline-none focus:ring-1 focus:ring-cyan-500/50 mb-3 shadow-sm placeholder:text-zinc-600 font-medium text-sm"
          />
          <button onClick={() => handleAnswer(typeInput)} className="w-full py-3 bg-cyan-500 text-white font-bold text-sm rounded-full shadow-md active:scale-[0.98] transition-all hover:bg-cyan-400">
            Submit Answer
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-0">
        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-1">Recent History</div>
        <div className="flex flex-col gap-2.5 overflow-y-auto pr-1 pb-2 custom-scrollbar flex-1">
          {history.slice(0, 5).map((h, i) => (
            <div key={i} className={`rounded-[16px] p-3 bg-[#1A1D24] shadow-sm border-l-2 ${h.isC ? 'border-l-cyan-500' : 'border-l-purple-500'} flex-shrink-0`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-black text-base text-zinc-100">{h.display}</span>
                <span className={`font-bold text-xs uppercase tracking-wider ${h.isC ? 'text-cyan-400' : 'text-purple-400'}`}>{h.isC ? 'Correct' : 'Incorrect'}</span>
              </div>
              {!h.isC && mode === 'type' ? (
                <div className="mt-2 pt-2 border-t border-[#222630]">
                  <div className="grid grid-cols-[50px_1fr] gap-x-2 gap-y-1 items-baseline">
                    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Kanji</span> <span className="text-cyan-400 font-jp font-medium text-sm">{h.correctK}</span>
                    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Romaji</span> <span className="text-cyan-400 font-medium text-sm">{h.correctR}</span>
                    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">You</span> <div className="text-purple-400 font-medium text-sm truncate">{h.ans || '_'}</div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-xs text-zinc-400">You: <span className="text-zinc-200 font-medium">{h.ans}</span></div>
                  {!h.isC && <div className="text-xs text-cyan-400 font-medium mt-1">Correct: {h.correctR} / {h.correctK}</div>}
                </>
              )}
            </div>
          ))}
          {history.length === 0 && (
            <div className="text-center text-zinc-600 text-sm py-4">No history yet</div>
          )}
        </div>
      </div>

      <button onClick={() => setShowRef(!showRef)} className="w-full mt-3 py-3 bg-[#1A1D24] text-zinc-400 rounded-full text-sm font-bold flex items-center justify-center gap-2 hover:text-zinc-100 hover:bg-[#222630] transition-all shadow-sm flex-shrink-0">
        <Calendar className="w-5 h-5" /> Date Cheat Sheet
      </button>
      
      <AnimatePresence>
        {showRef && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden flex-shrink min-h-0 flex flex-col">
            <div className="bg-[#1A1D24] rounded-[16px] overflow-hidden shadow-sm overflow-y-auto custom-scrollbar flex-shrink min-h-0">
              <div className="text-cyan-400 font-bold mb-2 mt-4 text-xs px-4 uppercase tracking-wider">Irregular Days</div>
              <table className="w-full text-xs mb-2">
                <tbody>
                  <tr className="border-b border-[#222630]"><td className="p-2 pl-4 text-zinc-400 font-medium">1st</td><td className="p-2 text-zinc-100 font-medium">tsuitachi</td><td className="p-2 pr-4 text-zinc-100 font-jp">ついたち</td></tr>
                  <tr className="border-b border-[#222630]"><td className="p-2 pl-4 text-zinc-400 font-medium">2nd</td><td className="p-2 text-zinc-100 font-medium">futsuka</td><td className="p-2 pr-4 text-zinc-100 font-jp">ふつか</td></tr>
                  <tr className="border-b border-[#222630]"><td className="p-2 pl-4 text-zinc-400 font-medium">3rd</td><td className="p-2 text-zinc-100 font-medium">mikka</td><td className="p-2 pr-4 text-zinc-100 font-jp">みっか</td></tr>
                  <tr className="border-b border-[#222630]"><td className="p-2 pl-4 text-zinc-400 font-medium">4th</td><td className="p-2 text-zinc-100 font-medium">yokka</td><td className="p-2 pr-4 text-zinc-100 font-jp">よっか</td></tr>
                  <tr className="border-b border-[#222630]"><td className="p-2 pl-4 text-zinc-400 font-medium">5th</td><td className="p-2 text-zinc-100 font-medium">itsuka</td><td className="p-2 pr-4 text-zinc-100 font-jp">いつか</td></tr>
                  <tr className="border-b border-[#222630]"><td className="p-2 pl-4 text-zinc-400 font-medium">6th</td><td className="p-2 text-zinc-100 font-medium">muika</td><td className="p-2 pr-4 text-zinc-100 font-jp">むいか</td></tr>
                  <tr className="border-b border-[#222630]"><td className="p-2 pl-4 text-zinc-400 font-medium">7th</td><td className="p-2 text-zinc-100 font-medium">nanoka</td><td className="p-2 pr-4 text-zinc-100 font-jp">なのか</td></tr>
                  <tr className="border-b border-[#222630]"><td className="p-2 pl-4 text-zinc-400 font-medium">8th</td><td className="p-2 text-zinc-100 font-medium">youka</td><td className="p-2 pr-4 text-zinc-100 font-jp">ようか</td></tr>
                  <tr className="border-b border-[#222630]"><td className="p-2 pl-4 text-zinc-400 font-medium">9th</td><td className="p-2 text-zinc-100 font-medium">kokonoka</td><td className="p-2 pr-4 text-zinc-100 font-jp">ここのか</td></tr>
                  <tr className="border-b border-[#222630]"><td className="p-2 pl-4 text-zinc-400 font-medium">10th</td><td className="p-2 text-zinc-100 font-medium">tooka</td><td className="p-2 pr-4 text-zinc-100 font-jp">とおか</td></tr>
                  <tr className="border-b border-[#222630]"><td className="p-2 pl-4 text-zinc-400 font-medium">14th</td><td className="p-2 text-zinc-100 font-medium">juuyokka</td><td className="p-2 pr-4 text-zinc-100 font-jp">じゅうよっか</td></tr>
                  <tr className="border-b border-[#222630]"><td className="p-2 pl-4 text-zinc-400 font-medium">20th</td><td className="p-2 text-zinc-100 font-medium">hatsuka</td><td className="p-2 pr-4 text-zinc-100 font-jp">はつか</td></tr>
                  <tr><td className="p-2 pl-4 text-zinc-400 font-medium">24th</td><td className="p-2 text-zinc-100 font-medium">nijuuyokka</td><td className="p-2 pr-4 text-zinc-100 font-jp">にじゅうよっか</td></tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
