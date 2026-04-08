import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

export async function speak(text: string) {
  // 1. Try Capacitor Native TTS
  try {
    if (Capacitor.isNativePlatform()) {
      await TextToSpeech.speak({
        text: text,
        lang: 'ja-JP',
        rate: 0.9,
        pitch: 1.0,
      });
      return; // If successful, exit
    }
  } catch (e) {
    console.error("Capacitor TTS Error:", e);
    // If native fails (e.g., plugin not synced, language missing), fall through to web fallbacks
  }

  // 2. Fallback to Web Speech API
  try {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    console.error("Web Speech API Error:", e);
  }
}
