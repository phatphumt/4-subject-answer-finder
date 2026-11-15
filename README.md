# Answer Finder

A small offline app for looking up answers from the Thai past-paper answer keys.

Live site: **https://phatphumt.github.io/4-subject-answer-finder/**

## Open

Open the live link, or double-click `index.html` for the offline copy.

No server or internet connection is needed. Tailwind and the Anuphan font are stored locally.

## Use

### Find one answer

1. Choose a subject.
2. Choose a chapter.
3. Enter the question number.
4. Press **ค้นหาเฉลย**.

The answer and any `หมายเหตุ` note appear below. The **เปิดข้อสอบ** link opens the original paper PDF for the selected subject.

### Check a range of answers

1. Open **ตรวจคำตอบ**.
2. Choose a subject and chapter.
3. Set the first and last question numbers.
4. Press **สร้างกระดาษคำตอบ**.
5. Fill in the answers and press **ตรวจคำตอบ**.

Choice questions show 1–5/1–6 buttons. Yes/no questions show a `ใช่ / ไม่ใช่` toggle for each subitem. Numeric and text answers use a text box. The score and per-question results appear after checking, and **แสดงเฉลย** reveals the correct answers for wrong or unanswered items.

## Files

- `index.html` — answer lookup page
- `answer-sheet.html` — answer-sheet page
- `app.js` — lookup logic
- `answer-sheet.js` — range generation and checking logic
- `to-top.js` — floating “ขึ้นบนสุด” scroll-to-top button
- `data.js` — parsed answer keys
- `extract_data.py` — rebuilds `data.js` from the answer-key PDFs
- `vendor/tailwind.js` — local Tailwind runtime
- `fonts/` — local Anuphan font files
- `papers/` — original past-paper PDFs

## Rebuild the data

If the answer-key PDFs change, run:

```powershell
python extract_data.py
```

The script reads the PDFs from `C:\Users\thanu\Documents\Answers and Notes`.
