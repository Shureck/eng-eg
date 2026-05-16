export function speak(text: string, lang: string = "en-US"): void {
  if (!text.trim()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.92;
  window.speechSynthesis.speak(u);
}
