/** Multi-language token announcements for TV mode (Web Speech API). */
export const LANGUAGES: { code: string; label: string; voice: string; say: (n: number, c: number) => string }[] = [
  { code: 'en', label: 'English', voice: 'en-IN', say: (n, c) => `Token ${n}, please come to counter ${c}.` },
  { code: 'ms', label: 'Bahasa Melayu', voice: 'ms-MY', say: (n, c) => `Nombor ${n}, sila ke kaunter ${c}.` },
  { code: 'ml', label: 'മലയാളം', voice: 'ml-IN', say: (n, c) => `ടോക്കൺ ${n}, കൗണ്ടർ ${c}-ലേക്ക് വരിക.` },
  { code: 'ta', label: 'தமிழ்', voice: 'ta-IN', say: (n, c) => `டோக்கன் ${n}, கவுண்டர் ${c}-க்கு வாருங்கள்.` },
  { code: 'hi', label: 'हिन्दी', voice: 'hi-IN', say: (n, c) => `टोकन ${n}, कृपया काउंटर ${c} पर आइए।` },
  { code: 'ar', label: 'العربية', voice: 'ar-SA', say: (n, c) => `الرقم ${n}، يرجى التوجه إلى الشباك ${c}.` },
];

function pickVoice(lang: string) {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const base = lang.split('-')[0];
  return voices.find((v) => v.lang === lang) || voices.find((v) => v.lang.startsWith(base)) || null;
}

export function announce(number: number, counter: number, languages: string[]) {
  if (!('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  for (const code of languages) {
    const l = LANGUAGES.find((x) => x.code === code);
    if (!l) continue;
    const u = new SpeechSynthesisUtterance(l.say(number, counter));
    u.lang = l.voice;
    const v = pickVoice(l.voice);
    if (v) u.voice = v;
    u.rate = 0.95;
    synth.speak(u);
  }
}

/** A short two-tone chime (no audio files needed). */
export function chime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const notes = [880, 1318.5];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const t = ctx.currentTime + i * 0.22;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.55);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch {
    /* audio not available */
  }
}

export function buzz() {
  try {
    navigator.vibrate?.([300, 120, 300, 120, 600]);
  } catch {
    /* not supported */
  }
}

export function notify(title: string, body: string) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.svg' });
    }
  } catch {
    /* not supported */
  }
}
