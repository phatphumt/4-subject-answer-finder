# Answer Finder

A small offline app for looking up answers from the Thai past-paper answer keys.

Live site: **https://phatphumt.github.io/4-subject-answer-finder/**

## Open

Open the live link, or double-click `index.html` for the offline copy.

No server or internet connection is needed. Tailwind and the Anuphan font are stored locally.

## Use

The layout is a single column on phones and a two-column workspace from 1024 px up: controls stay pinned on the left while answers or the answer sheet fill the right side.

### Find one answer

1. Choose a subject.
2. Choose a chapter.
3. Enter the question number.
4. Press **ค้นหาเฉลย**.

The answer and any `หมายเหตุ` note appear in the answer panel. The **เปิดข้อสอบต้นฉบับ (PDF)** button opens the original paper PDF for the selected subject. On desktop you can press `/` to jump to the question box, `Esc` to clear it, and **คัดลอกเฉลย** to copy the answer.

### Check a range of answers

1. Open **ตรวจคำตอบ**.
2. Choose a subject and chapter.
3. Set the first and last question numbers.
4. Press **สร้างกระดาษคำตอบ**.
5. Fill in the answers and press **ตรวจคำตอบ**.

Choice questions show 1–5/1–6 buttons. Yes/no questions show a `ใช่ / ไม่ใช่` toggle for each subitem. Numeric and text answers use a text box. The score bar sticks to the top while you scroll, **ตรวจคำตอบ** grades the sheet, **แสดงเฉลย** reveals the correct answers for wrong or unanswered items, and **ล้าง** clears every answer.

## Install as an app

The site is installable. In Chrome or Edge use **Install** in the address bar (or the install icon), on iOS use **Add to Home Screen**, on Android the browser offers **Install app**. Once installed it opens standalone, and the service worker keeps the app, styles, fonts, and answer data cached so it works offline. Past-paper PDFs are always fetched from the network.

## Files

- `index.html`: answer lookup page
- `answer-sheet.html`: answer-sheet page
- `styles.css`: shared design tokens, fonts, and UI components
- `app.js`: lookup logic
- `answer-sheet.js`: range generation and checking logic
- `to-top.js`: floating scroll-to-top button
- `pwa.js`: service worker registration
- `sw.js`: offline cache for the app shell
- `manifest.webmanifest`: install metadata, icons, shortcuts
- `icons/`: app icons (192, 512, maskable, apple-touch)
- `data.js`: parsed answer keys
- `extract_data.py`: rebuilds `data.js` from the answer-key PDFs
- `vendor/tailwind.js`: local Tailwind runtime
- `fonts/`: local Anuphan font files
- `papers/`: original past-paper PDFs

## Rebuild the data

If the answer-key PDFs change, run:

```powershell
python extract_data.py
```

The script reads the PDFs from `C:\Users\thanu\Documents\Answers and Notes`.
