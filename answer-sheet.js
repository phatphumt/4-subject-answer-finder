(function () {
  "use strict";

  var data = window.APP_DATA;
  var subjectEl = document.getElementById("subject");
  var chapterEl = document.getElementById("chapter");
  var startEl = document.getElementById("start");
  var endEl = document.getElementById("end");
  var rangeHintEl = document.getElementById("range-hint");
  var setupForm = document.getElementById("setup-form");
  var errorEl = document.getElementById("error");
  var sheetIdleEl = document.getElementById("sheet-idle");
  var sheetEl = document.getElementById("sheet");
  var infoEl = document.getElementById("sheet-info");
  var scoreEl = document.getElementById("score");
  var rowsEl = document.getElementById("rows");
  var checkBtn = document.getElementById("check");
  var revealBtn = document.getElementById("reveal");
  var resetBtn = document.getElementById("reset");

  var rows = [];
  var revealed = false;

  function getSubject() {
    return data.subjects.find(function (subject) {
      return subject.id === subjectEl.value;
    });
  }

  function getChapter() {
    var subject = getSubject();
    if (!subject) return null;
    return subject.chapters.find(function (chapter) {
      return String(chapter.id) === chapterEl.value;
    });
  }

  function getMax(chapter) {
    var numbers = Object.keys(chapter.answers).map(Number);
    return numbers.length ? Math.max.apply(null, numbers) : 0;
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function hideError() {
    errorEl.textContent = "";
    errorEl.hidden = true;
  }

  function clearSheet() {
    rows = [];
    rowsEl.innerHTML = "";
    sheetEl.hidden = true;
    sheetIdleEl.hidden = false;
    scoreEl.hidden = true;
    scoreEl.textContent = "";
    revealBtn.hidden = true;
    revealed = false;
    revealBtn.textContent = "แสดงเฉลย";
  }

  function populateSubjects() {
    subjectEl.innerHTML = "";
    data.subjects.forEach(function (subject) {
      var option = document.createElement("option");
      option.value = subject.id;
      option.textContent = subject.label;
      subjectEl.appendChild(option);
    });
  }

  function populateChapters() {
    var subject = getSubject();
    chapterEl.innerHTML = "";
    clearSheet();
    hideError();

    if (!subject) return;

    subject.chapters.forEach(function (chapter) {
      var option = document.createElement("option");
      option.value = String(chapter.id);
      option.textContent = "บทที่ " + chapter.id + " · " + chapter.title;
      chapterEl.appendChild(option);
    });

    updateRangeDefaults();
  }

  function updateRangeDefaults() {
    var chapter = getChapter();
    if (!chapter) return;
    var max = getMax(chapter);
    startEl.value = "1";
    startEl.max = String(max);
    endEl.value = String(Math.min(20, max));
    endEl.max = String(max);
    rangeHintEl.textContent = "บทนี้มีข้อ 1 – " + max;
  }

  function detectChoice(answer) {
    var matches = answer.match(/\((\d)\)/g);
    if (!matches) return null;

    var rest = answer
      .replace(/\((\d)\)/g, "")
      .replace(/หรือ|และ|,|\s|\/|†/g, "");

    if (rest !== "") return null;

    var numbers = matches.map(function (token) {
      return Number(token.replace(/[()]/g, ""));
    });

    return {
      numbers: numbers,
      max: Math.max.apply(null, numbers)
    };
  }

  function detectYesNo(answer) {
    var text = String(answer).replace(/†/g, " ").trim();

    // Labeled items: "53.1 ใช่ 53.2 ไม่ใช่ 53.3 ใช่"
    var pattern = /(\d+(?:\.\d+)?)\s*(ไม่ใช่|ใช่)/g;
    var items = [];
    var restParts = [];
    var lastIndex = 0;
    var match;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        restParts.push(text.slice(lastIndex, match.index));
      }
      items.push({
        label: match[1],
        value: match[2] === "ใช่" ? "yes" : "no"
      });
      lastIndex = pattern.lastIndex;
    }

    if (items.length) {
      restParts.push(text.slice(lastIndex));
      var rest = restParts
        .join("")
        .replace(/และ|หรือ/g, "")
        .replace(/[\s,\/†]/g, "");
      if (rest === "") return { items: items };
    }

    // Unlabeled comma list: "ไม่ใช่, ใช่, ใช่"
    var parts = text
      .split(/[,]/)
      .map(function (part) { return part.trim(); })
      .filter(Boolean);

    if (
      parts.length &&
      parts.every(function (part) {
        return part === "ใช่" || part === "ไม่ใช่";
      })
    ) {
      return {
        items: parts.map(function (part, index) {
          return {
            label: String(index + 1),
            value: part === "ใช่" ? "yes" : "no"
          };
        })
      };
    }

    return null;
  }

  function chapterChoiceMax(chapter) {
    var max = 5;
    Object.keys(chapter.answers).forEach(function (key) {
      var detected = detectChoice(chapter.answers[key]);
      if (detected && detected.max > max) max = detected.max;
    });
    return max;
  }

  function normalizeText(value) {
    return value
      .toLowerCase()
      .replace(/[\s,()†]/g, "");
  }

  function setStatus(status, text, tone) {
    status.textContent = text;
    status.dataset.tone = tone;
    status.hidden = false;
  }

  function setRowState(row, state) {
    row.dataset.state = state;
  }

  function clearSelection(container, selector) {
    container.querySelectorAll(selector).forEach(function (other) {
      other.dataset.selected = "false";
      if (other.hasAttribute("aria-pressed")) {
        other.setAttribute("aria-pressed", "false");
      }
    });
  }

  function makeChoiceButton(row, value) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.dataset.selected = "false";
    button.textContent = String(value);
    button.setAttribute("aria-label", "ตัวเลือก " + value);
    button.addEventListener("click", function () {
      clearSelection(row, ".chip");
      button.dataset.selected = "true";
      row.dataset.userAnswer = String(value);
    });
    return button;
  }

  function makeYesNoButton(row, item, value, caption) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "yn-opt";
    button.dataset.selected = "false";
    button.dataset.value = value;
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", item.label + " " + caption);
    button.title = caption;

    var icon = document.createElement("span");
    icon.className = "yn-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML =
      value === "yes"
        ? '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"' +
          ' stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"></path></svg>'
        : '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"' +
          ' stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"></path></svg>';

    button.appendChild(icon);

    button.addEventListener("click", function () {
      clearSelection(button.parentElement, ".yn-opt");
      button.dataset.selected = "true";
      button.setAttribute("aria-pressed", "true");
      row._yesno[item.label] = value;
    });
    return button;
  }

  function makeYesNoGroup(row, items) {
    var wrap = document.createElement("div");
    wrap.className = "qcard-list";

    items.forEach(function (item) {
      var line = document.createElement("div");
      line.className = "yn-item";

      var label = document.createElement("span");
      label.className = "yn-label";
      label.textContent = item.label;

      var group = document.createElement("div");
      group.className = "yn-options";
      group.appendChild(makeYesNoButton(row, item, "yes", "ใช่"));
      group.appendChild(makeYesNoButton(row, item, "no", "ไม่ใช่"));

      line.appendChild(label);
      line.appendChild(group);
      wrap.appendChild(line);
    });

    return wrap;
  }

  function createRow(question, answer, note, choiceMax) {
    var row = document.createElement("div");
    row.className = "qcard";
    row.dataset.question = String(question);
    row.dataset.answer = answer;
    row.dataset.note = note;
    row.dataset.userAnswer = "";
    row.dataset.state = "empty";

    var head = document.createElement("div");
    head.className = "flex items-center justify-between gap-2";

    var label = document.createElement("span");
    label.className = "text-sm font-medium";
    label.textContent = "ข้อ " + question;

    var status = document.createElement("span");
    status.className = "status";
    status.hidden = true;

    head.appendChild(label);
    head.appendChild(status);
    row.appendChild(head);

    var yesno = detectYesNo(answer);
    var detected = detectChoice(answer);
    var body = document.createElement("div");
    body.className = "qcard-body";

    if (yesno) {
      row.dataset.type = "yesno";
      row._yesnoKey = yesno.items;
      row._yesno = {};
      body.appendChild(makeYesNoGroup(row, yesno.items));
      row.appendChild(body);
    } else if (detected) {
      row.dataset.type = "choice";
      row.dataset.choices = detected.numbers.join(",");
      var wrap = document.createElement("div");
      wrap.className = "flex flex-wrap gap-2";
      for (var i = 1; i <= choiceMax; i += 1) {
        wrap.appendChild(makeChoiceButton(row, i));
      }
      body.appendChild(wrap);
      row.appendChild(body);
    } else {
      row.dataset.type = "text";
      var input = document.createElement("input");
      input.type = "text";
      input.className = "field field-sm";
      input.placeholder = "พิมพ์คำตอบ";
      input.setAttribute("aria-label", "คำตอบข้อ " + question);
      input.addEventListener("input", function () {
        row.dataset.userAnswer = input.value;
      });
      input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          checkAnswers();
        }
      });
      body.appendChild(input);
      row.appendChild(body);
    }

    var correct = document.createElement("div");
    correct.className = "correct answer-key";
    correct.hidden = true;
    correct.textContent =
      "เฉลย: " + answer + (note ? "\nหมายเหตุ: " + note : "");
    row.appendChild(correct);

    return row;
  }

  function buildSheet(event) {
    event.preventDefault();
    hideError();

    var subject = getSubject();
    var chapter = getChapter();

    if (!subject || !chapter) {
      showError("กรุณาเลือกวิชาและบทที่");
      return;
    }

    var max = getMax(chapter);
    var start = Number(startEl.value);
    var end = Number(endEl.value);

    if (!Number.isInteger(start) || !Number.isInteger(end)) {
      showError("กรุณากรอกเลขข้อเป็นจำนวนเต็ม");
      return;
    }

    if (start < 1 || end < 1 || start > end || end > max) {
      showError("ช่วงข้อไม่ถูกต้อง (บทนี้มีข้อ 1 – " + max + ")");
      return;
    }

    rows = [];
    rowsEl.innerHTML = "";
    var choiceMax = chapterChoiceMax(chapter);

    for (var question = start; question <= end; question += 1) {
      var answer = chapter.answers[String(question)];
      if (answer === undefined) continue;
      var note = chapter.notes[String(question)] || "";
      var row = createRow(question, answer, note, choiceMax);
      rows.push(row);
      rowsEl.appendChild(row);
    }

    if (!rows.length) {
      showError("ไม่พบข้อในช่วงที่เลือก");
      return;
    }

    infoEl.textContent =
      subject.label +
      " · บทที่ " + chapter.id + " " + chapter.title +
      " · ข้อ " + start + "–" + end;
    scoreEl.hidden = true;
    scoreEl.textContent = "";
    revealBtn.hidden = true;
    revealed = false;
    revealBtn.textContent = "แสดงเฉลย";
    sheetIdleEl.hidden = true;
    sheetEl.hidden = false;

    if (window.innerWidth < 1024) {
      sheetEl.scrollIntoView({ block: "start" });
    }
  }

  function isCorrect(row, value) {
    if (row.dataset.type === "choice") {
      var number = Number(String(value).replace(/[()\s]/g, ""));
      return row.dataset.choices.split(",").indexOf(String(number)) !== -1;
    }
    return normalizeText(value) === normalizeText(row.dataset.answer);
  }

  function checkAnswers() {
    var correctCount = 0;
    var answered = 0;

    rows.forEach(function (row) {
      var value = (row.dataset.userAnswer || "").trim();
      var status = row.querySelector(".status");
      var correctEl = row.querySelector(".correct");

      if (row.dataset.type === "yesno") {
        var key = row._yesnoKey || [];
        var user = row._yesno || {};
        var answeredCount = key.filter(function (item) {
          return user[item.label] !== undefined;
        }).length;

        if (answeredCount === 0) {
          setStatus(status, "ยังไม่ได้ตอบ", "empty");
          setRowState(row, "empty");
          correctEl.hidden = !revealed;
          return;
        }

        answered += 1;

        var allCorrect =
          answeredCount === key.length &&
          key.every(function (item) {
            return user[item.label] === item.value;
          });

        if (allCorrect) {
          correctCount += 1;
          setStatus(status, "ถูก", "correct");
          setRowState(row, "correct");
          correctEl.hidden = true;
        } else {
          var partial = answeredCount < key.length;
          setStatus(status, partial ? "ตอบไม่ครบ" : "ผิด", partial ? "empty" : "wrong");
          setRowState(row, partial ? "empty" : "wrong");
          correctEl.hidden = !revealed;
        }
        return;
      }

      if (!value) {
        setStatus(status, "ยังไม่ได้ตอบ", "empty");
        setRowState(row, "empty");
        correctEl.hidden = !revealed;
        return;
      }

      answered += 1;

      if (isCorrect(row, value)) {
        correctCount += 1;
        setStatus(status, "ถูก", "correct");
        setRowState(row, "correct");
        correctEl.hidden = true;
      } else {
        setStatus(status, "ผิด", "wrong");
        setRowState(row, "wrong");
        correctEl.hidden = !revealed;
      }
    });

    scoreEl.textContent =
      "ถูก " + correctCount + " / " + rows.length +
      (answered < rows.length ? " · ตอบแล้ว " + answered : "");
    scoreEl.hidden = false;
    revealBtn.hidden = false;
  }

  function toggleReveal() {
    revealed = !revealed;
    revealBtn.textContent = revealed ? "ซ่อนเฉลย" : "แสดงเฉลย";

    rows.forEach(function (row) {
      if (row.dataset.state === "correct") return;
      row.querySelector(".correct").hidden = !revealed;
    });
  }

  function resetAnswers() {
    rows.forEach(function (row) {
      clearSelection(row, ".chip, .yn-opt");
      row.querySelectorAll("input.field").forEach(function (input) {
        input.value = "";
      });
      row.dataset.userAnswer = "";
      row.dataset.state = "empty";
      row._yesno = {};
      row.querySelector(".status").hidden = true;
      row.querySelector(".correct").hidden = true;
    });

    scoreEl.textContent = "";
    scoreEl.hidden = true;
    revealBtn.hidden = true;
    revealed = false;
    revealBtn.textContent = "แสดงเฉลย";
  }

  subjectEl.addEventListener("change", populateChapters);
  chapterEl.addEventListener("change", function () {
    clearSheet();
    hideError();
    updateRangeDefaults();
  });
  setupForm.addEventListener("submit", buildSheet);
  checkBtn.addEventListener("click", checkAnswers);
  revealBtn.addEventListener("click", toggleReveal);
  resetBtn.addEventListener("click", resetAnswers);

  populateSubjects();
  populateChapters();
})();
