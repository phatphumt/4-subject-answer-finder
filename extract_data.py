"""Build data.js for the answer finder from the four answer-key PDFs."""
import json
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF

sys.stdout.reconfigure(encoding="utf-8")

BASE = Path(r"C:\Users\thanu\Documents\Answers and Notes")
OUT = Path(__file__).resolve().parent / "data.js"

SUBJECTS = [
    ("chemistry", "เคมี", "chemistry thai past papers - answers and notes.pdf", "chemistry thai past papers.pdf"),
    ("biology", "ชีววิทยา", "biology thai past papers - answers and notes.pdf", "biology thai past papers.pdf"),
    ("physics", "ฟิสิกส์", "physics thai past papers - answers and notes.pdf", "physics thai past papers.pdf"),
    ("math", "คณิตศาสตร์", "math thai past papers - answers and notes.pdf", "math thai past papers.pdf"),
]

HEAD_RE = re.compile(r"^เฉลยบทที่\s*(\d+)\s*(.*)$")
NUM_RE = re.compile(r"^(\d+)\.(?:\s+|$)(.*)$")
NOTE_RE = re.compile(r"^(\d+)\.\s*(\[.*)$")
NOTES_HEAD = "หมายเหตุประกอบเฉลย"


def is_footer(line: str) -> bool:
    return (
        line.isdigit()
        or "phumfirebase" in line
        or "roonpii" in line
        or line.startswith("www.")
    )


def parse_subject(path: Path):
    chapters = []
    current = None
    mode = None
    current_q = None

    doc = fitz.open(path)
    try:
        for page in doc:
            for raw in page.get_text().splitlines():
                line = raw.strip()
                if not line or is_footer(line):
                    continue

                heading = HEAD_RE.match(line)
                if heading:
                    current = {
                        "id": int(heading.group(1)),
                        "title": heading.group(2).strip(),
                        "answers": {},
                        "notes": {},
                    }
                    chapters.append(current)
                    mode = "answers"
                    current_q = None
                    continue

                if line.startswith(NOTES_HEAD):
                    mode = "notes"
                    current_q = None
                    continue

                if current is None:
                    continue

                if mode == "answers":
                    match = NUM_RE.match(line)
                    if match:
                        current_q = int(match.group(1))
                        current["answers"][str(current_q)] = match.group(2).strip()
                    elif current_q is not None:
                        existing = current["answers"].get(str(current_q), "")
                        current["answers"][str(current_q)] = (existing + " " + line).strip()
                else:
                    match = NOTE_RE.match(line)
                    if match:
                        current_q = int(match.group(1))
                        current["notes"][str(current_q)] = match.group(2).strip()
                    elif current_q is not None:
                        existing = current["notes"].get(str(current_q), "")
                        current["notes"][str(current_q)] = (existing + " " + line).strip()
    finally:
        doc.close()

    return chapters


def main():
    subjects = []
    for subject_id, label, answer_file, paper_file in SUBJECTS:
        chapters = parse_subject(BASE / answer_file)
        subjects.append(
            {
                "id": subject_id,
                "label": label,
                "paper": paper_file,
                "chapters": chapters,
            }
        )
        answers = sum(len(ch["answers"]) for ch in chapters)
        notes = sum(len(ch["notes"]) for ch in chapters)
        print(f"{label}: {len(chapters)} chapters, {answers} answers, {notes} notes")

    payload = {"subjects": subjects}
    OUT.write_text(
        "window.APP_DATA = "
        + json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUT} ({OUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
