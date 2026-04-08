import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trash2, CheckCircle2, X, ChevronLeft, Folder, Lightbulb } from 'lucide-react';
import { RAW_DATA } from '../data';
import { playClick } from '../utils/audio';

type DrawMode = 'sequence' | 'alphabet';
type AlphabetType = 'hiragana' | 'katakana' | null;
type SubCategory = 'basic' | 'dakuten' | 'handakuten' | null;

const AnimatedKana = ({ charCode, char }: { charCode: string, char: string }) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setSvgContent(null);
    setError(false);
    fetch(`https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${charCode}.svg`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.text();
      })
      .then(text => {
        const cleaned = text.replace(/<g id="kvg:StrokeNumbers_[^>]+>[\s\S]*?<\/g>/, '');
        setSvgContent(cleaned);
      })
      .catch(() => setError(true));
  }, [charCode]);

  if (error) {
    return <span style={{ color: 'black', fontSize: '100px', fontWeight: 'bold', fontFamily: 'sans-serif' }}>{char}</span>;
  }

  if (!svgContent) {
    return <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>;
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center cursor-pointer" onClick={() => setKey(k => k + 1)}>
      <style>{`
        .animated-svg-${key} path {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: drawStroke 0.8s ease-in-out forwards;
          opacity: 0;
        }
        @keyframes drawStroke {
          0% { stroke-dashoffset: 400; opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        .animated-svg-${key} path:nth-child(1) { animation-delay: 0s; }
        .animated-svg-${key} path:nth-child(2) { animation-delay: 0.8s; }
        .animated-svg-${key} path:nth-child(3) { animation-delay: 1.6s; }
        .animated-svg-${key} path:nth-child(4) { animation-delay: 2.4s; }
        .animated-svg-${key} path:nth-child(5) { animation-delay: 3.2s; }
        .animated-svg-${key} path:nth-child(6) { animation-delay: 4.0s; }
        .animated-svg-${key} svg { width: 100%; height: 100%; }
      `}</style>
      <div 
        key={key}
        className={`w-full h-full animated-svg-${key}`} 
        dangerouslySetInnerHTML={{ __html: svgContent }} 
      />
      <div className="absolute bottom-1 right-1 text-[10px] text-zinc-500 bg-zinc-100/80 px-2 py-0.5 rounded font-bold">Tap to replay</div>
    </div>
  );
};

export default function DrawView() {
  const [drawMode, setDrawMode] = useState<DrawMode>('sequence');
  
  // Sequence Mode State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [targetRomaji, setTargetRomaji] = useState<string[]>([]);
  const [targetKana, setTargetKana] = useState<string[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);

  // Alphabet Mode State
  const [alphaType, setAlphaType] = useState<AlphabetType>(null);
  const [subCat, setSubCat] = useState<SubCategory>(null);
  const [userDrawings, setUserDrawings] = useState<Record<string, string>>({});
  const [activeKana, setActiveKana] = useState<{ item: any, type: 'h' | 'k', key: string } | null>(null);
  const [infoKana, setInfoKana] = useState<{ item: any, type: 'h' | 'k', key: string } | null>(null);
  
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);
  const hasDrawnRef = useRef(false);

  const pool = [...RAW_DATA.basic, ...RAW_DATA.dakuten, ...RAW_DATA.handakuten].filter(item => !item.empty);

  const generateNewSet = () => {
    playClick();
    const newSet = [];
    for (let i = 0; i < 5; i++) {
      newSet.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    setTargetRomaji(newSet.map(item => item.r));
    setTargetKana(newSet.map(item => item.k));
    setShowAnswer(false);
    clearCanvas(false);
  };

  useEffect(() => {
    generateNewSet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setupCanvas = (canvas: HTMLCanvasElement, existingImage?: string) => {
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#ffffff';
      
      if (existingImage) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = existingImage;
      }
    }
  };

  useEffect(() => {
    if (drawMode === 'sequence' && canvasRef.current) {
      setupCanvas(canvasRef.current);
    }
  }, [drawMode]);

  useEffect(() => {
    if (activeKana && activeCanvasRef.current) {
      hasDrawnRef.current = !!userDrawings[activeKana.key];
      setupCanvas(activeCanvasRef.current, userDrawings[activeKana.key]);
    }
  }, [activeKana, userDrawings]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, isAlphabet: boolean = false) => {
    e.preventDefault();
    const canvas = isAlphabet ? activeCanvasRef.current : canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
    if (isAlphabet) hasDrawnRef.current = true;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, isAlphabet: boolean = false) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = isAlphabet ? activeCanvasRef.current : canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = (isAlphabet: boolean = false) => {
    if (isAlphabet) playClick();
    const canvas = isAlphabet ? activeCanvasRef.current : canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (isAlphabet) hasDrawnRef.current = false;
  };

  const closeActiveKana = () => {
    playClick();
    if (activeKana && activeCanvasRef.current) {
      if (hasDrawnRef.current) {
        setUserDrawings(prev => ({ ...prev, [activeKana.key]: activeCanvasRef.current!.toDataURL() }));
      } else {
        setUserDrawings(prev => {
          const next = { ...prev };
          delete next[activeKana.key];
          return next;
        });
      }
    }
    setActiveKana(null);
  };

  return (
    <div className="flex flex-col h-full px-4 pb-4 relative">
      <div className="flex bg-[#1A1D24] p-1.5 rounded-[16px] mb-4 mt-2 shadow-sm shrink-0">
        <button onClick={() => { playClick(); setDrawMode('sequence'); }} className={`flex-1 py-2 rounded-[12px] text-sm font-bold transition-all ${drawMode === 'sequence' ? 'text-zinc-100 bg-[#222630]' : 'text-zinc-500'}`}>Sequence</button>
        <button onClick={() => { playClick(); setDrawMode('alphabet'); }} className={`flex-1 py-2 rounded-[12px] text-sm font-bold transition-all ${drawMode === 'alphabet' ? 'text-zinc-100 bg-[#222630]' : 'text-zinc-500'}`}>Alphabet</button>
      </div>

      {drawMode === 'sequence' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col flex-1 min-h-0">
          <div className="mb-4">
            <h2 className="text-2xl font-black text-zinc-100 tracking-tight mb-2">Handwriting Practice</h2>
            <p className="text-sm text-zinc-400">Draw the katakana for the romaji sequence below.</p>
          </div>

          <div className="bg-[#1A1D24] p-4 rounded-2xl shadow-sm mb-4 border border-white/5 shrink-0">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Target Sequence</span>
              <button onClick={generateNewSet} className="text-cyan-400 hover:text-cyan-300 p-1">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-between items-center">
              {targetRomaji.map((romaji, i) => (
                <div key={i} className="flex-1 text-center">
                  <span className="text-xl font-bold text-zinc-100">{romaji}</span>
                </div>
              ))}
            </div>
            
            <AnimatePresence>
              {showAnswer && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="flex justify-between items-center mt-4 pt-4 border-t border-white/10 overflow-hidden"
                >
                  {targetKana.map((kana, i) => (
                    <div key={i} className="flex-1 text-center">
                      <span className="text-3xl font-black text-cyan-400 font-jp">{kana}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 relative bg-[#1A1D24] rounded-2xl shadow-sm border border-white/5 overflow-hidden touch-none mb-4 min-h-[200px]">
            <div className="absolute inset-0 opacity-10 pointer-events-none flex flex-col justify-between py-8">
              <div className="w-full h-px bg-white"></div>
              <div className="w-full h-px bg-white"></div>
              <div className="w-full h-px bg-white"></div>
            </div>
            <canvas
              ref={canvasRef}
              onMouseDown={(e) => startDrawing(e, false)}
              onMouseMove={(e) => draw(e, false)}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onTouchStart={(e) => startDrawing(e, false)}
              onTouchMove={(e) => draw(e, false)}
              onTouchEnd={stopDrawing}
              onTouchCancel={stopDrawing}
              className="w-full h-full cursor-crosshair"
            />
          </div>

          <div className="flex gap-3 shrink-0">
            <button 
              onClick={() => { playClick(); clearCanvas(false); }}
              className="flex-1 py-4 bg-[#222630] text-zinc-300 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#2A2E38] active:scale-95 transition-all"
            >
              <Trash2 className="w-5 h-5" /> Clear
            </button>
            <button 
              onClick={() => { playClick(); setShowAnswer(!showAnswer); }}
              className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all ${showAnswer ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'}`}
            >
              <CheckCircle2 className="w-5 h-5" /> {showAnswer ? 'Hide Answer' : 'Show Answer'}
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col flex-1 min-h-0">
          {!alphaType ? (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <button onClick={() => { playClick(); setAlphaType('hiragana'); }} className="bg-[#1A1D24] p-6 rounded-2xl flex flex-col items-center gap-3 hover:bg-[#222630] transition-colors border border-white/5">
                <Folder className="w-10 h-10 text-cyan-400" />
                <span className="font-bold text-zinc-100">Hiragana</span>
              </button>
              <button onClick={() => { playClick(); setAlphaType('katakana'); }} className="bg-[#1A1D24] p-6 rounded-2xl flex flex-col items-center gap-3 hover:bg-[#222630] transition-colors border border-white/5">
                <Folder className="w-10 h-10 text-purple-400" />
                <span className="font-bold text-zinc-100">Katakana</span>
              </button>
            </div>
          ) : !subCat ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => { playClick(); setAlphaType(null); }} className="w-10 h-10 bg-[#1A1D24] rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-100">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-black text-zinc-100 capitalize">{alphaType}</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <button onClick={() => { playClick(); setSubCat('basic'); }} className="bg-[#1A1D24] p-5 rounded-2xl flex items-center gap-4 hover:bg-[#222630] transition-colors border border-white/5">
                  <Folder className="w-8 h-8 text-cyan-400" />
                  <span className="font-bold text-zinc-100 text-lg">Basic</span>
                </button>
                <button onClick={() => { playClick(); setSubCat('dakuten'); }} className="bg-[#1A1D24] p-5 rounded-2xl flex items-center gap-4 hover:bg-[#222630] transition-colors border border-white/5">
                  <Folder className="w-8 h-8 text-cyan-400" />
                  <span className="font-bold text-zinc-100 text-lg">Dakuten</span>
                </button>
                <button onClick={() => { playClick(); setSubCat('handakuten'); }} className="bg-[#1A1D24] p-5 rounded-2xl flex items-center gap-4 hover:bg-[#222630] transition-colors border border-white/5">
                  <Folder className="w-8 h-8 text-cyan-400" />
                  <span className="font-bold text-zinc-100 text-lg">Handakuten</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full min-h-0">
              <div className="flex items-center gap-3 mb-4 shrink-0">
                <button onClick={() => { playClick(); setSubCat(null); }} className="w-10 h-10 bg-[#1A1D24] rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-100">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-black text-zinc-100 capitalize">{alphaType} - {subCat}</h2>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                <div className="grid grid-cols-5 gap-2">
                  {RAW_DATA[subCat].map((item, i) => {
                    if (item.empty) return <div key={i} />;
                    const key = `${alphaType}_${item.id}`;
                    const drawing = userDrawings[key];
                    return (
                      <button 
                        key={i} 
                        onClick={() => { playClick(); setActiveKana({ item, type: alphaType === 'hiragana' ? 'h' : 'k', key }); }} 
                        className="aspect-square bg-[#1A1D24] rounded-xl flex items-center justify-center border border-white/5 relative overflow-hidden hover:bg-[#222630] transition-colors"
                      >
                        {drawing ? (
                          <img src={drawing} alt={item.r} className="w-full h-full object-contain p-1" />
                        ) : (
                          <span className="text-zinc-400 font-bold text-sm">{item.r}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {infoKana && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4" onClick={() => setInfoKana(null)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#1A1D24] w-full max-w-sm rounded-[28px] p-6 shadow-2xl flex flex-col items-center"
            >
              <div className="w-full flex justify-between items-start mb-4">
                <span className="text-2xl font-black text-white uppercase tracking-widest">{infoKana.item.r}</span>
                <button onClick={() => setInfoKana(null)} className="w-8 h-8 rounded-full bg-[#222630] text-zinc-300 flex items-center justify-center hover:bg-[#2A2E38] transition-colors active:scale-90">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="w-48 h-48 bg-white rounded-2xl mb-6 p-2 flex items-center justify-center shadow-inner relative">
                 <AnimatedKana charCode={infoKana.item.c.charCodeAt(0).toString(16).padStart(5, '0')} char={infoKana.item.c} />
              </div>

              <div className="text-center text-zinc-400 text-sm font-medium mb-6">
                Watch the animation to learn how to draw <span className="text-zinc-200 font-bold">{infoKana.item.c}</span> correctly.
              </div>

              <button 
                onClick={() => {
                  playClick();
                  setInfoKana(null);
                }}
                className="w-full py-4 bg-zinc-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-700 active:scale-95 transition-all shadow-md"
              >
                Close Hint
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeKana && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-50 bg-[#0E1117] flex flex-col"
          >
            <div className="flex justify-between items-center p-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-black text-white uppercase tracking-widest pl-2">{activeKana.item.r}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { playClick(); setInfoKana(activeKana); }} className="w-10 h-10 bg-[#1A1D24] rounded-full flex items-center justify-center text-yellow-400 hover:text-yellow-300 transition-colors border border-yellow-400/20">
                  <Lightbulb className="w-5 h-5" />
                </button>
                <button onClick={() => clearCanvas(true)} className="w-10 h-10 bg-[#1A1D24] rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 relative bg-[#1A1D24] m-4 rounded-2xl overflow-hidden border border-white/10 touch-none">
              <div className="absolute inset-0 opacity-10 pointer-events-none flex flex-col justify-between py-12">
                <div className="w-full h-px bg-white"></div>
                <div className="w-full h-px bg-white"></div>
                <div className="w-full h-px bg-white"></div>
              </div>
              <canvas
                ref={activeCanvasRef}
                onMouseDown={(e) => startDrawing(e, true)}
                onMouseMove={(e) => draw(e, true)}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={(e) => startDrawing(e, true)}
                onTouchMove={(e) => draw(e, true)}
                onTouchEnd={stopDrawing}
                onTouchCancel={stopDrawing}
                className="w-full h-full cursor-crosshair"
              />
            </div>
            <div className="p-4 pt-0 shrink-0 flex flex-col gap-3">
               <div className="text-center text-zinc-500 text-sm font-medium">
                 Draw the {activeKana.type === 'h' ? 'Hiragana' : 'Katakana'} for <span className="text-zinc-300 font-bold">{activeKana.item.r}</span>
               </div>
               <button 
                 onClick={closeActiveKana}
                 className="w-full py-4 bg-cyan-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-cyan-400 active:scale-95 transition-all shadow-md"
               >
                 OK
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
