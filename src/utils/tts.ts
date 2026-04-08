import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

function sanitizeForTTS(text: string): string {
  if (!text) return '';
  // Remove symbols like ~, (, ), [, ], {, }, -, _, etc.
  return text.replace(/[~～\(\)\[\]\{\}\-\_]/g, ' ').trim();
}

export async function speak(text: string, lang: string = 'ja-JP'): Promise<void> {
  const cleanText = sanitizeForTTS(text);
  if (!cleanText) return;

  // 1. Try Capacitor Native TTS
  try {
    if (Capacitor.isNativePlatform()) {
      await TextToSpeech.speak({
        text: cleanText,
        lang: lang,
        rate: 0.9,
        pitch: 1.0,
      });
      return; // If successful, exit and resolve promise
    }
  } catch (e) {
    console.error("Capacitor TTS Error:", e);
    // If native fails, fall through to web fallbacks
  }

  // 2. Fallback to Web Speech API
  return new Promise((resolve) => {
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = lang;
        utterance.rate = 0.9;
        
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        
        window.speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    } catch (e) {
      console.error("Web Speech API Error:", e);
      resolve();
    }
  });
}
