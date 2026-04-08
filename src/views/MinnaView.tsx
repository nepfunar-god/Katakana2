import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronLeft, Upload, Cloud, Zap, BookOpen, Clock, Volume2, RotateCcw } from 'lucide-react';
import { playClick } from '../utils/audio';
import { speak } from '../utils/tts';

type MinnaWord = {
  japanese: string;
  kanji: string;
  nepali: string;
  english: string;
  sentence: string;
};

type MinnaData = Record<string, MinnaWord[]>;

export default function MinnaView() {
  const [data, setData] = useState<MinnaData | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [hardCards, setHardCards] = useState<Record<string, MinnaWord[]>>({});
  const [flashcardMode, setFlashcardMode] = useState<'normal' | 'reverse' | null>(null);
  const [flashcardList, setFlashcardList] = useState<MinnaWord[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('minna_data');
    if (savedData) {
      try {
        setData(JSON.parse(savedData));
      } catch (e) {
        console.error(e);
      }
    }
    const savedHard = localStorage.getItem('minna_hard');
    if (savedHard) {
      try {
        setHardCards(JSON.parse(savedHard));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        let json;
        try {
          json = JSON.parse(text);
        } catch (err) {
          // Fallback for relaxed JSON (e.g., unquoted keys)
          try {
            json = new Function('return (' + text + ')')();
          } catch (innerErr: any) {
            console.error("Function parsing failed:", innerErr);
            setUploadError("Invalid format: " + innerErr.message);
            return;
          }
        }
        
        let formattedData: MinnaData = {};
        
        if (Array.isArray(json)) {
          // If it's an array, group by 'lesson' field
          json.forEach((item: any) => {
            const lessonKey = item.lesson ? `Lesson ${item.lesson}` : 'Lesson 1';
            if (!formattedData[lessonKey]) {
              formattedData[lessonKey] = [];
            }
            formattedData[lessonKey].push(item);
          });
        } else {
          // If it's already an object (e.g. {"Lesson 1": [...]})
          formattedData = json;
        }

        setData(formattedData);
        localStorage.setItem('minna_data', JSON.stringify(formattedData));
        playClick();
      } catch (err: any) {
        console.error(err);
        setUploadError("Failed to process file: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input so the same file can be selected again
  };

  const saveHardCards = (newHard: Record<string, MinnaWord[]>) => {
    setHardCards(newHard);
    localStorage.setItem('minna_hard', JSON.stringify(newHard));
  };

  const markHard = (word: MinnaWord) => {
    playClick();
    const lessonKey = selectedLesson || 'All';
    const currentLessonHard = hardCards[lessonKey] || [];
    if (!currentLessonHard.find(w => w.japanese === word.japanese)) {
      saveHardCards({
        ...hardCards,
        [lessonKey]: [...currentLessonHard, word]
      });
    }
    nextCard();
  };

  const nextCard = () => {
    playClick();
    setIsFlipped(false);
    if (currentCardIdx < flashcardList.length - 1) {
      setCurrentCardIdx(currentCardIdx + 1);
    } else {
      setFlashcardMode(null);
    }
  };

  const startFlashcards = (lesson: string, reverse: boolean = false, onlyHard: boolean = false) => {
    playClick();
    let list: MinnaWord[] = [];
    if (lesson === 'All Hard Cards') {
      Object.values(hardCards).forEach(arr => list.push(...arr));
    } else if (onlyHard) {
      list = hardCards[lesson] || [];
    } else {
      list = data?.[lesson] || [];
    }

    if (list.length === 0) {
      alert('No cards available.');
      return;
    }

    setFlashcardList(list);
    setCurrentCardIdx(0);
    setIsFlipped(false);
    setFlashcardMode(reverse ? 'reverse' : 'normal');
  };

  const lessons = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= 50; i++) {
      arr.push(`Lesson ${i}`);
    }
    return arr;
  }, []);

  const allHardCount = useMemo(() => {
    let count = 0;
    Object.values(hardCards).forEach(arr => count += arr.length);
    return count;
  }, [hardCards]);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mb-6">
          <Upload className="w-10 h-10 text-cyan-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Upload Vocabulary</h2>
        <p className="text-zinc-400 mb-8">Please upload the Minna No Nihongo JSON file to get started.</p>
        
        {uploadError && (
          <div className="bg-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm border border-red-500/30 w-full max-w-md text-left">
            <p className="font-bold mb-1">Upload Failed</p>
            <p className="break-words">{uploadError}</p>
          </div>
        )}

        <label className="bg-cyan-500 hover:bg-cyan-400 text-white px-6 py-3 rounded-xl font-bold cursor-pointer transition-colors shadow-lg active:scale-95">
          Select JSON File
          <input type="file" accept=".json,.txt,application/json,text/plain" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>
    );
  }

  if (flashcardMode) {
    const card = flashcardList[currentCardIdx];
    const isRev = flashcardMode === 'reverse';
    const frontText = isRev ? card.english : (card.kanji || card.japanese);
    
    return (
      <div className="flex flex-col h-full bg-[#0E1117] absolute inset-0 z-50">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <button onClick={() => { playClick(); setFlashcardMode(null); }} className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-bold text-white">{selectedLesson || 'Flashcards'}</h2>
          <div className="w-10" />
        </div>

        <div className="px-4 py-2 flex justify-between items-center text-sm text-zinc-400 bg-[#1A1D24] mx-4 mt-4 rounded-lg">
          <span>Score: 0</span>
          <span>Remaining: {flashcardList.length - currentCardIdx}</span>
        </div>

        <div className="flex-1 p-4 flex flex-col">
          <div 
            className="flex-1 bg-[#1A1D24] rounded-2xl border border-white/5 flex flex-col items-center justify-center p-6 relative cursor-pointer"
            onClick={() => { playClick(); setIsFlipped(!isFlipped); }}
          >
            <div className="text-5xl font-bold text-white mb-8 text-center">
              {frontText}
            </div>

            {isFlipped && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full flex flex-col items-center gap-4">
                <div className="text-center">
                  <div className="text-purple-400 font-bold text-sm mb-1">English:</div>
                  <div className="text-white text-lg">{isRev ? (card.kanji || card.japanese) : card.english}</div>
                </div>
                <div className="text-center">
                  <div className="text-purple-400 font-bold text-sm mb-1">Nepali:</div>
                  <div className="text-white text-lg">{card.nepali}</div>
                </div>
                <div className="w-full h-px bg-white/10 my-2" />
                <div className="w-full flex items-center justify-between gap-3">
                  <div className="text-purple-400 font-bold text-sm shrink-0">Example:</div>
                  <div className="text-white text-sm flex-1 text-left">
                    {card.sentence ? card.sentence.split(card.japanese).map((part, i, arr) => (
                      <React.Fragment key={i}>
                        {part}
                        {i < arr.length - 1 && <span className="text-red-400 font-bold">{card.japanese}</span>}
                      </React.Fragment>
                    )) : 'No example available.'}
                  </div>
                  {card.sentence && (
                    <button onClick={(e) => { e.stopPropagation(); speak(card.sentence, 'ja-JP'); }} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                      <Volume2 className="w-4 h-4 text-zinc-400" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={() => markHard(card)} className="flex-1 py-3 rounded-xl border-2 border-red-500 text-white font-bold hover:bg-red-500/10 active:scale-95 transition-all">
              HARD
            </button>
            <button onClick={nextCard} className="flex-1 py-3 rounded-xl border-2 border-yellow-500 text-white font-bold hover:bg-yellow-500/10 active:scale-95 transition-all">
              GOOD
            </button>
            <button onClick={nextCard} className="flex-1 py-3 rounded-xl border-2 border-green-500 text-white font-bold hover:bg-green-500/10 active:scale-95 transition-all">
              EASY
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2">
            <button onClick={() => speak(card.japanese, 'ja-JP')} className="py-3 bg-[#3B3B7A] rounded-xl text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
              <Volume2 className="w-4 h-4" /> SOUND
            </button>
            <button className="py-3 bg-orange-500 rounded-xl text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
              ▶ AUTO
            </button>
            <button onClick={() => setIsFlipped(!isFlipped)} className="py-3 bg-[#3B3B7A] rounded-xl text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
              FLIP
            </button>
          </div>
          <button onClick={nextCard} className="w-full mt-2 py-3 bg-[#3B3B7A] rounded-xl text-white font-bold active:scale-95 transition-all">
            NEXT
          </button>
        </div>
      </div>
    );
  }

  if (selectedLesson) {
    let list: MinnaWord[] = [];
    if (selectedLesson === 'All Hard Cards') {
      Object.values(hardCards).forEach(arr => list.push(...arr));
    } else {
      list = data?.[selectedLesson] || [];
    }
    const hardCount = selectedLesson === 'All Hard Cards' ? list.length : (hardCards[selectedLesson] || []).length;

    return (
      <div className="flex flex-col h-full bg-[#0E1117] absolute inset-0 z-40">
        <div className="flex items-center p-4 border-b border-white/5 shrink-0 bg-[#11131A]/95 backdrop-blur-md sticky top-0 z-10">
          <button onClick={() => { playClick(); setSelectedLesson(null); }} className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-cyan-400 ml-2">{selectedLesson}</h2>
        </div>

        <div className="flex-1 overflow-y-auto pb-32">
          <div className="flex flex-col">
            {list.map((word, i) => (
              <div key={i} className="flex border-b border-white/5 p-4 items-center">
                <div className="w-1/3 text-lg font-bold text-white">{word.japanese}</div>
                <div className="w-2/3 flex flex-col text-sm">
                  <div className="text-zinc-300"><span className="text-zinc-500 font-bold mr-1">EN:</span>{word.english}</div>
                  <div className="text-zinc-300"><span className="text-zinc-500 font-bold mr-1">NP:</span>{word.nepali}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#11131A] border-t border-white/5 flex flex-col gap-2">
          <button onClick={() => startFlashcards(selectedLesson)} className="w-full py-3.5 bg-[#2DD4BF] text-white font-bold rounded-xl active:scale-95 transition-all">
            START FLASHCARDS
          </button>
          <div className="flex gap-2">
            <button onClick={() => startFlashcards(selectedLesson, false, true)} className="flex-1 py-3.5 bg-[#F43F5E] text-white font-bold rounded-xl active:scale-95 transition-all">
              HARD CARDS ({hardCount})
            </button>
            <button onClick={() => startFlashcards(selectedLesson, true)} className="flex-1 py-3.5 bg-[#F59E0B] text-white font-bold rounded-xl active:scale-95 transition-all">
              START REVERSE FLASHCARDS
            </button>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-3.5 bg-[#A855F7] text-white font-bold rounded-xl active:scale-95 transition-all opacity-50 cursor-not-allowed">
              GENERATE SENTENCES
            </button>
            <button className="flex-1 py-3.5 bg-[#78716C] text-white font-bold rounded-xl active:scale-95 transition-all opacity-50 cursor-not-allowed">
              SHOW SENTENCE HISTORY
            </button>
          </div>
          <button className="w-full py-3.5 bg-[#F97316] text-white font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2">
            <Zap className="w-5 h-5" /> TAKE QUIZ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-[#11131A]/95 backdrop-blur-md py-2.5 z-20 px-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dictionary..." 
            className="w-full bg-[#1A1D24]/80 text-zinc-100 text-sm rounded-full py-2.5 pl-10 pr-4 border border-white/5 focus:bg-[#222630] focus:outline-none transition-colors shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 mt-2">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {lessons.map(lesson => (
            <button 
              key={lesson}
              onClick={() => { playClick(); setSelectedLesson(lesson); }}
              className="py-3 px-2 bg-[#1A1D24] border border-cyan-500/30 rounded-xl text-cyan-400 font-bold text-sm hover:bg-[#222630] active:scale-95 transition-all"
            >
              {lesson}
            </button>
          ))}
          <button 
            className="py-3 px-2 bg-[#1A1D24] border border-amber-500/30 rounded-xl text-amber-500 font-bold text-sm flex items-center justify-center gap-1 hover:bg-[#222630] active:scale-95 transition-all"
          >
            <Zap className="w-4 h-4" /> Quiz All
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {uploadError && (
            <div className="bg-red-500/20 text-red-400 p-3 rounded-xl text-sm border border-red-500/30">
              {uploadError}
            </div>
          )}
          <label className="w-full p-4 bg-[#1A1D24] border border-cyan-500/30 rounded-xl flex items-center justify-between hover:bg-[#222630] active:scale-95 transition-all cursor-pointer">
            <span className="font-bold text-cyan-400 flex items-center gap-2"><Upload className="w-5 h-5" /> Upload Vocabulary JSON</span>
            <input type="file" accept=".json,.txt,application/json,text/plain" className="hidden" onChange={handleFileUpload} />
          </label>
          <button 
            onClick={() => { playClick(); setSelectedLesson('All Hard Cards'); startFlashcards('All Hard Cards'); }}
            className="w-full p-4 bg-[#1A1D24] border border-cyan-500/30 rounded-xl flex items-center justify-between hover:bg-[#222630] active:scale-95 transition-all"
          >
            <span className="font-bold text-cyan-400">Review All Hard Cards</span>
            <span className="text-cyan-400 font-bold">{allHardCount}</span>
          </button>
          <button className="w-full p-4 bg-[#1A1D24] border border-cyan-500/30 rounded-xl flex items-center justify-between hover:bg-[#222630] active:scale-95 transition-all">
            <span className="font-bold text-cyan-400">Imported Decks</span>
            <span className="text-cyan-400 font-bold">{data ? Object.keys(data).length : 0}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
