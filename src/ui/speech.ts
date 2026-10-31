/** German text-to-speech through the browser. Silently does nothing without a German voice. */

function germanVoice(): SpeechSynthesisVoice | undefined {
  if (typeof speechSynthesis === 'undefined') return undefined;
  const voices = speechSynthesis.getVoices();
  return voices.find((v) => v.lang === 'de-DE') ?? voices.find((v) => v.lang.startsWith('de'));
}

export const canSpeak = (): boolean => typeof speechSynthesis !== 'undefined';

export function speak(text: string): void {
  if (!canSpeak()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  u.rate = 0.9;
  const voice = germanVoice();
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

/** The full spoken form: nouns with their article. */
export function spokenForm(item: { german: string; article?: string }): string {
  return item.article ? `${item.article} ${item.german}` : item.german;
}
