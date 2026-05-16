#!/usr/bin/env python3
"""
Читает src/data/questions.json (канон EN), переводит поля *_ru в русский,
пишет src/data/questions.ru.json (та же структура, англ. stem поля копируются из EN).
Кэш: scripts/ru_translation_cache.json
"""
from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src" / "data" / "questions.json"
OUT = ROOT / "src" / "data" / "questions.ru.json"
CACHE_PATH = ROOT / "scripts" / "ru_translation_cache.json"


def load_cache() -> dict[str, str]:
    if CACHE_PATH.exists():
        return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    return {}


def save_cache(c: dict[str, str]) -> None:
    CACHE_PATH.write_text(json.dumps(c, ensure_ascii=False, indent=2), encoding="utf-8")


def tr(text: str, cache: dict[str, str]) -> str:
    text = (text or "").strip()
    if not text:
        return ""
    if text in cache:
        return cache[text]
    try:
        from deep_translator import GoogleTranslator

        g = GoogleTranslator(source="en", target="ru")
        # обрезка на случай лимита API
        chunk = text[:4900]
        out = (g.translate(chunk) or "").strip()
        cache[text] = out or text
        time.sleep(0.04)
        if len(cache) % 80 == 0:
            save_cache(cache)
        return cache[text]
    except Exception as e:
        print("translate error:", e, file=sys.stderr)
        cache[text] = text
        return text


def strip_type1_question(q: str) -> str:
    q = re.sub(
        r"^Choose the correct variant\.\s*",
        "",
        q,
        flags=re.I,
    )
    q = re.sub(
        r"^Fill in the gap with the most appropriate word combination\.\s*",
        "",
        q,
        flags=re.I,
    )
    return q.strip()


def explain_ru_template(correct_key: str, correct_text_ru: str, question_ru: str) -> str:
    # Короткое объяснение целиком на русском
    base = (
        f"Верный ответ — вариант {correct_key}: «{correct_text_ru}». "
        "Это соответствует формулировке из методического банка; запомните её для экзамена."
    )
    return base


def main() -> None:
    cache = load_cache()
    data = json.loads(SRC.read_text(encoding="utf-8"))
    out = {"type1": [], "type2": [], "type3": []}

    for q in data["type1"]:
        q_en = q["question"]
        core = strip_type1_question(q_en)
        q_ru = tr(core, cache)
        opts_ru = [tr(o["text"], cache) for o in q["options"]]
        ck = q["correct"]
        ix = next(i for i, o in enumerate(q["options"]) if o["key"] == ck)
        expl = explain_ru_template(ck, opts_ru[ix], q_ru)
        out["type1"].append(
            {
                **q,
                "translation_ru": q_ru,
                "options_ru": opts_ru,
                "explanation_ru": expl,
            }
        )

    for q in data["type2"]:
        terms_ru = [tr(t, cache) for t in q["terms"]]
        defs_ru = [tr(d, cache) for d in q["definitions"]]
        pairs_txt = []
        for ti, t in enumerate(q["terms"]):
            d_en = q["correct"][t]
            di = q["definitions"].index(d_en)
            pairs_txt.append(f"{terms_ru[ti]} → {defs_ru[di]}")
        expl = tr("Correct pairs: " + "; ".join(pairs_txt) + " Memorize them.", cache)
        trans_line = (q.get("translation_ru") or "").strip()
        keyword_line = (q.get("keyword_hint") or "").strip()
        if trans_line and re.search(r"[А-Яа-яЁё]", trans_line):
            transl = trans_line
            if keyword_line:
                transl = f"{transl} ({tr(keyword_line, cache)})"
        else:
            transl = tr(trans_line or keyword_line or "Match each term with its definition.", cache)
        out["type2"].append(
            {
                **q,
                "terms_ru": terms_ru,
                "definitions_ru": defs_ru,
                "translation_ru": transl,
                "explanation_ru": expl,
            }
        )

    for q in data["type3"]:
        words = []
        for w in q["words"]:
            words.append({**w, "text_ru": tr(w["text"], cache)})
        sent_ru = tr(q["full_sentence"], cache)
        expl = f"Правильный порядок собирает такое предложение (RU): {sent_ru}"
        out["type3"].append(
            {
                **q,
                "words": words,
                "translation_ru": sent_ru,
                "explanation_ru": expl,
            }
        )

    save_cache(cache)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print("written", OUT, "type1", len(out["type1"]), "type2", len(out["type2"]), "type3", len(out["type3"]))


if __name__ == "__main__":
    main()
