#!/usr/bin/env python3
"""
Извлекает банк вопросов из PDF → public/data/questions.json

По умолчанию: русские поля заполняются шаблонами + безопасный fallback (англ.).
Флаг --translate: Google Translate через deep-translator + кэш scripts/translations_cache.json
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "вопросы к тесту.pdf"
OUT_PATH = ROOT / "src" / "data" / "questions.json"
CACHE_PATH = ROOT / "scripts" / "translations_cache.json"


def pdf_full_text() -> str:
    r = PdfReader(str(PDF_PATH))
    return "\n".join((p.extract_text() or "") for p in r.pages)


def norm(s: str) -> str:
    s = s.replace("\u00a0", " ")
    s = re.sub(r"[ \t]+\n", "\n", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


PAGE_HEADER_RE = re.compile(
    r"(?:^|\n)\d+\s*\n№\s*\nп/п[\s\S]*?Время\s*\nвыпол-\s*\nнения\s*\n\(мин\.\)\s*\n",
    re.M,
)


def strip_page_noise(sec: str) -> str:
    """Убирает повторяющиеся шапки таблицы между страницами (типы 2 и 3)."""
    return PAGE_HEADER_RE.sub("\n", sec)


def translate_lines(texts: list[str], cache: dict[str, str]) -> list[str]:
    try:
        from deep_translator import GoogleTranslator
    except ImportError:
        return [cache.get(t, t) for t in texts]

    tr = GoogleTranslator(source="en", target="ru")
    out: list[str] = []
    for i, t in enumerate(texts):
        t = (t or "").strip()
        if not t:
            out.append("")
            continue
        if t in cache:
            out.append(cache[t])
            continue
        try:
            cache[t] = (tr.translate(t[:4800]) or t).strip()
            time.sleep(0.06)
        except Exception as e:
            print("translate fail:", e, file=sys.stderr)
            cache[t] = t
        out.append(cache[t])
        if (i + 1) % 50 == 0:
            CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    return out


# Для нарезки чанков — мягче, чем полный заголовок (PDF обрывает «combination.»)
SPLIT_RE = re.compile(r"^(\d+)\.\s+(?:Choose the correct|Fill in the gap)", re.M)


# ---------- Type 1 ----------
HEAD_RE = re.compile(
    r"^(\d+)\.\s*((?:Choose the correct\s+variant\.|Fill in the gap with the\s+most appropriate word\s+combination\.))\s*",
    re.M | re.S,
)


def split_type1(section: str) -> list[str]:
    idx = [m.start() for m in SPLIT_RE.finditer(section)]
    if not idx:
        return []
    chunks: list[str] = []
    for i, start in enumerate(idx):
        end = idx[i + 1] if i + 1 < len(idx) else len(section)
        chunks.append(section[start:end].strip())
    return chunks


OPT_RE = re.compile(r"([A-D])\)\s*", re.M)


def sanitize_false_rd1(chunk: str) -> str:
    """
    Убирает ложный блок РД, если ответ стоит до того, как допечатали все варианты
    (типичный обрыв PDF). Букву «ответа» из удалённого блока возвращаем в конец,
    когда после обрыва действительно появляются оставшиеся A-D).
    """
    pending_ans: str | None = None
    while True:
        m = re.search(
            r"([A-D])\s*РД-1\s*\nРД-2\s*\n(?:РД-3\s*\n)?(?:\d+\s*\n)+",
            chunk,
        )
        if not m:
            break
        prefix = chunk[: m.start()]
        after = chunk[m.end() :]
        opts = len(list(OPT_RE.finditer(prefix)))
        more_opts = bool(re.search(r"(?:^|\n)\s*[A-D]\)\s", after))
        if opts < 4 and more_opts:
            pending_ans = m.group(1)
            chunk = prefix + after
            continue
        break
    if pending_ans and not re.search(r"РД-1", chunk):
        chunk = chunk.rstrip() + f"\n\n{pending_ans} РД-1\nРД-2\nРД-3\n\n1\n"
    return chunk


def sanitize_type1_section(sec: str) -> str:
    heads = list(SPLIT_RE.finditer(sec))
    if not heads:
        return sec
    out: list[str] = []
    for i, hm in enumerate(heads):
        start = hm.start()
        end = heads[i + 1].start() if i + 1 < len(heads) else len(sec)
        out.append(sanitize_false_rd1(sec[start:end]))
    return "".join(out)


def parse_type1_chunk(chunk: str) -> dict | None:
    # PDF иногда даёт строчные a) b) c) d) у вариантов MCQ
    chunk = re.sub(
        r"(^|\n)\s*([a-d])\)\s*",
        lambda m: f"{m.group(1)}{m.group(2).upper()}) ",
        chunk,
        flags=re.M,
    )
    # Обрыв колонок: после «with the» сразу идёт A) в той же строке
    chunk = re.sub(
        r"^(\d+\. Fill in the gap with the)\s*(?=\s*A\)\s)",
        r"\1\nmost appropriate word\ncombination.\n",
        chunk,
        flags=re.M,
    )
    # «Fill… word», затем сразу варианты без строки combination.
    chunk = re.sub(
        r"^(\d+\. Fill in the gap with the\s*\nmost appropriate word)\s*\n(?=\s*A\)\s)",
        r"\1\ncombination.\n",
        chunk,
        flags=re.M,
    )
    # Мусор вида «…of A РД-1 1» внутри строки варианта (обрыв колонок)
    bad_inline = re.search(r"\s+([A-D])\s*РД-1\s*\d+\s*", chunk)
    pending_rd = bad_inline.group(1) if bad_inline else None
    chunk = re.sub(r"\s+([A-D])\s*РД-1\s*\d+\s*", "\n", chunk)
    if pending_rd and not re.search(r"РД-1", chunk):
        chunk = re.sub(
            r"\nРД-2\s*\nРД-3",
            f"\n{pending_rd} РД-1\nРД-2\nРД-3",
            chunk,
            count=1,
        )
    m = HEAD_RE.match(chunk)
    if not m:
        return None
    qnum = int(m.group(1))
    prefix = re.sub(r"\s+", " ", m.group(2).replace("\n", " ").strip())
    rest = chunk[m.end() :]

    ans_m = re.search(r"([A-DА-Яа-я])\s*РД-1", rest)
    if not ans_m:
        return None
    letter = ans_m.group(1)
    cmap = {"А": "A", "В": "B", "С": "C", "D": "D", "а": "A", "в": "B", "с": "C", "d": "D"}
    correct = cmap.get(letter, letter).upper()
    if correct not in "ABCD":
        correct = letter.upper()
    body = rest[: ans_m.start()]

    opts_iter = list(OPT_RE.finditer(body))
    if len(opts_iter) < 3:
        return None

    q_end = opts_iter[0].start()
    question = body[:q_end].strip()
    question = re.sub(r"\s+", " ", question.replace("\n", " "))

    n_opts = min(4, len(opts_iter))
    options: list[dict[str, str]] = []
    keys = ["A", "B", "C", "D"]
    for i in range(4):
        if i < n_opts:
            start = opts_iter[i].end()
            end = opts_iter[i + 1].start() if i + 1 < len(opts_iter) else len(body)
            key = opts_iter[i].group(1)
            text = body[start:end].strip()
            text = re.sub(r"\s+", " ", text.replace("\n", " "))
            options.append({"key": key, "text": text})
        else:
            options.append({"key": keys[i], "text": "(вариант отсутствует в PDF)"})

    stem = (prefix + " " + question).strip()

    neg = bool(
        re.search(r"\bNOT\b", stem, re.I)
        or re.search(r"\bis\s+NOT\b", stem, re.I)
    )

    tags = infer_tags(stem + " " + " ".join(o["text"] for o in options))

    return {
        "id": qnum,
        "question": stem,
        "options": options,
        "correct": correct,
        "hasNegation": neg,
        "tags": tags,
    }


def infer_tags(blob: str) -> list[str]:
    b = blob.lower()
    tags: set[str] = set()
    kw = [
        ("calculus", ["derivative", "integral", "calculus", "partial derivative"]),
        ("linear_algebra", ["matrix", "linear programming", "gauss"]),
        ("statistics", ["regression", "variance", "hypothesis", "chi-square", "anova"]),
        ("econometrics", ["econometr", "time series", "arima"]),
        ("probability", ["probability", "nash", "game theory"]),
        ("microeconomics", ["demand", "supply", "elasticity", "utility", "market"]),
        ("macroeconomics", ["gdp", "inflation", "monetary policy", "aggregate"]),
        ("finance", ["investment", "stock", "bond", "cash flow"]),
        ("business", ["business model", "company", "risk management"]),
        ("data", ["data mining", "visualization", "focus group"]),
    ]
    for tag, keys in kw:
        if any(k in b for k in keys):
            tags.add(tag)
    if not tags:
        tags.add("general")
    return sorted(tags)[:6]


# ---------- Type 2 ----------
PAIR_RE = re.compile(r"^(\d)-([abc])$")


def split_type2(section_raw: str) -> list[str]:
    sec = strip_page_noise(section_raw)
    markers = [m.start() for m in re.finditer(r"(?:^|\n)(\d+)\.\s+Match the word", sec)]
    chunks: list[str] = []
    for i, start in enumerate(markers):
        end = markers[i + 1] if i + 1 < len(markers) else len(sec)
        chunks.append(sec[start:end].strip())
    return chunks


def parse_type2_block(block: str) -> dict | None:
    raw_lines = [ln.strip() for ln in block.splitlines() if ln.strip()]
    raw_lines = [ln for ln in raw_lines if not ln.startswith("РД-")]

    answers: dict[int, str] = {}
    lines: list[str] = []
    for ln in raw_lines:
        pm = PAIR_RE.match(ln)
        if pm:
            answers[int(pm.group(1))] = pm.group(2)
            continue
        if "Тестовое задание" in ln:
            continue
        if re.fullmatch(r"\d+", ln):
            continue
        lines.append(ln)

    if not lines:
        return None

    # Заголовок вопроса (может быть многострочным)
    hblob_parts: list[str] = []
    i = 0
    hm = re.match(r"^(\d+)\.\s+Match the word\b(.*)$", lines[0], re.I)
    if not hm:
        return None
    qid = int(hm.group(1))
    hblob_parts.append(lines[0])
    i = 1
    while i < len(lines) and "definitions" not in " ".join(hblob_parts).lower():
        hblob_parts.append(lines[i])
        i += 1
    header_blob = re.sub(r"\s+", " ", " ".join(hblob_parts))
    if "combinations with their definitions" not in header_blob.lower():
        return None

    rest = lines[i:]
    # Три термина: строки вида "1. Term"
    terms: list[str] = []
    j = 0
    while j < len(rest) and len(terms) < 3:
        tm = re.match(r"^(\d+)\.\s+(.+)$", rest[j])
        if tm and int(tm.group(1)) == len(terms) + 1:
            terms.append(tm.group(2).strip())
            j += 1
            continue
        # иногда после заголовка идёт лишняя строка
        j += 1
        if j > 25:
            break

    if len(terms) != 3:
        return None

    tail = rest[j:]
    # Определения: блоки a) b) c)
    defs_map: dict[str, str] = {"a": "", "b": "", "c": ""}
    cur: str | None = None
    buf: list[str] = []

    def flush() -> None:
        nonlocal cur, buf
        if cur:
            defs_map[cur] = re.sub(r"\s+", " ", " ".join(buf)).strip()
        cur = None
        buf = []

    for ln in tail:
        dm = re.match(r"^([abc])\)\s*(.*)$", ln)
        if dm:
            flush()
            cur = dm.group(1)
            buf = [dm.group(2).strip()] if dm.group(2).strip() else []
            continue
        if cur:
            buf.append(ln.strip())
    flush()

    if any(not defs_map[k] for k in ("a", "b", "c")) or len(answers) < 3:
        return None

    corr_map: dict[str, str] = {}
    for ti in (1, 2, 3):
        letter = answers.get(ti)
        if not letter:
            return None
        corr_map[terms[ti - 1]] = defs_map[letter]

    definitions = [defs_map[k] for k in ("a", "b", "c")]

    return {
        "id": qid,
        "terms": terms,
        "definitions": definitions,
        "correct": corr_map,
        "tags": infer_tags(" ".join(terms)),
    }


# ---------- Type 3 ----------


def split_type3(section_raw: str) -> list[str]:
    sec = strip_page_noise(section_raw)
    markers = [m.start() for m in re.finditer(r"(?:^|\n)(\d+)\.\s+Put the words", sec)]
    out: list[str] = []
    for i, start in enumerate(markers):
        end = markers[i + 1] if i + 1 < len(markers) else len(sec)
        out.append(sec[start:end].strip())
    return out


WORD_LINE_RE = re.compile(r"^([A-G])\)\s*(.*)$")


def parse_type3_block(block: str) -> dict | None:
    lines = [ln.strip() for ln in block.splitlines() if ln.strip() and not ln.startswith("РД-")]
    if not lines:
        return None
    hm = re.match(r"^(\d+)\.\s+Put the words", lines[0], re.I)
    if not hm:
        return None
    qid = int(hm.group(1))

    words: dict[str, str] = {}
    i = 1
    while i < len(lines):
        wm = WORD_LINE_RE.match(lines[i])
        if wm:
            key = wm.group(1)
            parts = [wm.group(2).strip()]
            i += 1
            while i < len(lines):
                nxt = lines[i]
                if WORD_LINE_RE.match(nxt):
                    break
                if "," in nxt and re.fullmatch(r"[\s,A-G]+", nxt):
                    break
                parts.append(nxt)
                i += 1
            words[key] = re.sub(r"\s+", " ", " ".join(parts)).strip()
            continue
        i += 1

    order_fragments = [ln for ln in lines[1:] if "," in ln and re.fullmatch(r"[\s,A-G]+", ln)]
    letter_blob = " ".join(order_fragments)
    letters = re.findall(r"[A-G]", letter_blob)
    seen: set[str] = set()
    order_keys: list[str] = []
    for ch in letters:
        if ch not in seen:
            seen.add(ch)
            order_keys.append(ch)

    order_keys = [k for k in order_keys if k in words]
    if len(words) < 5 or len(order_keys) != len(words):
        return None

    word_list = [{"key": k, "text": words[k]} for k in sorted(words.keys())]
    full_sentence = " ".join(words[k] for k in order_keys)
    full_sentence = re.sub(r"\s+", " ", full_sentence)

    return {
        "id": qid,
        "words": word_list,
        "correct_order": order_keys,
        "full_sentence": full_sentence,
        "tags": infer_tags(full_sentence),
    }


# Жёстко заданные исправления для строк PDF с перепутанными колонками (тип 2)
MANUAL_TYPE2: dict[int, dict] = {
    7: {
        "terms": ["Econometric", "Stochastic process", "Bifurcation"],
        "definitions": [
            "the state of being divided into two branches or parts",
            "a probability model describing a collection of time-ordered random variables that represent the possible sample paths",
            "an application of statistical methods to economic data in order to give empirical content to economic relationships",
        ],
        "correct": {
            "Econometric": "an application of statistical methods to economic data in order to give empirical content to economic relationships",
            "Stochastic process": "a probability model describing a collection of time-ordered random variables that represent the possible sample paths",
            "Bifurcation": "the state of being divided into two branches or parts",
        },
    },
    12: {
        "terms": ["Socioeconomic indicator", "Business model", "Mathematical method"],
        "definitions": [
            "a group of steps taken that will always give you a correct formula, in every scenario",
            "a conceptual structure that supports the viability of the business",
            "an indicator that measures the economic status of a community, be it a small town, large city, country or continent",
        ],
        "correct": {
            "Socioeconomic indicator": "an indicator that measures the economic status of a community, be it a small town, large city, country or continent",
            "Business model": "a conceptual structure that supports the viability of the business",
            "Mathematical method": "a group of steps taken that will always give you a correct formula, in every scenario",
        },
    },
    13: {
        "terms": ["Social Mood", "Supply-side policies", "Downturn"],
        "definitions": [
            "a decline, often due to external factors such as recession, reduced demand for goods and services, or other negative influences",
            "a shared mental state among humans that arises from social interaction",
            "government economic policies aimed at making industries and markets operate better and more efficiently so that they contribute to greater underlying rate of GDP (gross domestic product) growth.",
        ],
        "correct": {
            "Social Mood": "a shared mental state among humans that arises from social interaction",
            "Supply-side policies": "government economic policies aimed at making industries and markets operate better and more efficiently so that they contribute to greater underlying rate of GDP (gross domestic product) growth.",
            "Downturn": "a decline, often due to external factors such as recession, reduced demand for goods and services, or other negative influences",
        },
    },
    16: {
        "terms": ["Interval estimation", "Quantitative forecast", "Consumption expenditure"],
        "definitions": [
            "a data-based mathematical process that sales teams use to understand performance and predict future revenue based on historical data and patterns",
            "spending by households and individuals on durable goods, nondurable goods, and services",
            "the use of sample data to estimate an interval of possible values of a parameter of interest",
        ],
        "correct": {
            "Interval estimation": "the use of sample data to estimate an interval of possible values of a parameter of interest",
            "Quantitative forecast": "a data-based mathematical process that sales teams use to understand performance and predict future revenue based on historical data and patterns",
            "Consumption expenditure": "spending by households and individuals on durable goods, nondurable goods, and services",
        },
    },
    20: {
        "terms": ["Proof-reading", "Multiple regression", "Simple linear regression"],
        "definitions": [
            "a type of regression where the dependent variable shows a linear relationship with two or more independent variables",
            "the process of carefully reading over a piece of text to identify and correct errors",
            "a regression model with a single explanatory variable",
        ],
        "correct": {
            "Proof-reading": "the process of carefully reading over a piece of text to identify and correct errors",
            "Multiple regression": "a type of regression where the dependent variable shows a linear relationship with two or more independent variables",
            "Simple linear regression": "a regression model with a single explanatory variable",
        },
    },
}


def short_kw(q: str) -> str:
    q = re.sub(
        r"^(Choose the correct variant\.|Fill in the gap with the most appropriate word combination\.)\s*",
        "",
        q,
        flags=re.I,
    )
    q = re.sub(r"\s+", " ", q.strip())
    return q[:80] + ("…" if len(q) > 80 else "")


def fill_russian_templates(data: dict, cache: dict[str, str], do_translate: bool) -> None:
    """Заполняет *_ru поля: шаблоны или машинный перевод."""

    def tr(lines: list[str]) -> list[str]:
        return translate_lines(lines, cache) if do_translate else lines

    for q in data["type1"]:
        cor = next(o for o in q["options"] if o["key"] == q["correct"])
        if do_translate:
            q["translation_ru"] = tr([q["question"]])[0]
            q["options_ru"] = tr([o["text"] for o in q["options"]])
            q["explanation_ru"] = tr(
                [
                    (
                        f'Question: {q["question"]}\nCorrect answer ({q["correct"]}): {cor["text"]}\n'
                        "Explain in 1–2 very simple Russian sentences why this is correct."
                    )
                ]
            )[0]
        else:
            q["translation_ru"] = q["question"]
            q["options_ru"] = [o["text"] for o in q["options"]]
            q["explanation_ru"] = (
                f'Верный ответ — вариант {q["correct"]}: «{cor["text"]}». '
                "Запомните формулировку из банка."
            )

        q["keyword_hint"] = short_kw(q["question"])

    for q in data["type2"]:
        if do_translate:
            q["terms_ru"] = tr(q["terms"])
            q["definitions_ru"] = tr(q["definitions"])
            pairs = [f'{t} → {q["correct"][t]}' for t in q["terms"]]
            q["translation_ru"] = tr(["Сопоставьте термины и определения: " + "; ".join(pairs)])[0]
            q["explanation_ru"] = tr(["Correct pairs: " + "; ".join(pairs)])[0]
        else:
            q["terms_ru"] = list(q["terms"])
            q["definitions_ru"] = list(q["definitions"])
            q["translation_ru"] = "Сопоставьте термины и определения (англ. текст ниже)."
            q["explanation_ru"] = "Правильные пары показаны после ответа; запомните соответствия."
        q["keyword_hint"] = ", ".join(q["terms"][:2])

    for q in data["type3"]:
        if do_translate:
            q["translation_ru"] = tr([q["full_sentence"]])[0]
            wr = tr([w["text"] for w in q["words"]])
            for w, r in zip(q["words"], wr):
                w["text_ru"] = r
            q["explanation_ru"] = tr(
                [f'Correct English sentence: {q["full_sentence"]}. Give a short Russian paraphrase.']
            )[0]
        else:
            q["translation_ru"] = q["full_sentence"]
            for w in q["words"]:
                w["text_ru"] = w["text"]
            q["explanation_ru"] = "Соберите порядок как в модели ответа; ниже — полное предложение."
        q["keyword_hint"] = q["words"][0]["text"][:48]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--translate",
        action="store_true",
        help="Перевести через Google Translate (медленно, нужен интернет). Кэш в scripts/translations_cache.json",
    )
    args = ap.parse_args()

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    cache: dict[str, str] = {}
    if CACHE_PATH.exists():
        cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))

    full = norm(pdf_full_text())
    m2 = re.search(r"ЗАДАНИЕ 2 ТИПА", full)
    m3 = re.search(r"ЗАДАНИЕ 3 ТИПА", full)
    if not m2 or not m3:
        raise SystemExit("Не найдены разделы ЗАДАНИЕ 2/3")

    sec1 = sanitize_type1_section(strip_page_noise(full[: m2.start()]))
    sec2 = full[m2.start() : m3.start()]
    sec3 = full[m3.start() :]

    type1_objs: list[dict] = []
    for ch in split_type1(sec1):
        p = parse_type1_chunk(ch)
        if p:
            type1_objs.append(p)
    type1_objs.sort(key=lambda x: x["id"])

    type2_objs: list[dict] = []
    for b in split_type2(sec2):
        p = parse_type2_block(b)
        if p:
            type2_objs.append(p)
    merged2 = {q["id"]: q for q in type2_objs}
    for qid, fix in MANUAL_TYPE2.items():
        merged2[qid] = {
            "id": qid,
            **fix,
            "tags": infer_tags(" ".join(fix["terms"])),
        }
    type2_objs = sorted(merged2.values(), key=lambda x: x["id"])

    type3_objs: list[dict] = []
    for b in split_type3(sec3):
        p = parse_type3_block(b)
        if p:
            type3_objs.append(p)
    type3_objs.sort(key=lambda x: x["id"])

    data = {"type1": type1_objs, "type2": type2_objs, "type3": type3_objs}

    print(
        "counts:",
        len(type1_objs),
        len(type2_objs),
        len(type3_objs),
        "total",
        len(type1_objs) + len(type2_objs) + len(type3_objs),
    )

    miss_t1 = [i for i in range(1, 151) if i not in {x["id"] for x in type1_objs}]
    miss_t2 = [i for i in range(1, 26) if i not in {x["id"] for x in type2_objs}]
    miss_t3 = [i for i in range(1, 26) if i not in {x["id"] for x in type3_objs}]
    if miss_t1 or miss_t2 or miss_t3:
        print("MISSING type1:", miss_t1, file=sys.stderr)
        print("MISSING type2:", miss_t2, file=sys.stderr)
        print("MISSING type3:", miss_t3, file=sys.stderr)

    fill_russian_templates(data, cache, args.translate)

    OUT_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print("written", OUT_PATH)


if __name__ == "__main__":
    main()
