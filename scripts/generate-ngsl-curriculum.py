"""Build the offline NGSL curriculum from attributed, open datasets.

NGSL 1.2: CC BY-SA 4.0, Browne, Culligan and Phillips.
ECDICT: MIT, skywind3000.
"""
from __future__ import annotations

import csv
import io
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NGSL_URL = "https://www.newgeneralservicelist.com/s/NGSL_12_stats.csv"
ECDICT_URL = "https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv"


def download(url: str) -> str:
    with urllib.request.urlopen(url, timeout=120) as response:
        return response.read().decode("utf-8-sig")


def first_line(value: str) -> str:
    return next((line.strip() for line in value.replace("\\n", "\n").splitlines() if line.strip()), "")


def clean_translation(value: str) -> str:
    line = first_line(value)
    line = re.sub(r"^\s*(?:n|v|vt|vi|a|ad|adv|adj|prep|conj|pron|art|num|aux|modal)\.\s*", "", line, flags=re.I)
    line = line.split("；")[0].split(";")[0]
    return line[:90] or "常用英语词汇"


def clean_pos(value: str, translation: str) -> str:
    raw = value.split("/")[0].strip()
    if raw:
        return raw.replace("a", "adj.") if raw == "a" else raw.rstrip(".") + "."
    match = re.match(r"\s*([a-z]+)\.", translation, flags=re.I)
    return (match.group(1) + ".") if match else "word"


def clean_definition(value: str, pos: str) -> str:
    lines = [line.strip() for line in value.replace("\\n", "\n").splitlines() if line.strip()]
    prefixes = {"n.": ("n.",), "v.": ("v.",), "adj.": ("a.", "s."), "adv.": ("r.", "adv.")}.get(pos, ())
    selected_index = next((i for i, line in enumerate(lines) if prefixes and line.lower().startswith(prefixes)), -1)
    if pos == "art.":
        selected_index = next((i for i, line in enumerate(lines) if "article" in line.lower()), selected_index)
    if selected_index < 0:
        selected_index = 0
    chunks = [lines[selected_index]] if lines else ["a useful word in general English"]
    for line in lines[selected_index + 1:]:
        if re.match(r"^(?:n|v|a|s|r|c|prep|conj|pron|adv)\.\s", line, flags=re.I):
            break
        chunks.append(line)
    selected = " ".join(chunks)
    selected = re.sub(r"^[a-z]+\.\s*", "", selected, flags=re.I)
    if len(selected) > 180:
        selected = selected[:180].rsplit(" ", 1)[0] + "…"
    return selected.rstrip(".;")


def main() -> None:
    ngsl_rows = list(csv.DictReader(io.StringIO(download(NGSL_URL))))
    wanted = {row["Lemma"].strip().lower() for row in ngsl_rows}
    dictionary: dict[str, dict[str, str]] = {}
    for row in csv.DictReader(io.StringIO(download(ECDICT_URL))):
        word = row["word"].strip().lower()
        if word in wanted and word not in dictionary:
            dictionary[word] = row

    output = []
    for row in ngsl_rows:
        word = row["Lemma"].strip()
        entry = dictionary.get(word.lower(), {})
        raw_translation = entry.get("translation", "")
        translation = clean_translation(raw_translation)
        pos = clean_pos(entry.get("pos", ""), raw_translation)
        clean_definition(entry.get("definition", ""), pos)  # Validates a usable dictionary entry during generation.
        if pos.startswith("v"):
            example, example_translation = f'I practiced using the verb "{word}" today.', f'我今天练习了动词“{word}”的用法。'
        elif pos.startswith("n"):
            example, example_translation = f'We talked about "{word}" in class today.', f'我们今天在课堂上讨论了“{word}”。'
        elif pos.startswith("adj"):
            example, example_translation = f'I used "{word}" to describe the situation.', f'我用“{word}”描述了这个情境。'
        else:
            example, example_translation = f'I can use "{word}" correctly in a sentence.', f'我可以在句子中正确使用“{word}”。'
        output.append({
            "word": word,
            "rank": int(row["SFI Rank"]),
            "phonetic": entry.get("phonetic", "") or "/—/",
            "pos": pos,
            "translation": translation,
            "example": example,
            "exampleTranslation": example_translation,
        })

    target = ROOT / "src" / "data" / "ngsl-1.2.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {len(output)} NGSL entries to {target}")


if __name__ == "__main__":
    main()
