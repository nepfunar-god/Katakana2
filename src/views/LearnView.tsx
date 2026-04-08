import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Volume2, Check, X, PenTool, ChevronRight, ArrowLeft, Languages, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RAW_DATA } from '../data';
import { speak } from '../utils/tts';
import { playClick } from '../utils/audio';
import MinnaView from './MinnaView';

type MainCategory = 'hiragana' | 'katakana' | 'words' | null;
type SubCategory = 'basic' | 'dakuten' | 'handakuten' | null;

function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Resize canvas to match display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    ctx.strokeStyle = '#00E5FF'; // cyan-400
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setLastPos(getPos(e));
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const newPos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(newPos.x, newPos.y);
    ctx.stroke();
    setLastPos(newPos);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="relative w-full aspect-square bg-[#11131A] rounded-[20px] border border-zinc-800 overflow-hidden touch-none shadow-inner">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onTouchCancel={stopDrawing}
        />
      </div>
      <button onClick={clearCanvas} className="text-sm text-pink-400 font-bold self-end hover:text-pink-300 transition-colors px-2 py-1">
        Clear
      </button>
    </div>
  );
}

export default function LearnView() {
  const [activeTab, setActiveTab] = useState<'kana' | 'jlpt'>('kana');
  const [viewMode, setViewMode] = useState<'main' | 'sub' | 'grid'>('main');
  const [mainCat, setMainCat] = useState<MainCategory>(null);
  const [subCat, setSubCat] = useState<SubCategory>(null);
  const [search, setSearch] = useState('');
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [customWords, setCustomWords] = useState<any[]>([]);
  const [lang, setLang] = useState('en');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showDrawing, setShowDrawing] = useState(false);

  useEffect(() => {
    setProgress(JSON.parse(localStorage.getItem('kn_progress') || '{}'));
    setCustomWords(JSON.parse(localStorage.getItem('kn_custom') || '[]'));
    setLang(localStorage.getItem('kn_lang') || 'en');
  }, []);

  const allItems = useMemo(() => [
    ...RAW_DATA.basic, ...RAW_DATA.dakuten, ...RAW_DATA.handakuten, 
    ...RAW_DATA.h_basic, ...RAW_DATA.h_dakuten, ...RAW_DATA.h_handakuten,
    ...RAW_DATA.words, ...customWords
  ], [customWords]);

  const displayedItems = useMemo(() => {
    if (search) {
      const lowerSearch = search.toLowerCase();
      return allItems.filter(i => 
        i.c.includes(lowerSearch) || 
        i.r.toLowerCase().includes(lowerSearch) || 
        (i.m && i.m.toLowerCase().includes(lowerSearch))
      );
    }
    if (mainCat === 'words') return [...RAW_DATA.words, ...customWords];
    if (mainCat === 'hiragana') {
      if (subCat === 'basic') return RAW_DATA.h_basic;
      if (subCat === 'dakuten') return RAW_DATA.h_dakuten;
      if (subCat === 'handakuten') return RAW_DATA.h_handakuten;
    }
    if (mainCat === 'katakana') {
      if (subCat === 'basic') return RAW_DATA.basic;
      if (subCat === 'dakuten') return RAW_DATA.dakuten;
      if (subCat === 'handakuten') return RAW_DATA.handakuten;
    }
    return [];
  }, [mainCat, subCat, search, allItems, customWords]);

  const isWordMode = mainCat === 'words' || (search && displayedItems.length > 0 && displayedItems[0].m);

  const openModal = (item: any) => {
    playClick();
    setSelectedItem(item);
    setShowDrawing(false);
  };

  const markAsKnown = (item: any) => {
    playClick();
    const newProgress = { ...progress, [item.id]: { box: 1, next: Date.now() + 60000 } };
    setProgress(newProgress);
    localStorage.setItem('kn_progress', JSON.stringify(newProgress));
    setSelectedItem(null);
  };

  const selectMainCategory = (cat: MainCategory) => {
    playClick();
    setMainCat(cat);
    setSearch('');
    if (cat === 'words') {
      setViewMode('grid');
    } else {
      setViewMode('sub');
    }
  };

  const selectSubCategory = (cat: SubCategory) => {
    playClick();
    setSubCat(cat);
    setViewMode('grid');
  };

  const goBack = () => {
    playClick();
    if (viewMode === 'grid' && mainCat !== 'words') {
      setViewMode('sub');
    } else {
      setViewMode('main');
      setMainCat(null);
      setSubCat(null);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (e.target.value) {
      setViewMode('grid');
    } else {
      setViewMode('main');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
      <div className="sticky top-0 bg-[#11131A]/95 backdrop-blur-md py-2.5 z-20 space-y-3 mb-2 px-4">
        <div className="flex bg-[#1A1D24] p-1 rounded-xl">
          <button 
            onClick={() => { playClick(); setActiveTab('kana'); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'kana' ? 'bg-cyan-500 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Kana & Vocab
          </button>
          <button 
            onClick={() => { playClick(); setActiveTab('jlpt'); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'jlpt' ? 'bg-cyan-500 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            JLPT
          </button>
        </div>
        {activeTab === 'kana' && (
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              value={search}
              onChange={handleSearch}
              placeholder="Search vocabulary or kana..." 
              className="w-full bg-[#1A1D24]/80 text-zinc-100 text-sm rounded-full py-2.5 pl-10 pr-4 border border-white/5 focus:bg-[#222630] focus:outline-none transition-colors shadow-sm"
            />
          </div>
        )}
      </div>

      {activeTab === 'jlpt' ? (
        <div className="flex-1 overflow-hidden relative">
          <MinnaView />
        </div>
      ) : (
        <>
          {viewMode === 'main' && !search && (
        <div className="flex flex-col gap-2.5 mt-2 px-4 pb-6">
          <button onClick={() => selectMainCategory('hiragana')} className="w-full p-4 bg-[#1A1D24] rounded-[24px] flex items-center gap-4 group active:scale-[0.98] transition-all shadow-sm">
            <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400 shrink-0">
              <span className="text-xl font-bold font-jp">あ</span>
            </div>
            <div className="text-left flex-1">
              <h3 className="text-[15px] font-bold text-zinc-100 mb-0.5">Hiragana</h3>
              <p className="text-[12px] text-zinc-500 font-medium">Native Japanese words</p>
            </div>
            <ChevronRight className="text-zinc-600 w-4 h-4 shrink-0" />
          </button>

          <button onClick={() => selectMainCategory('katakana')} className="w-full p-4 bg-[#1A1D24] rounded-[24px] flex items-center gap-4 group active:scale-[0.98] transition-all shadow-sm">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
              <span className="text-xl font-bold font-jp">ア</span>
            </div>
            <div className="text-left flex-1">
              <h3 className="text-[15px] font-bold text-zinc-100 mb-0.5">Katakana</h3>
              <p className="text-[12px] text-zinc-500 font-medium">Foreign loan words</p>
            </div>
            <ChevronRight className="text-zinc-600 w-4 h-4 shrink-0" />
          </button>

          <button onClick={() => selectMainCategory('words')} className="w-full p-4 bg-[#1A1D24] rounded-[24px] flex items-center gap-4 group active:scale-[0.98] transition-all shadow-sm">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <Languages className="w-5 h-5" />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-[15px] font-bold text-zinc-100 mb-0.5">Vocabulary</h3>
              <p className="text-[12px] text-zinc-500 font-medium">Common words & phrases</p>
            </div>
            <ChevronRight className="text-zinc-600 w-4 h-4 shrink-0" />
          </button>
        </div>
      )}

      {viewMode === 'sub' && !search && (
        <div className="flex flex-col h-full px-4">
          <div className="flex items-center gap-3 mb-4 mt-2">
            <button onClick={goBack} className="w-8 h-8 bg-[#1A1D24] text-zinc-400 rounded-full flex items-center justify-center hover:bg-[#222630] hover:text-zinc-200 transition-colors active:scale-95">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-cyan-400 capitalize">
              {mainCat}
            </span>
          </div>

          <div className="flex flex-col gap-2.5 pb-6">
            <button onClick={() => selectSubCategory('basic')} className="w-full p-4 bg-[#1A1D24] rounded-[24px] flex items-center gap-4 group active:scale-[0.98] transition-all shadow-sm">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                <span className="text-xl font-bold font-jp">{mainCat === 'hiragana' ? 'あ' : 'ア'}</span>
              </div>
              <div className="text-left flex-1">
                <h3 className="text-[15px] font-bold text-zinc-100 mb-0.5">Basic {mainCat === 'hiragana' ? 'Hiragana' : 'Katakana'}</h3>
                <p className="text-[12px] text-zinc-500 font-medium">The 46 fundamental characters</p>
              </div>
              <ChevronRight className="text-zinc-600 w-4 h-4 shrink-0" />
            </button>

            <button onClick={() => selectSubCategory('dakuten')} className="w-full p-4 bg-[#1A1D24] rounded-[24px] flex items-center gap-4 group active:scale-[0.98] transition-all shadow-sm">
              <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                <span className="text-xl font-bold font-jp">{mainCat === 'hiragana' ? 'が' : 'ガ'}</span>
              </div>
              <div className="text-left flex-1">
                <h3 className="text-[15px] font-bold text-zinc-100 mb-0.5">Dakuten (゛)</h3>
                <p className="text-[12px] text-zinc-500 font-medium">Voiced sounds (Ga, Gi, Gu...)</p>
              </div>
              <ChevronRight className="text-zinc-600 w-4 h-4 shrink-0" />
            </button>

            <button onClick={() => selectSubCategory('handakuten')} className="w-full p-4 bg-[#1A1D24] rounded-[24px] flex items-center gap-4 group active:scale-[0.98] transition-all shadow-sm">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                <span className="text-xl font-bold font-jp">{mainCat === 'hiragana' ? 'ぱ' : 'パ'}</span>
              </div>
              <div className="text-left flex-1">
                <h3 className="text-[15px] font-bold text-zinc-100 mb-0.5">Handakuten (゜)</h3>
                <p className="text-[12px] text-zinc-500 font-medium">P-sounds (Pa, Pi, Pu...)</p>
              </div>
              <ChevronRight className="text-zinc-600 w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {(viewMode === 'grid' || search) && (
        <div className="flex flex-col h-full px-4">
          <div className="flex items-center gap-3 mb-4 mt-2">
            <button onClick={goBack} className="w-8 h-8 bg-[#1A1D24] text-zinc-400 rounded-full flex items-center justify-center hover:bg-[#222630] hover:text-zinc-200 transition-colors active:scale-95">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-cyan-400 capitalize">
              {search ? 'Search Results' : subCat ? `${subCat} ${mainCat}` : mainCat}
            </span>
          </div>

          <div className={isWordMode ? "flex flex-col gap-2.5 pb-24" : "grid grid-cols-5 gap-2.5 pb-24 content-start"}>
            {displayedItems.length === 0 && (
              <div className="col-span-full text-center text-zinc-500 mt-8 text-sm">No items found.</div>
            )}
            {displayedItems.map(item => {
              if (item.empty) return <div key={item.id} className="aspect-square" />;
              const known = progress[item.id]?.box > 0;
              if (isWordMode) {
                return (
                  <div key={item.id} onClick={() => openModal(item)} className={`relative bg-[#1A1D24] rounded-[20px] p-3 flex justify-between items-center ring-1 ${known ? 'ring-cyan-500/50' : 'ring-white/10'} active:scale-[0.98] transition cursor-pointer shadow-sm`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#222630] flex items-center justify-center text-cyan-400 font-bold text-lg">
                        {item.c.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-bold text-zinc-100">{item.c}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">{item.r}</span>
                        </div>
                        <div className="text-xs text-zinc-400 font-medium">
                          {item.m || item.r} {lang === 'ne' && item.n && <span className="text-zinc-500 text-[10px] ml-1">({item.n})</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); speak(item.c); }} className="w-8 h-8 rounded-full bg-[#222630] text-zinc-400 flex items-center justify-center hover:text-cyan-400 hover:bg-[#2A2E38] transition-colors active:scale-90">
                        <Volume2 className="w-4 h-4" />
                      </button>
                      {known && <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={item.id} onClick={() => openModal(item)} className={`relative bg-[#1A1D24] rounded-[20px] p-2 flex flex-col items-center justify-center ring-1 ${known ? 'ring-cyan-500/50' : 'ring-white/10'} active:scale-95 transition cursor-pointer shadow-sm aspect-square`}>
                    <span className="text-[28px] font-bold text-zinc-100 text-center leading-tight mb-0.5">{item.c}</span>
                    <span className="text-[10px] text-zinc-500 font-mono font-bold truncate w-full text-center">{item.r}</span>
                    {known && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_6px_rgba(0,229,255,0.5)]"></div>}
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#1A1D24] w-full max-w-sm rounded-[28px] p-5 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className={`${selectedItem.c.length > 5 ? 'text-3xl' : 'text-5xl'} font-black text-zinc-100 leading-none`}>{selectedItem.c}</h3>
                <button onClick={() => setSelectedItem(null)} className="w-8 h-8 rounded-full bg-[#222630] text-zinc-300 flex items-center justify-center hover:bg-[#2A2E38] transition-colors active:scale-90">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-lg text-cyan-400 font-mono font-bold mb-3">{selectedItem.r}</p>
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-zinc-100 font-bold text-lg">{selectedItem.m || selectedItem.r.toUpperCase()}</p>
                <button onClick={() => speak(selectedItem.c)} className="text-cyan-400 p-1.5 bg-cyan-500/10 rounded-full active:scale-90 transition-transform"><Volume2 className="w-4 h-4" /></button>
              </div>
              <p className="text-xs text-zinc-500 font-medium mb-5">{lang === 'ne' ? selectedItem.n : (selectedItem.m ? '' : 'Kana Letter')}</p>
              
              <button 
                onClick={() => setShowDrawing(!showDrawing)} 
                className="w-full py-2.5 bg-[#222630] rounded-xl text-xs font-bold text-zinc-300 mb-3 hover:bg-[#2A2E38] transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <PenTool className="w-3.5 h-3.5" /> Practice Writing
              </button>
              
              {showDrawing && <DrawingCanvas />}

              <button onClick={() => markAsKnown(selectedItem)} className="w-full py-3 bg-gradient-to-r from-cyan-400 to-purple-500 text-white rounded-full font-bold text-sm transition-colors flex items-center justify-center gap-2 active:scale-[0.98] shadow-md shadow-cyan-500/20">
                <Check className="w-4 h-4" /> Mark to Review
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}
