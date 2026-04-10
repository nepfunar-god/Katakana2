import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronLeft, Cloud, Zap, BookOpen, Clock, Volume2, RotateCcw } from 'lucide-react';
import { playClick } from '../utils/audio';
import { speak } from '../utils/tts';
import { setupNotifications } from '../utils/notifications';

import { vocabulary } from '../data/vocabulary';

type MinnaWord = {
  japanese: string;
  kanji: string;
  nepali: string;
  english: string;
  sentence: string;
  lesson?: string;
};

type MinnaData = Record<string, MinnaWord[]>;

export default function MinnaView({ onBack }: { onBack?: () => void }) {
  const [data, setData] = useState<MinnaData | null>(vocabulary as MinnaData);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [hardCards, setHardCards] = useState<Record<string, MinnaWord[]>>({});
  const [flashcardMode, setFlashcardMode] = useState<'normal' | 'reverse' | null>(null);
  const [flashcardList, setFlashcardList] = useState<MinnaWord[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHardReviewMode, setIsHardReviewMode] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);

  useEffect(() => {
    const savedHard = localStorage.getItem('minna_hard');
    if (savedHard) {
      try {
        setHardCards(JSON.parse(savedHard));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    const handleBack = (e: Event) => {
      if (flashcardMode !== null) {
        e.preventDefault();
        setFlashcardMode(null);
        return;
      }
      if (selectedLesson !== null) {
        e.preventDefault();
        setSelectedLesson(null);
        return;
      }
      if (search !== '') {
        e.preventDefault();
        setSearch('');
        return;
      }
      if (onBack) {
        e.preventDefault();
        onBack();
      }
    };
    window.addEventListener('hardwareBackButton', handleBack);
    return () => window.removeEventListener('hardwareBackButton', handleBack);
  }, [flashcardMode, selectedLesson, search, onBack]);

  const saveHardCards = (newHard: Record<string, MinnaWord[]>) => {
    setHardCards(newHard);
    localStorage.setItem('minna_hard', JSON.stringify(newHard));
    const interval = parseInt(localStorage.getItem('minna_notification_interval') || '0', 10);
    setupNotifications(interval);
  };

  const markHard = (word: MinnaWord) => {
    playClick();
    const lessonKey = word.lesson || selectedLesson || 'All';
    const currentLessonHard = hardCards[lessonKey] || [];
    if (!currentLessonHard.find(w => w.japanese === word.japanese)) {
      saveHardCards({
        ...hardCards,
        [lessonKey]: [...currentLessonHard, word]
      });
    }
    nextCard();
  };

  const removeHard = (word: MinnaWord) => {
    playClick();
    const newHardCards = { ...hardCards };
    let removed = false;
    
    Object.keys(newHardCards).forEach(lessonKey => {
      const initialLength = newHardCards[lessonKey].length;
      newHardCards[lessonKey] = newHardCards[lessonKey].filter(w => w.japanese !== word.japanese);
      if (newHardCards[lessonKey].length !== initialLength) {
        removed = true;
      }
    });

    if (removed) {
      saveHardCards(newHardCards);
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
      setIsAutoMode(false);
    }
  };

  const startFlashcards = (lesson: string, reverse: boolean = false, onlyHard: boolean = false) => {
    playClick();
    let list: MinnaWord[] = [];
    if (lesson === 'All Hard Cards') {
      (Object.values(hardCards) as MinnaWord[][]).forEach(arr => list.push(...arr));
    } else if (lesson.startsWith('Hard Cards: ')) {
      const baseLesson = lesson.replace('Hard Cards: ', '');
      list = hardCards[baseLesson] || [];
    } else if (onlyHard) {
      list = hardCards[lesson] || [];
    } else {
      list = data?.[lesson] || [];
    }

    if (list.length === 0) {
      alert('No cards available.');
      return;
    }

    let listToUse = [...list];
    const isRandomOrder = localStorage.getItem('minna_flashcard_order') === 'random';
    if (isRandomOrder) {
      listToUse.sort(() => Math.random() - 0.5);
    }

    setFlashcardList(listToUse);
    setCurrentCardIdx(0);
    setIsFlipped(false);
    setIsHardReviewMode(onlyHard || lesson === 'All Hard Cards' || lesson.startsWith('Hard Cards: '));
    setIsAutoMode(false);
    setFlashcardMode(reverse ? 'reverse' : 'normal');
  };

  useEffect(() => {
    let isCancelled = false;
    let timeout: NodeJS.Timeout;

    const runAuto = async () => {
      if (isAutoMode && flashcardMode && flashcardList.length > 0) {
        const card = flashcardList[currentCardIdx];
        if (!card) return;

        const autoLang = localStorage.getItem('minna_auto_audio_lang') || 'en';

        if (!isFlipped) {
          // Front
          const textToSpeak = flashcardMode === 'reverse' ? (autoLang === 'en' ? card.english : card.nepali) : card.japanese;
          const langCode = flashcardMode === 'reverse' ? (autoLang === 'en' ? 'en-US' : 'ne-NP') : 'ja-JP';
          
          await speak(textToSpeak, langCode);
          if (isCancelled) return;
          
          timeout = setTimeout(() => {
            if (!isCancelled) setIsFlipped(true);
          }, 3000);
        } else {
          // Back
          const textToSpeak = flashcardMode === 'reverse' ? card.japanese : (autoLang === 'en' ? card.english : card.nepali);
          const langCode = flashcardMode === 'reverse' ? 'ja-JP' : (autoLang === 'en' ? 'en-US' : 'ne-NP');
          
          await speak(textToSpeak, langCode);
          if (isCancelled) return;
          
          timeout = setTimeout(() => {
            if (!isCancelled) nextCard();
          }, 3000);
        }
      }
    };

    runAuto();

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [isAutoMode, isFlipped, currentCardIdx, flashcardMode, flashcardList]);

  const lessons = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= 50; i++) {
      arr.push(`Lesson ${i}`);
    }
    return arr;
  }, []);

  const allHardCount = useMemo(() => {
    let count = 0;
    (Object.values(hardCards) as MinnaWord[][]).forEach(arr => count += arr.length);
    return count;
  }, [hardCards]);

  const playManualSound = () => {
    if (!flashcardMode || flashcardList.length === 0) return;
    const card = flashcardList[currentCardIdx];
    if (!card) return;

    const autoLang = localStorage.getItem('minna_auto_audio_lang') || 'en';
    let textToSpeak = '';
    let langCode = '';

    if (!isFlipped) {
      textToSpeak = flashcardMode === 'reverse' ? (autoLang === 'en' ? card.english : card.nepali) : card.japanese;
      langCode = flashcardMode === 'reverse' ? (autoLang === 'en' ? 'en-US' : 'ne-NP') : 'ja-JP';
    } else {
      textToSpeak = flashcardMode === 'reverse' ? card.japanese : (autoLang === 'en' ? card.english : card.nepali);
      langCode = flashcardMode === 'reverse' ? 'ja-JP' : (autoLang === 'en' ? 'en-US' : 'ne-NP');
    }
    
    speak(textToSpeak, langCode);
  };

  const getJapaneseTextSizeClass = (text: string) => {
    if (!text) return 'text-6xl sm:text-7xl';
    const len = text.length;
    if (len <= 4) return 'text-6xl sm:text-7xl';
    if (len <= 6) return 'text-5xl sm:text-6xl';
    if (len <= 8) return 'text-4xl sm:text-5xl';
    if (len <= 12) return 'text-3xl sm:text-4xl';
    return 'text-2xl sm:text-3xl';
  };

  const highlightSentence = (sentence: string, kanji?: string, japanese?: string) => {
    if (!sentence) return null;
    
    let target = kanji || japanese || '';
    let matchStr = '';
    
    for (let i = target.length; i > 0; i--) {
      const prefix = target.substring(0, i);
      if (sentence.includes(prefix)) {
        const isKanji = /[\u4e00-\u9faf]/.test(prefix);
        if (prefix.length > 1 || isKanji || target.length === 1) {
          matchStr = prefix;
          break;
        }
      }
    }
    
    if (!matchStr && kanji) {
      const kanjiChars = kanji.match(/[\u4e00-\u9faf]+/g);
      if (kanjiChars && kanjiChars.length > 0) {
        matchStr = kanjiChars[0];
      }
    }

    if (!matchStr) return <span>{sentence}</span>;

    const parts = sentence.split(matchStr);
    return (
      <span>
        {parts.map((part, i) => (
          <span key={i}>
            {i > 0 && <span className="text-red-400 font-bold">{matchStr}</span>}
            {part}
          </span>
        ))}
      </span>
    );
  };

  if (flashcardMode) {
    const card = flashcardList[currentCardIdx];
    const isRev = flashcardMode === 'reverse';
    
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-[#0B0F19] via-[#1A1124] to-[#4A154B] absolute inset-0 z-50">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <button onClick={() => { playClick(); setFlashcardMode(null); setIsAutoMode(false); }} className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-bold text-white">{selectedLesson || 'Flashcards'}</h2>
          <div className="w-10" />
        </div>

        <div className="px-4 py-2 flex justify-between items-center text-sm text-zinc-400 bg-[#1A1D24] mx-4 mt-4 rounded-lg">
          <span>Score: 0</span>
          <span>Remaining: {flashcardList.length - currentCardIdx}</span>
        </div>

        <div className="flex-1 p-4 flex flex-col perspective-1000">
          <motion.div 
            className="flex-1 w-full relative cursor-pointer transform-style-3d mb-4"
            onClick={() => { if (!isAutoMode) { playClick(); setIsFlipped(!isFlipped); } }}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
          >
            {/* Front */}
            <div className="absolute inset-0 bg-[#1A1D24] rounded-2xl border border-zinc-700 flex flex-col p-6 backface-hidden shadow-lg">
              <div className="flex-1 flex flex-col items-center justify-center text-center w-full">
                {isRev ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-4xl font-bold text-white">{card.nepali}</div>
                    <div className="text-2xl text-zinc-400">{card.english}</div>
                  </div>
                ) : (
                  <div className={`${getJapaneseTextSizeClass(card.japanese)} font-bold text-white w-full px-2 break-keep`}>{card.japanese}</div>
                )}
              </div>
            </div>

            {/* Back */}
            <div className="absolute inset-0 bg-[#1A1D24] rounded-2xl border border-zinc-700 flex flex-col p-4 sm:p-6 backface-hidden rotate-y-180 shadow-lg">
              <div className="flex-1 flex flex-col items-center justify-center w-full overflow-y-auto scrollbar-hide">
                {isRev ? (
                  <div className="w-full flex flex-col items-center gap-3 sm:gap-5">
                    <div className="text-center w-full">
                      <div className="text-purple-400 font-bold text-sm sm:text-base mb-1">Japanese:</div>
                      <div className={`text-5xl sm:text-6xl font-bold mb-2 ${!card.kanji ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-white'}`}>{card.kanji || card.japanese}</div>
                      {card.kanji && <div className="text-cyan-400 text-3xl sm:text-4xl drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">{card.japanese}</div>}
                    </div>
                    {card.sentence && (
                      <>
                        <div className="w-full h-px bg-white/10 my-2 sm:my-3 shrink-0" />
                        <div className="w-full flex items-center justify-between gap-2 text-left">
                          <div className="text-purple-400 font-bold text-sm sm:text-base shrink-0">Example:</div>
                          <div className="text-zinc-300 text-lg sm:text-xl flex-1 leading-snug px-2 text-center">
                            {highlightSentence(card.sentence, card.kanji, card.japanese)}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); speak(card.sentence, 'ja-JP'); }} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 hover:bg-white/20 transition-colors">
                            <Volume2 className="w-4 h-4 text-zinc-300" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center gap-3 sm:gap-5">
                    <div className="text-center w-full">
                      <div className={`text-5xl sm:text-6xl font-bold mb-1 ${!card.kanji ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'text-white'}`}>{card.kanji || card.japanese}</div>
                      {card.kanji && <div className="text-cyan-400 text-3xl sm:text-4xl drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">{card.japanese}</div>}
                    </div>
                    
                    <div className="text-center">
                      <div className="text-purple-400 font-bold text-sm sm:text-base mb-0.5">English:</div>
                      <div className="text-zinc-300 text-lg sm:text-xl leading-tight">{card.english}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-purple-400 font-bold text-sm sm:text-base mb-0.5">Nepali:</div>
                      <div className="text-zinc-300 text-lg sm:text-xl leading-tight">{card.nepali}</div>
                    </div>
                    
                    {card.sentence && (
                      <>
                        <div className="w-full h-px bg-white/10 my-2 sm:my-3 shrink-0" />
                        <div className="w-full flex items-center justify-between gap-2 text-left">
                          <div className="text-purple-400 font-bold text-sm sm:text-base shrink-0">Example:</div>
                          <div className="text-zinc-300 text-lg sm:text-xl flex-1 leading-snug px-2 text-center">
                            {highlightSentence(card.sentence, card.kanji, card.japanese)}
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); speak(card.sentence, 'ja-JP'); }} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 hover:bg-white/20 transition-colors">
                            <Volume2 className="w-4 h-4 text-zinc-300" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 sm:gap-3 mt-3 pt-3 w-full shrink-0">
                {isHardReviewMode ? (
                  <button onClick={(e) => { e.stopPropagation(); removeHard(card); }} className="flex-1 py-3 sm:py-4 rounded-xl border border-red-500 text-white font-bold hover:bg-red-500/10 active:scale-95 transition-all text-sm sm:text-base whitespace-nowrap">
                    REMOVE
                  </button>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); markHard(card); }} className="flex-1 py-3 sm:py-4 rounded-xl border border-red-500 text-white font-bold hover:bg-red-500/10 active:scale-95 transition-all text-sm sm:text-base whitespace-nowrap">
                    HARD
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); nextCard(); }} className="flex-1 py-3 sm:py-4 rounded-xl border border-yellow-500 text-white font-bold hover:bg-yellow-500/10 active:scale-95 transition-all text-sm sm:text-base whitespace-nowrap">
                  GOOD
                </button>
                <button onClick={(e) => { e.stopPropagation(); nextCard(); }} className="flex-1 py-3 sm:py-4 rounded-xl border border-green-500 text-white font-bold hover:bg-green-500/10 active:scale-95 transition-all text-sm sm:text-base whitespace-nowrap">
                  EASY
                </button>
              </div>
            </div>
          </motion.div>

          <div className="flex gap-2 mt-auto">
            <button onClick={(e) => { e.stopPropagation(); playManualSound(); }} className="flex-1 py-3.5 bg-[#3B3B7A] rounded-xl text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-sm">
              <Volume2 className="w-4 h-4" /> SOUND
            </button>
            <button onClick={(e) => { e.stopPropagation(); setIsAutoMode(!isAutoMode); }} className={`flex-1 py-3.5 rounded-xl text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-sm ${isAutoMode ? 'bg-red-500' : 'bg-orange-500'}`}>
              {isAutoMode ? '■ STOP AUTO' : '▶ AUTO'}
            </button>
            <button onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }} className="flex-1 py-3.5 bg-[#3B3B7A] rounded-xl text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-sm">
              FLIP
            </button>
          </div>
          {isHardReviewMode && (
             <button onClick={(e) => { e.stopPropagation(); removeHard(card); }} className="w-full mt-2 py-3.5 bg-[#3B3B7A] rounded-xl text-white font-bold active:scale-95 transition-all text-sm">
               REMOVE FROM HARD LIST
             </button>
          )}
          <button onClick={nextCard} className="w-full mt-2 py-3.5 bg-[#3B3B7A] rounded-xl text-white font-bold active:scale-95 transition-all text-sm">
            NEXT
          </button>
        </div>
      </div>
    );
  }

  if (selectedLesson) {
    let list: MinnaWord[] = [];
    let isHardCardsView = false;
    let baseLesson = selectedLesson;

    if (selectedLesson === 'All Hard Cards') {
      (Object.values(hardCards) as MinnaWord[][]).forEach(arr => list.push(...arr));
      isHardCardsView = true;
    } else if (selectedLesson.startsWith('Hard Cards: ')) {
      baseLesson = selectedLesson.replace('Hard Cards: ', '');
      list = hardCards[baseLesson] || [];
      isHardCardsView = true;
    } else {
      list = data?.[selectedLesson] || [];
    }
    const hardCount = selectedLesson === 'All Hard Cards' ? list.length : (hardCards[baseLesson] || []).length;

    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-[#0B0F19] via-[#1A1124] to-[#4A154B] absolute inset-0 z-40">
        <div className="flex items-center p-4 border-b border-white/5 shrink-0 bg-[#11131A]/95 backdrop-blur-md sticky top-0 z-10">
          <button onClick={() => { playClick(); setSelectedLesson(null); }} className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-cyan-400 ml-2">{selectedLesson}</h2>
        </div>

        <div className="flex-1 overflow-y-auto pb-40">
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

        <div className="absolute bottom-0 left-0 right-0 p-3 pb-6 bg-[#11131A] border-t border-white/5 flex flex-col gap-2 text-sm z-50">
          <button onClick={() => startFlashcards(selectedLesson)} className="w-full py-2.5 bg-[#2DD4BF] text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-teal-500/20">
            START FLASHCARDS
          </button>
          {!isHardCardsView && (
            <div className="flex gap-2">
              <button onClick={() => { playClick(); setSelectedLesson(`Hard Cards: ${selectedLesson}`); }} className="flex-1 py-2.5 bg-[#F43F5E] text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-rose-500/20">
                HARD CARDS ({hardCount})
              </button>
              <button onClick={() => startFlashcards(selectedLesson, true)} className="flex-1 py-2.5 bg-[#F59E0B] text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-amber-500/20">
                REVERSE FLASHCARDS
              </button>
            </div>
          )}
          {isHardCardsView && (
            <div className="flex gap-2">
              <button onClick={() => startFlashcards(selectedLesson, true)} className="flex-1 py-2.5 bg-[#F59E0B] text-white font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-amber-500/20">
                REVERSE FLASHCARDS
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <button className="flex-1 py-2.5 bg-[#A855F7] text-white font-bold rounded-xl active:scale-95 transition-all opacity-50 cursor-not-allowed shadow-lg shadow-purple-500/20">
              SENTENCES
            </button>
            <button className="flex-1 py-2.5 bg-[#78716C] text-white font-bold rounded-xl active:scale-95 transition-all opacity-50 cursor-not-allowed shadow-lg shadow-stone-500/20">
              HISTORY
            </button>
          </div>
          <button className="w-full py-2.5 bg-[#F97316] text-white font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20">
            <Zap className="w-4 h-4" /> TAKE QUIZ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-[#11131A]/95 backdrop-blur-md py-2.5 z-20 px-4 flex items-center gap-2">
        {onBack && (
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white shrink-0 bg-[#1A1D24] rounded-full active:scale-95 transition-all">
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <div className="relative flex-1">
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
              className="py-3 px-2 bg-[#222630] border border-cyan-500 rounded-xl text-cyan-400 font-bold text-sm hover:bg-[#2A2F3A] active:scale-95 transition-all"
            >
              {lesson}
            </button>
          ))}
          <button 
            className="py-3 px-2 bg-[#1A1D24] border border-amber-500 rounded-xl text-amber-500 font-bold text-sm flex items-center justify-center gap-1 hover:bg-[#222630] active:scale-95 transition-all"
          >
            <Zap className="w-4 h-4" /> Quiz All
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={() => { playClick(); setSelectedLesson('All Hard Cards'); }}
            className="w-full p-4 bg-[#1A1D24] border border-cyan-500/30 rounded-xl flex items-center justify-between hover:bg-[#222630] active:scale-95 transition-all"
          >
            <span className="font-bold text-cyan-400">Review All Hard Cards</span>
            <span className="text-cyan-400 font-bold">{allHardCount}</span>
          </button>
          <button className="w-full p-4 bg-[#1A1D24] border border-cyan-500/30 rounded-xl flex items-center justify-between hover:bg-[#222630] active:scale-95 transition-all">
            <span className="font-bold text-cyan-400">Total Decks</span>
            <span className="text-cyan-400 font-bold">{data ? Object.keys(data).length : 0}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
