(function () {
  "use strict";

  var data = window.APP_DATA;
  var subjectEl = document.getElementById("subject");
  var chapterEl = document.getElementById("chapter");
  var startEl = document.getElementById("start");
  var endEl = document.getElementById("end");
  var setupForm = document.getElementById("setup-form");
  var errorEl = document.getElementById("error");
  var sheetEl = document.getElementById("sheet");
  var infoEl = document.getElementById("sheet-info");
  var scoreEl = document.getElementById("score");
  var rowsEl = document.getElementById("rows");
  var checkBtn = document.getElementById("check");
  var revealBtn = document.getElementById("reveal");

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
    errorEl.classList.remove("hidden");
  }

  function hideError() {
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
  }

  function clearSheet() {
    rows = [];
    rowsEl.innerHTML = "";
    sheetEl.classList.add("hidden");
    scoreEl.classList.add("hidden");
    scoreEl.textContent = "";
    revealBtn.classList.add("hidden");
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
      option.textContent = "บทที่ " + chapter.id + " — " + chapter.title;
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

  var STATUS_CLASS =
    "status shrink-0 rounded-full px-2.5 py-1 text-xs font-medium";

  function setStatus(status, text, tone) {
    var toneClass =
      tone === "correct"
        ? "bg-green-100 text-green-700"
        : tone === "wrong"
          ? "bg-red-100 text-red-700"
          : "bg-gray-100 text-gray-600";
    status.textContent = text;
    status.className = STATUS_CLASS + " " + toneClass;
    status.classList.remove("hidden");
  }

  function setRowState(row, state) {
    row.classList.remove("border-gray-300", "border-green-500", "border-red-500");
    row.classList.add(
      state === "correct"
        ? "border-green-500"
        : state === "wrong"
          ? "border-red-500"
          : "border-gray-300"
    );
    row.dataset.state = state;
  }

  function makeChoiceButton(row, value) {
    var button = document.createElement("button");
    button.type = "button";
    button.className =
      "choice h-11 w-11 rounded-lg border border-gray-300 bg-white text-base font-medium transition-colors hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200";
    button.textContent = String(value);
    button.addEventListener("click", function () {
      row.querySelectorAll(".choice").forEach(function (other) {
        other.classList.remove("bg-blue-700", "text-white", "border-blue-700");
        other.classList.add("bg-white");
      });
      button.classList.remove("bg-white");
      button.classList.add("bg-blue-700", "text-white", "border-blue-700");
      row.dataset.userAnswer = String(value);
    });
    return button;
  }

  function makeYesNoButton(row, item, value, text) {
    var button = document.createElement("button");
    button.type = "button";
    button.className =
      "yesno-choice min-w-[4rem] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium transition-colors hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200";
    button.textContent = text;
    button.dataset.value = value;
    button.addEventListener("click", function () {
      button.parentElement.querySelectorAll(".yesno-choice").forEach(function (other) {
        other.classList.remove("bg-blue-700", "text-white", "border-blue-700");
        other.classList.add("bg-white");
      });
      button.classList.remove("bg-white");
      button.classList.add("bg-blue-700", "text-white", "border-blue-700");
      row._yesno[item.label] = value;
    });
    return button;
  }

  function makeYesNoGroup(row, items) {
    var wrap = document.createElement("div");
    wrap.className = "space-y-3";

    items.forEach(function (item) {
      var line = document.createElement("div");
      line.className = "flex items-center justify-between gap-3";

      var label = document.createElement("span");
      label.className = "min-w-[4.5rem] text-sm text-gray-700";
      label.textContent = item.label;

      var group = document.createElement("div");
      group.className = "flex gap-2";
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
    row.className = "rounded-lg border border-gray-300 p-4";
    row.dataset.question = String(question);
    row.dataset.answer = answer;
    row.dataset.note = note;
    row.dataset.userAnswer = "";
    row.dataset.state = "empty";

    var head = document.createElement("div");
    head.className = "mb-3 flex items-center justify-between gap-2";

    var label = document.createElement("span");
    label.className = "font-medium";
    label.textContent = "ข้อ " + question;

    var status = document.createElement("span");
    status.className = STATUS_CLASS + " hidden";

    head.appendChild(label);
    head.appendChild(status);
    row.appendChild(head);

    var yesno = detectYesNo(answer);
    var detected = detectChoice(answer);

    if (yesno) {
      row.dataset.type = "yesno";
      row._yesnoKey = yesno.items;
      row._yesno = {};
      row.appendChild(makeYesNoGroup(row, yesno.items));
    } else if (detected) {
      row.dataset.type = "choice";
      row.dataset.choices = detected.numbers.join(",");
      var wrap = document.createElement("div");
      wrap.className = "flex flex-wrap gap-2.5";
      for (var i = 1; i <= choiceMax; i += 1) {
        wrap.appendChild(makeChoiceButton(row, i));
      }
      row.appendChild(wrap);
    } else {
      row.dataset.type = "text";
      var input = document.createElement("input");
      input.type = "text";
      input.className =
        "w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200";
      input.placeholder = "พิมพ์คำตอบ";
      input.addEventListener("input", function () {
        row.dataset.userAnswer = input.value;
      });
      row.appendChild(input);
    }

    var correct = document.createElement("div");
    correct.className =
      "correct mt-3 hidden whitespace-pre-wrap border-t border-gray-200 pt-3 text-sm leading-relaxed text-gray-600";
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
      showError("ช่วงข้อไม่ถูกต้อง (บทนี้มีข้อ 1 - " + max + ")");
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
      " · ข้อ " + start + "-" + end;
    scoreEl.classList.add("hidden");
    scoreEl.textContent = "";
    revealBtn.classList.add("hidden");
    revealed = false;
    revealBtn.textContent = "แสดงเฉลย";
    sheetEl.classList.remove("hidden");
    sheetEl.scrollIntoView({ block: "start" });
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
          correctEl.classList.toggle("hidden", !revealed);
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
          correctEl.classList.add("hidden");
        } else {
          var partial = answeredCount < key.length;
          setStatus(status, partial ? "ตอบไม่ครบ" : "ผิด", partial ? "empty" : "wrong");
          setRowState(row, partial ? "empty" : "wrong");
          correctEl.classList.toggle("hidden", !revealed);
        }
        return;
      }

      if (!value) {
        setStatus(status, "ยังไม่ได้ตอบ", "empty");
        setRowState(row, "empty");
        correctEl.classList.toggle("hidden", !revealed);
        return;
      }

      answered += 1;

      if (isCorrect(row, value)) {
        correctCount += 1;
        setStatus(status, "ถูก", "correct");
        setRowState(row, "correct");
        correctEl.classList.add("hidden");
      } else {
        setStatus(status, "ผิด", "wrong");
        setRowState(row, "wrong");
        correctEl.classList.toggle("hidden", !revealed);
      }
    });

    scoreEl.textContent =
      "ถูก " + correctCount + " / " + rows.length +
      (answered < rows.length ? " · ตอบแล้ว " + answered : "");
    scoreEl.classList.remove("hidden");
    revealBtn.classList.remove("hidden");
  }

  function toggleReveal() {
    revealed = !revealed;
    revealBtn.textContent = revealed ? "ซ่อนเฉลย" : "แสดงเฉลย";

    rows.forEach(function (row) {
      if (row.dataset.state === "correct") return;
      row.querySelector(".correct").classList.toggle("hidden", !revealed);
    });
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

  populateSubjects();
  populateChapters();
})();
