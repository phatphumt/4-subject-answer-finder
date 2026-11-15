(function () {
  "use strict";

  var data = window.APP_DATA;
  var subjectEl = document.getElementById("subject");
  var chapterEl = document.getElementById("chapter");
  var questionEl = document.getElementById("question");
  var questionHintEl = document.getElementById("question-hint");
  var formEl = document.getElementById("search-form");
  var downloadEl = document.getElementById("download");
  var stageIdleEl = document.getElementById("stage-idle");
  var resultEl = document.getElementById("result");
  var qnoEl = document.getElementById("result-qno");
  var contextEl = document.getElementById("result-context");
  var answerEl = document.getElementById("result-answer");
  var noteWrapEl = document.getElementById("result-note-wrap");
  var noteEl = document.getElementById("result-note");
  var emptyEl = document.getElementById("empty");
  var emptyTextEl = document.getElementById("empty-text");
  var copyBtn = document.getElementById("copy");
  var copyLabelEl = document.getElementById("copy-label");

  var copyTimer = null;

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

  function clearOutput() {
    resultEl.hidden = true;
    emptyEl.hidden = true;
    emptyTextEl.textContent = "";
    stageIdleEl.hidden = false;
    resetCopyLabel();
  }

  function updateDownloadLink() {
    var subject = getSubject();
    if (!subject) return;
    downloadEl.href = "papers/" + encodeURIComponent(subject.paper);
    downloadEl.removeAttribute("download");
  }

  function updateQuestionRange() {
    var chapter = getChapter();
    if (!chapter) return;
    var numbers = Object.keys(chapter.answers).map(Number);
    var max = numbers.length ? Math.max.apply(null, numbers) : 1;
    questionEl.max = String(max);
    questionEl.placeholder = "1 – " + max;
    questionHintEl.textContent = "บทนี้มีข้อ 1 – " + max;
    questionEl.value = "";
    clearOutput();
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

    if (!subject) return;

    subject.chapters.forEach(function (chapter) {
      var option = document.createElement("option");
      option.value = String(chapter.id);
      option.textContent = "บทที่ " + chapter.id + " · " + chapter.title;
      chapterEl.appendChild(option);
    });

    updateDownloadLink();
    updateQuestionRange();
  }

  function showEmpty(message) {
    resultEl.hidden = true;
    stageIdleEl.hidden = true;
    emptyTextEl.textContent = message;
    emptyEl.hidden = false;
    resetCopyLabel();
  }

  function setAnswerSize(answer) {
    var length = String(answer).length;
    if (length <= 3) {
      delete answerEl.dataset.size;
    } else {
      answerEl.dataset.size = length <= 14 ? "m" : "s";
    }
  }

  function resetCopyLabel() {
    if (copyTimer) {
      window.clearTimeout(copyTimer);
      copyTimer = null;
    }
    copyLabelEl.textContent = "คัดลอกเฉลย";
  }

  function copyAnswer() {
    var text = answerEl.textContent || "";
    if (!text) return;

    function done() {
      copyLabelEl.textContent = "คัดลอกแล้ว";
      if (copyTimer) window.clearTimeout(copyTimer);
      copyTimer = window.setTimeout(resetCopyLabel, 1800);
    }

    function fallback() {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
        done();
      } catch (error) {
        copyLabelEl.textContent = "คัดลอกไม่สำเร็จ";
        if (copyTimer) window.clearTimeout(copyTimer);
        copyTimer = window.setTimeout(resetCopyLabel, 1800);
      }
      document.body.removeChild(area);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
  }

  function search(event) {
    event.preventDefault();

    var subject = getSubject();
    var chapter = getChapter();
    var raw = questionEl.value.trim();

    if (!subject || !chapter) {
      showEmpty("กรุณาเลือกวิชาและบทที่");
      return;
    }

    if (!raw) {
      showEmpty("กรุณากรอกข้อที่");
      questionEl.focus();
      return;
    }

    var question = String(Number(raw));
    var answer = chapter.answers[question];
    var note = chapter.notes[question];

    if (answer === undefined) {
      var numbers = Object.keys(chapter.answers).map(Number);
      var max = numbers.length ? Math.max.apply(null, numbers) : 0;
      showEmpty("ไม่พบเฉลยสำหรับข้อนี้ (บทนี้มีข้อ 1 – " + max + ")");
      return;
    }

    stageIdleEl.hidden = true;
    emptyEl.hidden = true;
    emptyTextEl.textContent = "";

    qnoEl.textContent = "ข้อ " + question;
    contextEl.textContent =
      subject.label + " · บทที่ " + chapter.id + " " + chapter.title;
    answerEl.textContent = answer;
    setAnswerSize(answer);
    noteEl.textContent = note || "";
    noteWrapEl.hidden = !note;

    resultEl.hidden = false;
    resetCopyLabel();

    // restart the entrance animation on every search
    resultEl.classList.remove("animate-rise");
    void resultEl.offsetWidth;
    resultEl.classList.add("animate-rise");

    if (window.innerWidth < 1024) {
      resultEl.scrollIntoView({ block: "nearest" });
    }
  }

  function isTypingTarget(target) {
    if (!target) return false;
    var tag = target.tagName;
    return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || target.isContentEditable;
  }

  subjectEl.addEventListener("change", populateChapters);
  chapterEl.addEventListener("change", updateQuestionRange);
  formEl.addEventListener("submit", search);
  copyBtn.addEventListener("click", copyAnswer);

  document.addEventListener("keydown", function (event) {
    var active = document.activeElement;
    if (event.key === "/" && !isTypingTarget(active)) {
      event.preventDefault();
      questionEl.focus();
      questionEl.select();
      return;
    }

    if (event.key === "Escape" && isTypingTarget(active)) {
      questionEl.value = "";
      clearOutput();
      active.blur();
    }
  });

  populateSubjects();
  populateChapters();
})();
