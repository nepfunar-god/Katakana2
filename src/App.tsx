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
  const [hideNav, setHideNav] = useState(false);
  
  const historyRef = useRef<ViewState[]>(['learn']);
  const currentViewRef = useRef<ViewState>('splash');

  useEffect(() => {
    const handleHideNav = (e: Event) => {
      setHideNav((e as CustomEvent).detail);
    };
    window.addEventListener('setHideNav', handleHideNav);
    return () => window.removeEventListener('setHideNav', handleHideNav);
  }, []);

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

  const showExitDialogRef = useRef(showExitDialog);
  useEffect(() => {
    showExitDialogRef.current = showExitDialog;
  }, [showExitDialog]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle: any = null;

    const setupListener = async () => {
      listenerHandle = await CapacitorApp.addListener('backButton', () => {
        if (showExitDialogRef.current) {
          setShowExitDialog(false);
          return;
        }

        const event = new CustomEvent('hardwareBackButton', { cancelable: true });
        window.dispatchEvent(event);
        if (event.defaultPrevented) {
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
    };

    setupListener();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, []);

  const handleFinishOnboarding = () => {
    localStorage.setItem('kn_onboarded', 'true');
    setIsOnboarded(true);
    handleSetView('learn');
  };

  const confirmExit = () => {
    CapacitorApp.exitApp();
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-gradient-to-br from-[#0B0F19] via-[#1A1124] to-[#4A154B] text-zinc-200 font-sans overflow-hidden selection:bg-cyan-500/30 pt-[env(safe-area-inset-top)]">
      <AnimatePresence mode="wait">
        {view === 'splash' && <SplashView key="splash" />}
      </AnimatePresence>

      {view !== 'splash' && view !== 'onboarding' && (
        <header className="flex-none h-[60px] bg-[#11131A]/40 backdrop-blur-xl z-50 flex items-center justify-between px-4 pt-1">
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

      <main className={`flex-1 overflow-y-auto relative scroll-smooth pt-2 ${hideNav ? 'pb-4' : 'pb-24'}`}>
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

      {view !== 'splash' && view !== 'onboarding' && view !== 'draw' && view !== 'quiz' && !hideNav && (
        <div className="absolute bottom-4 left-4 right-4 z-40">
          {/* FAB */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-5 z-50">
            <button 
              onClick={() => { playClick(); handleSetView('game'); }}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${view === 'game' ? 'bg-cyan-500 text-white' : 'bg-[#11131A] text-cyan-500 border-[3px] border-[#1A1D24]'}`}
            >
              <Rocket className="w-5 h-5" fill={view === 'game' ? 'currentColor' : 'none'} />
            </button>
          </div>
          
          {/* Nav Bar Background with Cutout */}
          <nav 
            className="w-full h-[60px] bg-[#1A1D24] rounded-[24px] flex justify-between items-center px-2 shadow-2xl"
            style={{
              maskImage: 'radial-gradient(circle at 50% -10px, transparent 34px, black 35px)',
              WebkitMaskImage: 'radial-gradient(circle at 50% -10px, transparent 34px, black 35px)'
            }}
          >
            <div className="flex w-[42%] justify-around">
              <NavItem icon={<Book />} label="Learn" active={view === 'learn'} onClick={() => handleSetView('learn')} />
              <NavItem icon={<Layers />} label="Practice" active={view === 'practice'} onClick={() => handleSetView('practice')} />
            </div>
            <div className="flex w-[42%] justify-around">
              <NavItem icon={<Clock />} label="Time" active={view === 'time'} onClick={() => handleSetView('time')} />
              <NavItem icon={<CalendarDays />} label="Date" active={view === 'date'} onClick={() => handleSetView('date')} />
            </div>
          </nav>
        </div>
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
      className="flex flex-col items-center justify-center min-w-[48px] flex-1 relative group active:scale-95 transition-transform pt-1"
    >
      <div className={`flex items-center justify-center transition-all duration-300 ${active ? 'text-cyan-400' : 'text-zinc-400 group-hover:text-zinc-300'} mb-0.5 [&>svg]:w-5 [&>svg]:h-5`}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold tracking-wide transition-colors ${active ? 'text-cyan-400' : 'text-zinc-500'}`}>{label}</span>
    </button>
  );
}
