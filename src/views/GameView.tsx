import { useState, useEffect, useRef, ChangeEvent, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Heart, Trophy, X, Play, BarChart2, Settings2, Check } from 'lucide-react';
import { Preferences } from '@capacitor/preferences';
import { RAW_DATA } from '../data';
import { playCorrect, playIncorrect, playClick } from '../utils/audio';
import { speak } from '../utils/tts';

type GameState = 'menu' | 'playing' | 'gameover' | 'stats' | 'settings' | 'custom_katakana_select' | 'custom_hiragana_select';
type Difficulty = 'easy' | 'medium' | 'hard';
type DropMode = 'waterfall' | 'single';
type AlphabetMode = 'katakana' | 'hiragana' | 'custom_katakana' | 'custom_hiragana';

type FallingItem = {
  id: string;
  text: string;
  answer: string;
  x: number;
  y: number;
  speed: number;
  spawnTime: number;
  hit?: boolean;
};

type SRSData = {
  [text: string]: {
    avgTime: number;
    count: number;
  };
};

export default function GameView() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [dropMode, setDropMode] = useState<DropMode>('single');
  const [alphabetMode, setAlphabetMode] = useState<AlphabetMode>('katakana');
  const [isProgressive, setIsProgressive] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [fallingItems, setFallingItems] = useState<FallingItem[]>([]);
  const [input, setInput] = useState('');
  const [srsData, setSrsData] = useState<SRSData>({});
  const [customKatakanaSelection, setCustomKatakanaSelection] = useState<string[]>([]);
  const [customHiraganaSelection, setCustomHiraganaSelection] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const penalizedIds = useRef<Set<string>>(new Set());

  const allKatakana = useMemo(() => [...RAW_DATA.basic, ...RAW_DATA.dakuten, ...RAW_DATA.handakuten].filter(item => !item.empty), []);
  const allHiragana = useMemo(() => [...RAW_DATA.h_basic, ...RAW_DATA.h_dakuten, ...RAW_DATA.h_handakuten].filter(item => !item.empty), []);
  const allKana = useMemo(() => [...allKatakana, ...allHiragana], [allKatakana, allHiragana]);

  const pool = useMemo(() => {
    if (alphabetMode === 'katakana') return allKatakana;
    if (alphabetMode === 'hiragana') return allHiragana;
    if (alphabetMode === 'custom_katakana' && customKatakanaSelection.length > 0) {
      return allKatakana.filter(item => customKatakanaSelection.includes(item.id));
    }
    if (alphabetMode === 'custom_hiragana' && customHiraganaSelection.length > 0) {
      return allHiragana.filter(item => customHiraganaSelection.includes(item.id));
    }
    return allKatakana; // fallback
  }, [alphabetMode, customKatakanaSelection, customHiraganaSelection, allKatakana, allHiragana]);

  const DANGER_LINE_Y = 82; // 82% of screen height

  useEffect(() => {
    setHighScore(parseInt(localStorage.getItem('kn_game_highscore') || '0', 10));
    const savedCustomK = localStorage.getItem('kn_custom_katakana');
    if (savedCustomK) {
      setCustomKatakanaSelection(JSON.parse(savedCustomK));
    }
    const savedCustomH = localStorage.getItem('kn_custom_hiragana');
    if (savedCustomH) {
      setCustomHiraganaSelection(JSON.parse(savedCustomH));
    }
    loadSRSData();
  }, []);

  const loadSRSData = async () => {
    try {
      const { value } = await Preferences.get({ key: 'kn_srs_data' });
      if (value) {
        setSrsData(JSON.parse(value));
      }
    } catch (e) {
      console.error('Failed to load SRS data', e);
    }
  };

  const saveSRSData = async (newData: SRSData) => {
    setSrsData(newData);
    try {
      await Preferences.set({ key: 'kn_srs_data', value: JSON.stringify(newData) });
    } catch (e) {
      console.error('Failed to save SRS data', e);
    }
  };

  const updateSRS = (text: string, reactionTime: number) => {
    const current = srsData[text] || { avgTime: 0, count: 0 };
    const newCount = current.count + 1;
    // Calculate new moving average
    const newAvgTime = ((current.avgTime * current.count) + reactionTime) / newCount;
    
    const newData = {
      ...srsData,
      [text]: { avgTime: newAvgTime, count: newCount }
    };
    saveSRSData(newData);
  };

  const startGame = () => {
    playClick();
    if (alphabetMode === 'custom_katakana' && customKatakanaSelection.length === 0) {
      alert("Please select at least one Katakana for Custom mode.");
      return;
    }
    if (alphabetMode === 'custom_hiragana' && customHiraganaSelection.length === 0) {
      alert("Please select at least one Hiragana for Custom mode.");
      return;
    }
    setScore(0);
    setLives(3);
    setFallingItems([]);
    setInput('');
    penalizedIds.current.clear();
    setGameState('playing');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleQuitGame = () => {
    playClick();
    const now = Date.now();
    fallingItems.forEach(item => {
      if (!item.hit && !penalizedIds.current.has(item.id)) {
        const reactionTime = now - item.spawnTime;
        updateSRS(item.text, reactionTime);
      }
    });
    setGameState('gameover');
  };

  // Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setFallingItems(items => {
        let missedItems: FallingItem[] = [];
        const newItems = items.map(item => {
          const newY = item.y + item.speed;
          if (newY > DANGER_LINE_Y && !penalizedIds.current.has(item.id)) {
            missedItems.push(item);
            penalizedIds.current.add(item.id);
            // Penalize missed items by adding a high reaction time (e.g., 10 seconds)
            updateSRS(item.text, 10000);
          }
          return { ...item, y: newY };
        });

        if (missedItems.length > 0) {
          setTimeout(() => {
            playIncorrect();
            const t = missedItems[0].text;
            speak(`ちがう、${t}`);
            
            setLives(l => {
              const newLives = Math.max(0, l - missedItems.length);
              if (newLives === 0 && l > 0) {
                setGameState('gameover');
              }
              return newLives;
            });
          }, 0);
        }

        return newItems.filter(item => item.y <= DANGER_LINE_Y + 5);
      });
    }, 50);

    return () => clearInterval(interval);
  }, [gameState, srsData]);

  const getRandomWeightedItem = () => {
    // Calculate weights based on SRS data
    // Higher avgTime = higher weight (more likely to spawn)
    const weightedPool = pool.map(item => {
      const stats = srsData[item.c];
      // Base weight is 1. If avgTime is 3000ms, weight is 1 + (3000/1000) = 4
      const weight = stats ? 1 + (stats.avgTime / 1000) : 1;
      return { item, weight };
    });

    const totalWeight = weightedPool.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const w of weightedPool) {
      random -= w.weight;
      if (random <= 0) {
        return w.item;
      }
    }
    return pool[Math.floor(Math.random() * pool.length)]; // Fallback
  };

  const getDynamicSpeed = (text: string, baseSpeed: number, currentScore: number) => {
    let multiplier = 1.0;

    if (isProgressive) {
      // Progressive Mode: Ignore SRS, increase speed based on score
      const scoreMultiplier = 1 + Math.floor(currentScore / 50) * 0.1;
      multiplier *= scoreMultiplier;
    } else {
      // SRS Mode: Use SRS data
      const stats = srsData[text];
      if (!stats) {
        multiplier += 0.1; // Slightly faster if never encountered
      } else {
        // High average reaction time (> 3s) -> slower (easier)
        if (stats.avgTime > 3000) {
          multiplier -= 0.3;
        } else {
          multiplier += 0.3; // Fast reaction (< 3s) -> faster (harder)
        }

        // Encountered many times -> slower
        if (stats.count > 5) {
          multiplier -= 0.2;
        } else if (stats.count < 2) {
          multiplier += 0.2;
        }
      }
    }

    // Clamp to reasonable limits so it doesn't stop or go impossibly fast
    return Math.max(0.3, Math.min(3.0, baseSpeed * multiplier));
  };

  // Spawner (Waterfall)
  useEffect(() => {
    if (gameState !== 'playing' || dropMode !== 'waterfall') return;

    const spawnRate = difficulty === 'easy' ? 2000 : difficulty === 'medium' ? 1200 : 800;
    
    const spawnItem = () => {
      const randomItem = getRandomWeightedItem();
      const baseSpeed = difficulty === 'easy' ? 0.4 : difficulty === 'medium' ? 0.7 : 1.2;
      const newItem: FallingItem = {
        id: Math.random().toString(36).substr(2, 9),
        text: randomItem.c,
        answer: randomItem.r.toLowerCase(),
        x: Math.random() * 80 + 10, // 10% to 90%
        y: -10,
        speed: getDynamicSpeed(randomItem.c, baseSpeed, score),
        spawnTime: Date.now()
      };
      setFallingItems(prev => [...prev, newItem]);
    };

    const interval = setInterval(spawnItem, spawnRate);
    return () => clearInterval(interval);
  }, [gameState, difficulty, dropMode, srsData, score, isProgressive, pool]);

  // Spawner (Single)
  useEffect(() => {
    if (gameState !== 'playing' || dropMode !== 'single') return;

    if (fallingItems.length === 0) {
      const randomItem = getRandomWeightedItem();
      const baseSpeed = difficulty === 'easy' ? 0.4 : difficulty === 'medium' ? 0.7 : 1.2;
      const newItem: FallingItem = {
        id: Math.random().toString(36).substr(2, 9),
        text: randomItem.c,
        answer: randomItem.r.toLowerCase(),
        x: Math.random() * 80 + 10, // 10% to 90%
        y: -10,
        speed: getDynamicSpeed(randomItem.c, baseSpeed, score),
        spawnTime: Date.now()
      };
      setFallingItems([newItem]);
    }
  }, [gameState, difficulty, dropMode, fallingItems.length, srsData, score, isProgressive, pool]);

  // Handle Game Over
  useEffect(() => {
    if (gameState === 'gameover') {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('kn_game_highscore', score.toString());
      }
    }
  }, [gameState, score, highScore]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().trim();
    setInput(val);

    if (val === '') return;

    const hitIndex = fallingItems.findIndex(item => item.answer === val && !item.hit);
    if (hitIndex !== -1) {
      const hitItem = fallingItems[hitIndex];
      const reactionTime = Date.now() - hitItem.spawnTime;
      updateSRS(hitItem.text, reactionTime);

      playCorrect();
      speak(hitItem.text);
      setScore(s => s + 10);
      setInput('');
      
      // Mark as hit to show romaji
      setFallingItems(items => items.map((item, i) => 
        i === hitIndex ? { ...item, hit: true, speed: 0 } : item
      ));

      // Remove after 500ms
      setTimeout(() => {
        setFallingItems(items => items.filter(item => item.id !== hitItem.id));
      }, 500);
    } else {
      const isPrefix = fallingItems.some(item => !item.hit && item.answer.startsWith(val));
      if (!isPrefix && fallingItems.length > 0) {
        setInput('');
      }
    }
  };

  const toggleCustomKatakana = (id: string) => {
    playClick();
    setCustomKatakanaSelection(prev => {
      const newSel = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      localStorage.setItem('kn_custom_katakana', JSON.stringify(newSel));
      return newSel;
    });
  };

  const toggleCustomHiragana = (id: string) => {
    playClick();
    setCustomHiraganaSelection(prev => {
      const newSel = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      localStorage.setItem('kn_custom_hiragana', JSON.stringify(newSel));
      return newSel;
    });
  };

  if (gameState === 'custom_katakana_select' || gameState === 'custom_hiragana_select') {
    const isKata = gameState === 'custom_katakana_select';
    const title = isKata ? 'Select Custom Katakana' : 'Select Custom Hiragana';
    const allItems = isKata ? allKatakana : allHiragana;
    const selection = isKata ? customKatakanaSelection : customHiraganaSelection;
    const toggleFn = isKata ? toggleCustomKatakana : toggleCustomHiragana;
    const storageKey = isKata ? 'kn_custom_katakana' : 'kn_custom_hiragana';
    const setSelection = isKata ? setCustomKatakanaSelection : setCustomHiraganaSelection;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full px-4 pb-4">
        <div className="flex items-center justify-between mb-4 mt-2">
          <h2 className="text-xl font-black text-zinc-100 tracking-tight">{title}</h2>
          <button onClick={() => { playClick(); setGameState('menu'); }} className="w-8 h-8 bg-[#1A1D24] rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2 mb-4">
          <button onClick={() => { playClick(); setSelection(allItems.map(k => k.id)); localStorage.setItem(storageKey, JSON.stringify(allItems.map(k => k.id))); }} className="flex-1 py-2 bg-[#222630] rounded-xl text-xs font-bold text-zinc-300">Select All</button>
          <button onClick={() => { playClick(); setSelection([]); localStorage.setItem(storageKey, JSON.stringify([])); }} className="flex-1 py-2 bg-[#222630] rounded-xl text-xs font-bold text-zinc-300">Clear All</button>
        </div>
        <div className="flex-1 overflow-y-auto bg-[#1A1D24] rounded-[24px] p-4 shadow-sm">
          <div className="grid grid-cols-5 gap-2">
            {allItems.map(item => (
              <button
                key={item.id}
                onClick={() => toggleFn(item.id)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all relative ${selection.includes(item.id) ? 'bg-cyan-500/20 ring-1 ring-cyan-500' : 'bg-[#222630] text-zinc-400'}`}
              >
                <span className={`text-xl font-bold font-jp ${selection.includes(item.id) ? 'text-cyan-400' : 'text-zinc-300'}`}>{item.c}</span>
                <span className="text-[10px] font-mono">{item.r}</span>
                {selection.includes(item.id) && <Check className="w-3 h-3 text-cyan-400 absolute top-1 right-1" />}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (gameState === 'settings') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full px-4 pb-4">
        <div className="flex items-center justify-between mb-6 mt-2">
          <h2 className="text-2xl font-black text-zinc-100 tracking-tight">Game Settings</h2>
          <button onClick={() => { playClick(); setGameState('menu'); }} className="w-10 h-10 bg-[#1A1D24] rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="bg-[#1A1D24] p-5 rounded-2xl shadow-sm mb-3">
          <label className="block text-xs text-zinc-500 uppercase font-bold tracking-wider mb-3">Drop Mode</label>
          <div className="flex gap-2">
            {(['waterfall', 'single'] as DropMode[]).map(m => (
              <button 
                key={m} 
                onClick={() => { playClick(); setDropMode(m); }}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all capitalize active:scale-95 ${dropMode === m ? 'bg-purple-500 text-white shadow-md' : 'bg-[#222630] text-zinc-400 hover:bg-[#2A2E38] hover:text-zinc-200'}`}
              >
                {m}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-zinc-500 mt-2">Waterfall drops multiple kana. Single drops one at a time.</p>
        </div>

        <div className="bg-[#1A1D24] p-5 rounded-2xl shadow-sm mb-3">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Progressive Speed</label>
            <button
              onClick={() => { playClick(); setIsProgressive(!isProgressive); }}
              className={`w-12 h-6 rounded-full transition-colors relative ${isProgressive ? 'bg-cyan-500' : 'bg-[#222630]'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${isProgressive ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          <p className="text-[10px] text-zinc-500">Speed increases as your score goes up, ignoring SRS data.</p>
        </div>
      </motion.div>
    );
  }

  if (gameState === 'stats') {
    const sortedStats = Object.entries(srsData)
      .sort(([, a], [, b]) => b.avgTime - a.avgTime);

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full px-4 pb-4">
        <div className="flex items-center justify-between mb-6 mt-2">
          <h2 className="text-2xl font-black text-zinc-100 tracking-tight">Weakness Tracker</h2>
          <button onClick={() => { playClick(); setGameState('menu'); }} className="w-10 h-10 bg-[#1A1D24] rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-sm text-zinc-500 mb-4">Kana that take longer to type will drop more frequently to help you practice.</p>

        <div className="flex-1 overflow-y-auto bg-[#1A1D24] rounded-[28px] p-4 shadow-sm">
          {sortedStats.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500">
              <BarChart2 className="w-12 h-12 mb-3 opacity-20" />
              <p>Play a game to see your stats!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedStats.map(([kana, stats]) => (
                <div key={kana} className="flex items-center justify-between bg-[#222630] p-3 rounded-xl">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-black text-cyan-400 font-jp w-8 text-center">{kana}</span>
                    <div className="flex flex-col">
                      <span className="text-xs text-zinc-400">Avg. Reaction</span>
                      <span className={`text-sm font-bold ${stats.avgTime > 3000 ? 'text-red-400' : stats.avgTime > 1500 ? 'text-amber-400' : 'text-green-400'}`}>
                        {(stats.avgTime / 1000).toFixed(2)}s
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-zinc-500">Encounters</span>
                    <span className="text-sm font-bold text-zinc-300">{stats.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  if (gameState === 'menu') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full justify-center gap-3 max-w-sm mx-auto px-4 pb-2">
        <div className="text-center mb-2 relative mt-2">
          <button 
            onClick={() => { playClick(); setGameState('settings'); }}
            className="absolute left-0 top-0 p-2 bg-[#1A1D24] rounded-full text-zinc-400 hover:bg-[#222630] hover:text-zinc-100 transition-colors"
            title="Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => { playClick(); setGameState('stats'); }}
            className="absolute right-0 top-0 p-2 bg-[#1A1D24] rounded-full text-cyan-400 hover:bg-[#222630] transition-colors"
            title="Weakness Tracker"
          >
            <BarChart2 className="w-4 h-4" />
          </button>
          <div className="w-16 h-16 bg-[#1A1D24] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-transparent opacity-50"></div>
            <Rocket className="w-8 h-8 text-cyan-400 relative z-10" />
          </div>
          <h2 className="text-2xl font-black text-zinc-100 tracking-tight">Kana Drop</h2>
          <p className="text-xs text-zinc-500 mt-1">Type the romaji before they hit the ground!</p>
        </div>
        
        <div className="bg-[#1A1D24] p-4 rounded-2xl shadow-sm mb-1">
          <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2 text-center">Alphabet</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button onClick={() => { playClick(); setAlphabetMode('katakana'); }} className={`py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${alphabetMode === 'katakana' ? 'bg-pink-500 text-white shadow-md' : 'bg-[#222630] text-zinc-400 hover:bg-[#2A2E38]'}`}>Katakana</button>
            <button onClick={() => { playClick(); setAlphabetMode('hiragana'); }} className={`py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${alphabetMode === 'hiragana' ? 'bg-pink-500 text-white shadow-md' : 'bg-[#222630] text-zinc-400 hover:bg-[#2A2E38]'}`}>Hiragana</button>
            <button onClick={() => { playClick(); setAlphabetMode('custom_katakana'); }} className={`py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${alphabetMode === 'custom_katakana' ? 'bg-pink-500 text-white shadow-md' : 'bg-[#222630] text-zinc-400 hover:bg-[#2A2E38]'}`}>Custom Kata</button>
            <button onClick={() => { playClick(); setAlphabetMode('custom_hiragana'); }} className={`py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${alphabetMode === 'custom_hiragana' ? 'bg-pink-500 text-white shadow-md' : 'bg-[#222630] text-zinc-400 hover:bg-[#2A2E38]'}`}>Custom Hira</button>
          </div>
          {alphabetMode === 'custom_katakana' && (
            <button onClick={() => { playClick(); setGameState('custom_katakana_select'); }} className="w-full py-2 bg-[#222630] text-cyan-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#2A2E38]">
              <Settings2 className="w-3.5 h-3.5" /> Select Katakana ({customKatakanaSelection.length})
            </button>
          )}
          {alphabetMode === 'custom_hiragana' && (
            <button onClick={() => { playClick(); setGameState('custom_hiragana_select'); }} className="w-full py-2 bg-[#222630] text-cyan-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#2A2E38]">
              <Settings2 className="w-3.5 h-3.5" /> Select Hiragana ({customHiraganaSelection.length})
            </button>
          )}
        </div>

        <div className="bg-[#1A1D24] p-4 rounded-2xl shadow-sm mb-2">
          <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2 text-center">Select Difficulty</label>
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
              <button 
                key={d} 
                onClick={() => { playClick(); setDifficulty(d); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all capitalize active:scale-95 ${difficulty === d ? 'bg-cyan-500 text-white shadow-md' : 'bg-[#222630] text-zinc-400 hover:bg-[#2A2E38] hover:text-zinc-200'}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center mb-2">
          <div className="bg-amber-500/10 text-amber-500 px-3 py-1.5 rounded-full font-bold font-mono inline-flex items-center gap-1.5 text-xs">
            <Trophy className="w-3.5 h-3.5" /> High Score: {highScore}
          </div>
        </div>

        <button onClick={startGame} className="w-full py-3 bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-bold rounded-full shadow-md shadow-cyan-500/20 text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          Start Game <Play className="w-4 h-4" fill="currentColor" />
        </button>
      </motion.div>
    );
  }

  if (gameState === 'gameover') {
    const isNewRecord = score > 0 && score >= highScore;
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full text-center px-4 max-w-sm mx-auto">
        <div className="w-24 h-24 bg-[#1A1D24] rounded-full flex items-center justify-center mb-6 shadow-sm">
          <X className="w-12 h-12 text-purple-500" />
        </div>
        <h2 className="text-3xl font-black text-zinc-100 mb-2">Game Over!</h2>
        <p className="text-zinc-500 text-sm mb-8">The kana dropped too fast.</p>
        
        <div className="bg-[#1A1D24] p-6 rounded-[28px] w-full max-w-[300px] mb-10 shadow-sm relative overflow-hidden">
          {isNewRecord && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500"></div>}
          <div className="flex flex-col items-center justify-center">
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2">Final Score</p>
            <p className="text-5xl font-black text-cyan-400">{score}</p>
          </div>
          {isNewRecord && <p className="text-xs font-bold text-amber-500 mt-5 flex items-center justify-center gap-1.5 bg-amber-500/10 py-2 rounded-xl"><Trophy className="w-4 h-4" /> New High Score!</p>}
        </div>

        <div className="flex flex-col gap-3 w-full max-w-[300px]">
          <button onClick={startGame} className="w-full py-4 bg-cyan-500 text-white rounded-full font-bold text-base hover:bg-cyan-400 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-cyan-500/20">
            Play Again
          </button>
          <button onClick={() => setGameState('menu')} className="w-full py-4 bg-[#222630] text-zinc-100 rounded-full font-bold text-base hover:bg-[#2A2E38] flex items-center justify-center gap-2 active:scale-95 transition-all">
            Back to Menu
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#11131A] flex flex-col" onClick={() => inputRef.current?.focus()}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-[#11131A] to-transparent">
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <Heart key={i} className={`w-5 h-5 ${i < lives ? 'text-purple-500 fill-purple-500' : 'text-[#222630]'}`} />
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xl font-black text-cyan-400 font-mono">{score}</div>
          <button 
            onClick={handleQuitGame} 
            className="w-8 h-8 bg-[#1A1D24]/80 rounded-full flex items-center justify-center text-zinc-400 hover:text-white backdrop-blur-md active:scale-95 transition-all"
            title="Quit Game"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Danger Line */}
      <div 
        className="absolute left-0 right-0 h-0.5 bg-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.8)] z-0" 
        style={{ top: `${DANGER_LINE_Y}%` }}
      ></div>

      {/* Falling Items */}
      <div className="flex-1 relative w-full">
        <AnimatePresence>
          {fallingItems.map(item => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: item.hit ? 0 : 1, 
                scale: item.hit ? 1.5 : 1,
                color: item.hit ? '#4ade80' : '#f4f4f5' // green-400 when hit
              }}
              transition={{ duration: item.hit ? 0.5 : 0.2 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className={`absolute text-4xl font-black drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] ${item.hit ? 'font-sans' : 'font-jp'}`}
              style={{ 
                left: `${item.x}%`, 
                top: `${item.y}%`, 
                transform: 'translate(-50%, -50%)' 
              }}
            >
              {item.hit ? item.answer : item.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          className="w-full bg-[#1A1D24]/90 backdrop-blur-md border border-white/10 rounded-full py-3 px-5 text-center text-xl font-bold text-zinc-100 focus:border-cyan-500 focus:outline-none shadow-xl transition-colors"
          placeholder="Type here..."
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </div>
    </div>
  );
}
