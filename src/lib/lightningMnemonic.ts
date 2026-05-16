/** Подбор «якорных» слов для молниеносного режима: пересечение ключ ↔ ответ */

export const MNEMONIC_STOPWORDS = new Set(
  [
    "the",
    "and",
    "for",
    "are",
    "but",
    "not",
    "you",
    "all",
    "can",
    "her",
    "was",
    "one",
    "our",
    "out",
    "his",
    "has",
    "had",
    "how",
    "what",
    "which",
    "when",
    "where",
    "who",
    "this",
    "that",
    "with",
    "from",
    "they",
    "have",
    "been",
    "will",
    "your",
    "more",
    "some",
    "such",
    "into",
    "than",
    "then",
    "them",
    "also",
    "its",
    "may",
    "any",
    "each",
    "other",
    "about",
    "being",
    "only",
    "over",
    "very",
    "just",
    "like",
    "most",
    "both",
    "same",
    "well",
    "here",
    "make",
    "made",
    "does",
    "did",
    "use",
    "using",
    // русские частые
    "для",
    "или",
    "как",
    "это",
    "все",
    "его",
    "её",
    "них",
    "при",
    "над",
    "под",
    "без",
    "где",
    "что",
    "кто",
    "то",
    "по",
    "из",
    "мы",
    "вы",
    "он",
    "она",
    "они",
    "быть",
    "есть",
    "был",
    "была",
    "были",
    "этот",
    "эта",
    "эти",
    "тот",
    "та",
    "те",
    "так",
    "ещё",
    "уже",
    "или",
    "ли",
    "не",
    "ни",
    "да",
    "нет",
  ].map((w) => w.toLowerCase()),
);

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeWord(w: string): string {
  return w
    .normalize("NFC")
    .toLowerCase()
    .replace(/^[„"'«»()[\]{}]+|[„"'«»()[\]{}.,:;!?]+$/gu, "");
}

/** Уникальные значимые слова по порядку первого появления */
export function extractSignificantWords(s: string): string[] {
  const m = s.match(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu);
  if (!m) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of m) {
    const w = normalizeWord(raw);
    if (w.length < 3 || MNEMONIC_STOPWORDS.has(w) || seen.has(w)) continue;
    seen.add(w);
    out.push(w);
  }
  return out;
}

function longestCommonSubstring(a: string, b: string, minLen = 5): string | null {
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  if (!la.length || !lb.length) return null;
  let best = "";
  const limit = Math.min(la.length, 80);
  for (let i = 0; i < la.length; i++) {
    const maxL = Math.min(la.length - i, 40);
    for (let len = maxL; len >= minLen; len--) {
      const sub = la.slice(i, i + len);
      if (lb.includes(sub) && sub.length > best.length) best = sub;
    }
    if (i > limit) break;
  }
  return best.length >= minLen ? best : null;
}

/**
 * До двух слов (или одного общего фрагмента), встречающихся и в ключе, и в ответе.
 */
export function findMnemonicTokens(key: string, answer: string, max = 2): string[] {
  const keySet = new Set(extractSignificantWords(key));
  const ansOrder = extractSignificantWords(answer);
  const shared: string[] = [];
  for (const w of ansOrder) {
    if (keySet.has(w) && !shared.includes(w)) {
      shared.push(w);
      if (shared.length >= max) return shared;
    }
  }
  if (shared.length > 0) return shared;
  const sub = longestCommonSubstring(key, answer);
  return sub ? [sub] : [];
}
