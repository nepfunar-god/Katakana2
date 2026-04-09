/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Layers, Gamepad2, Clock, Settings, Flame, CalendarDays, Rocket, PenTool } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { NavigationBar } from '@capgo/capacitor-navigation-bar';
import { App as CapacitorApp } from '@capacitor/app';
import LearnView from './views/LearnView';
import PracticeView from './views/PracticeView';
import QuizView from './views/QuizView';
import GameView from './views/GameView';
import DrawView from './views/DrawView';
import TimeView from './views/TimeView';
import DateView from './views/DateView';
import SettingsView from './views/SettingsView';
import OnboardingView from './views/OnboardingView';
import SplashView from './views/SplashView';
import { playClick } from './utils/audio';
import { setupNotifications, sendTestNotification } from './utils/notifications';

export type ViewState = 'splash' | 'onboarding' | 'learn' | 'practice' | 'quiz' | 'game' | 'draw' | 'time' | 'date' | 'settings';

export default function App() {
  const [view, setView] = useState<ViewState>('splash');
  const [streak, setStreak] = useState(0);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  
  const historyRef = useRef<ViewState[]>(['learn']);
  const currentViewRef = useRef<ViewState>('splash');

  const handleSetView = (newView: ViewState) => {
    const hist = historyRef.current;
    if (newView === 'learn') {
      historyRef.current = ['learn'];
    } else if (hist.length > 1 && hist[hist.length - 2] === newView) {
      hist.pop();
    } else if (newView !== currentViewRef.current) {
      hist.push(newView);
    }
    currentViewRef.current = newView;
    setView(newView);
  };

  useEffect(() => {
    const updateSystemBars = async () => {
      if (!Capacitor.isNativePlatform()) return;
      
      try {
        const isSplash = view === 'splash';
        const isOnboarding = view === 'onboarding';
        const statusBarColor = isSplash ? '#050811' : '#11131A';
        const navBarColor = isSplash ? '#050811' : (isOnboarding ? '#11131A' : '#1A1D24');

        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setBackgroundColor({ color: '#00000000' });
        await StatusBar.setStyle({ style: Style.Dark });
        
        // Ensure the body background matches so the transparent status bar looks correct
        document.body.style.backgroundColor = statusBarColor;
        document.documentElement.style.backgroundColor = statusBarColor;
        
        await NavigationBar.setNavigationBarColor({ color: navBarColor, darkButtons: false });
      } catch (e) {
        console.error('Failed to update system bars', e);
      }
    };
    
    updateSystemBars();
  }, [view]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const onboarded = localStorage.getItem('kn_onboarded');
      if (!onboarded) {
        handleSetView('onboarding');
      } else {
        setIsOnboarded(true);
        handleSetView('learn');
        
        // Initialize notifications
        const interval = parseInt(localStorage.getItem('minna_notification_interval') || '0', 10);
        setupNotifications(interval);
        
        // Send a test notification on first load if requested by user
        const hasSentTest = localStorage.getItem('kn_test_notification_sent');
        if (!hasSentTest) {
          sendTestNotification();
          localStorage.setItem('kn_test_notification_sent', 'true');
        }
      }
    }, 3500);

    const savedStreak = localStorage.getItem('kn_streak');
    if (savedStreak) setStreak(parseInt(savedStreak, 10));

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backListener = CapacitorApp.addListener('backButton', () => {
      if (showExitDialog) {
        setShowExitDialog(false);
        return;
      }

      const cv = currentViewRef.current;
      if (cv === 'learn' || cv === 'splash' || cv === 'onboarding') {
        setShowExitDialog(true);
      } else {
        if (historyRef.current.length > 1) {
          historyRef.current.pop();
          const prevView = historyRef.current[historyRef.current.length - 1];
          currentViewRef.current = prevView;
          setView(prevView);
        } else {
          setShowExitDialog(true);
        }
      }
    });

    return () => {
      backListener.remove();
    };
  }, [showExitDialog]);

  const handleFinishOnboarding = () => {
    localStorage.setItem('kn_onboarded', 'true');
    setIsOnboarded(true);
    handleSetView('learn');
  };

  const confirmExit = () => {
    CapacitorApp.exitApp();
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#11131A] text-zinc-200 font-sans overflow-hidden selection:bg-cyan-500/30 pt-[env(safe-area-inset-top)]">
      <AnimatePresence mode="wait">
        {view === 'splash' && <SplashView key="splash" />}
      </AnimatePresence>

      {view !== 'splash' && view !== 'onboarding' && (
        <header className="flex-none h-[60px] bg-[#11131A]/90 backdrop-blur-xl z-50 flex items-center justify-between px-4 pt-1">
          <div className="flex flex-col justify-center">
            <h1 className="text-[20px] font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tight">
              Katakana Pro
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#1A1D24]/80 px-2.5 py-1 rounded-full border border-white/5 shadow-sm">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-bold text-zinc-100">{streak}</span>
            </div>
            <button 
              onClick={() => { playClick(); handleSetView('settings'); }}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1A1D24]/80 border border-white/5 text-zinc-400 hover:text-zinc-200 active:scale-95 transition-all shadow-sm"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      <main className="flex-1 overflow-y-auto relative scroll-smooth pt-2 pb-24">
        <AnimatePresence mode="wait">
          {view === 'onboarding' && <OnboardingView key="onboarding" onFinish={handleFinishOnboarding} />}
          {view === 'learn' && <LearnView key="learn" />}
          {view === 'practice' && <PracticeView key="practice" setView={handleSetView} />}
          {view === 'quiz' && <QuizView key="quiz" setStreak={setStreak} setView={handleSetView} />}
          {view === 'game' && <GameView key="game" />}
          {view === 'draw' && <DrawView key="draw" setView={handleSetView} />}
          {view === 'time' && <TimeView key="time" />}
          {view === 'date' && <DateView key="date" />}
          {view === 'settings' && <SettingsView key="settings" setView={handleSetView} />}
        </AnimatePresence>
      </main>

      {view !== 'splash' && view !== 'onboarding' && (
        <nav className="absolute bottom-0 w-full flex-none h-[76px] bg-[#1A1D24]/95 backdrop-blur-3xl border-t border-white/5 flex justify-between items-center px-2 pb-4 pt-2 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-x-auto scrollbar-hide gap-1">
          <NavItem icon={<Book />} label="Learn" active={view === 'learn'} onClick={() => handleSetView('learn')} />
          <NavItem icon={<Layers />} label="Practice" active={view === 'practice'} onClick={() => handleSetView('practice')} />
          <NavItem icon={<Rocket />} label="Game" active={view === 'game'} onClick={() => handleSetView('game')} />
          <NavItem icon={<Clock />} label="Time" active={view === 'time'} onClick={() => handleSetView('time')} />
          <NavItem icon={<CalendarDays />} label="Date" active={view === 'date'} onClick={() => handleSetView('date')} />
        </nav>
      )}

      {/* Exit Confirmation Dialog */}
      <AnimatePresence>
        {showExitDialog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1A1D24] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-2">Exit App?</h3>
              <p className="text-zinc-400 mb-6 font-medium">Are you sure you want to exit Katakana Pro?</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowExitDialog(false)}
                  className="flex-1 py-3 rounded-xl bg-[#222630] text-white font-bold hover:bg-[#2A2E38] transition-colors"
                >
                  No
                </button>
                <button 
                  onClick={confirmExit}
                  className="flex-1 py-3 rounded-xl bg-red-500/20 text-red-500 font-bold hover:bg-red-500/30 transition-colors"
                >
                  Yes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={() => {
        playClick();
        onClick();
      }}
      className="flex flex-col items-center justify-center min-w-[48px] flex-1 relative group active:scale-95 transition-transform"
    >
      <div className={`flex items-center justify-center w-12 h-7 rounded-full transition-all duration-300 ${active ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-400 group-hover:text-zinc-300'} mb-1 [&>svg]:w-4 [&>svg]:h-4`}>
        {icon}
      </div>
      <span className={`text-[10px] font-medium tracking-wide transition-colors ${active ? 'text-cyan-400' : 'text-zinc-500'}`}>{label}</span>
    </button>
  );
}
