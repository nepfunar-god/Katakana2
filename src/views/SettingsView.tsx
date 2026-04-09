import { useState, useEffect, ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { Settings, Trash2, Upload, ChevronLeft, Bell, BellRing } from 'lucide-react';
import { ViewState } from '../App';
import { playClick } from '../utils/audio';
import { setupNotifications, sendTestNotification } from '../utils/notifications';

export default function SettingsView({ setView }: { setView: (view: ViewState) => void }) {
  const [lang, setLang] = useState('en');
  const [flashcardOrder, setFlashcardOrder] = useState<'sequential' | 'random'>('sequential');
  const [autoAudioLang, setAutoAudioLang] = useState<'en' | 'ne'>('en');
  const [notificationInterval, setNotificationInterval] = useState<number>(0);

  useEffect(() => {
    setLang(localStorage.getItem('kn_lang') || 'en');
    setFlashcardOrder((localStorage.getItem('minna_flashcard_order') as 'sequential' | 'random') || 'sequential');
    setAutoAudioLang((localStorage.getItem('minna_auto_audio_lang') as 'en' | 'ne') || 'en');
    setNotificationInterval(parseInt(localStorage.getItem('minna_notification_interval') || '0', 10));
  }, []);

  const handleLangChange = (newLang: string) => {
    playClick();
    setLang(newLang);
    localStorage.setItem('kn_lang', newLang);
  };

  const handleFlashcardOrderChange = (order: 'sequential' | 'random') => {
    playClick();
    setFlashcardOrder(order);
    localStorage.setItem('minna_flashcard_order', order);
  };

  const handleAutoAudioLangChange = (lang: 'en' | 'ne') => {
    playClick();
    setAutoAudioLang(lang);
    localStorage.setItem('minna_auto_audio_lang', lang);
  };

  const handleNotificationIntervalChange = (interval: number) => {
    playClick();
    setNotificationInterval(interval);
    localStorage.setItem('minna_notification_interval', interval.toString());
    setupNotifications(interval);
  };

  const handleTestNotification = async () => {
    playClick();
    await sendTestNotification();
  };

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/);
      let count = 0;
      const customWords = JSON.parse(localStorage.getItem('kn_custom') || '[]');
      lines.forEach(l => {
        const p = l.split('|');
        if (p.length >= 4) {
          customWords.push({ id: 'c' + Date.now() + Math.random(), c: p[0], r: p[1], m: p[2], n: p[3] });
          count++;
        }
      });
      localStorage.setItem('kn_custom', JSON.stringify(customWords));
      alert(`Imported ${count} items!`);
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const resetData = () => {
    playClick();
    if (confirm("Reset all progress? This cannot be undone.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col pt-4 pb-10 px-4 max-w-sm mx-auto w-full relative">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => { playClick(); setView('learn'); }} className="w-10 h-10 bg-[#1A1D24] text-zinc-400 rounded-full flex items-center justify-center hover:bg-[#222630] hover:text-zinc-200 transition-colors active:scale-95 shadow-sm shrink-0">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-black text-zinc-100 flex items-center gap-3">
          <Settings className="w-8 h-8 text-cyan-400" /> Settings
        </h2>
      </div>
      <div className="space-y-4">
        <div className="bg-[#1A1D24] p-6 rounded-[28px] shadow-sm">
          <label className="block text-xs text-zinc-500 uppercase font-bold tracking-wider mb-4">Translation Language</label>
          <div className="flex gap-3">
            <button 
              onClick={() => handleLangChange('en')} 
              className={`flex-1 py-3.5 rounded-[20px] text-sm font-bold transition-all ${lang === 'en' ? 'bg-cyan-500 text-white shadow-md scale-[1.02]' : 'bg-[#222630] text-zinc-400 hover:text-zinc-200 hover:bg-[#2A2E38]'}`}
            >
              English
            </button>
            <button 
              onClick={() => handleLangChange('ne')} 
              className={`flex-1 py-3.5 rounded-[20px] text-sm font-bold transition-all ${lang === 'ne' ? 'bg-cyan-500 text-white shadow-md scale-[1.02]' : 'bg-[#222630] text-zinc-400 hover:text-zinc-200 hover:bg-[#2A2E38]'}`}
            >
              Nepali
            </button>
          </div>
        </div>

        <div className="bg-[#1A1D24] p-6 rounded-[28px] shadow-sm">
          <label className="block text-xs text-zinc-500 uppercase font-bold tracking-wider mb-4">Flashcard Order</label>
          <div className="flex gap-3">
            <button 
              onClick={() => handleFlashcardOrderChange('sequential')} 
              className={`flex-1 py-3.5 rounded-[20px] text-sm font-bold transition-all ${flashcardOrder === 'sequential' ? 'bg-cyan-500 text-white shadow-md scale-[1.02]' : 'bg-[#222630] text-zinc-400 hover:text-zinc-200 hover:bg-[#2A2E38]'}`}
            >
              Sequential
            </button>
            <button 
              onClick={() => handleFlashcardOrderChange('random')} 
              className={`flex-1 py-3.5 rounded-[20px] text-sm font-bold transition-all ${flashcardOrder === 'random' ? 'bg-cyan-500 text-white shadow-md scale-[1.02]' : 'bg-[#222630] text-zinc-400 hover:text-zinc-200 hover:bg-[#2A2E38]'}`}
            >
              Random
            </button>
          </div>
        </div>

        <div className="bg-[#1A1D24] p-6 rounded-[28px] shadow-sm">
          <label className="block text-xs text-zinc-500 uppercase font-bold tracking-wider mb-4">Auto Flashcard Audio</label>
          <div className="flex gap-3">
            <button 
              onClick={() => handleAutoAudioLangChange('en')} 
              className={`flex-1 py-3.5 rounded-[20px] text-sm font-bold transition-all ${autoAudioLang === 'en' ? 'bg-cyan-500 text-white shadow-md scale-[1.02]' : 'bg-[#222630] text-zinc-400 hover:text-zinc-200 hover:bg-[#2A2E38]'}`}
            >
              English
            </button>
            <button 
              onClick={() => handleAutoAudioLangChange('ne')} 
              className={`flex-1 py-3.5 rounded-[20px] text-sm font-bold transition-all ${autoAudioLang === 'ne' ? 'bg-cyan-500 text-white shadow-md scale-[1.02]' : 'bg-[#222630] text-zinc-400 hover:text-zinc-200 hover:bg-[#2A2E38]'}`}
            >
              Nepali
            </button>
          </div>
        </div>

        <div className="bg-[#1A1D24] p-6 rounded-[28px] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-xs text-zinc-500 uppercase font-bold tracking-wider">Hard Card Notifications</label>
            <button onClick={handleTestNotification} className="text-cyan-400 hover:text-cyan-300 p-1 bg-cyan-500/10 rounded-full" title="Test Notification">
              <BellRing className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[0, 5, 15, 30, 60].map(interval => (
              <button 
                key={interval}
                onClick={() => handleNotificationIntervalChange(interval)} 
                className={`py-2 rounded-[16px] text-xs font-bold transition-all ${notificationInterval === interval ? 'bg-cyan-500 text-white shadow-md scale-[1.02]' : 'bg-[#222630] text-zinc-400 hover:text-zinc-200 hover:bg-[#2A2E38]'}`}
              >
                {interval === 0 ? 'Off' : interval === 60 ? '1 hr' : `${interval} min`}
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-[#1A1D24] p-6 rounded-[28px] shadow-sm">
          <label className="block text-xs text-cyan-400 uppercase font-bold tracking-wider mb-2">Import Words (TXT)</label>
          <p className="text-sm text-zinc-500 mb-4 font-medium">Format: Katakana|Romaji|English|Nepali</p>
          <label className="flex items-center justify-center gap-2 w-full py-4 bg-[#222630] text-zinc-100 rounded-[20px] text-sm font-bold cursor-pointer hover:bg-[#2A2E38] transition-colors shadow-sm active:scale-[0.98]">
            <Upload className="w-5 h-5 text-cyan-400" /> Choose File
            <input type="file" onChange={handleImport} className="hidden" accept=".txt" />
          </label>
        </div>

        <button onClick={resetData} className="w-full py-4 bg-pink-500/10 text-pink-500 rounded-[24px] text-sm font-bold flex items-center justify-center gap-2 hover:bg-pink-500/20 transition-colors active:scale-[0.98] mt-8">
          <Trash2 className="w-5 h-5" /> Reset All Progress
        </button>
      </div>
    </motion.div>
  );
}
