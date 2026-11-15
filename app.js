(function () {
  "use strict";

  var data = window.APP_DATA;
  var subjectEl = document.getElementById("subject");
  var chapterEl = document.getElementById("chapter");
  var questionEl = document.getElementById("question");
  var formEl = document.getElementById("search-form");
  var downloadEl = document.getElementById("download");
  var resultEl = document.getElementById("result");
  var contextEl = document.getElementById("result-context");
  var answerEl = document.getElementById("result-answer");
  var noteWrapEl = document.getElementById("result-note-wrap");
  var noteEl = document.getElementById("result-note");
  var emptyEl = document.getElementById("empty");

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
    resultEl.classList.add("hidden");
    emptyEl.classList.add("hidden");
    emptyEl.textContent = "";
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
    questionEl.placeholder = "1 - " + max;
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
      option.textContent = "บทที่ " + chapter.id + " — " + chapter.title;
      chapterEl.appendChild(option);
    });

    updateDownloadLink();
    updateQuestionRange();
  }

  function showEmpty(message) {
    resultEl.classList.add("hidden");
    emptyEl.textContent = message;
    emptyEl.classList.remove("hidden");
  }

  function setAnswerSize(answer) {
    var length = String(answer).length;
    var size = length <= 3 ? "text-4xl" : length <= 14 ? "text-3xl" : "text-2xl";
    answerEl.classList.remove("text-4xl", "text-3xl", "text-2xl");
    answerEl.classList.add(size);
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
      return;
    }

    var question = String(Number(raw));
    var answer = chapter.answers[question];
    var note = chapter.notes[question];

    if (answer === undefined) {
      var numbers = Object.keys(chapter.answers).map(Number);
      var max = numbers.length ? Math.max.apply(null, numbers) : 0;
      showEmpty("ไม่พบเฉลยสำหรับข้อนี้ (บทนี้มีข้อ 1 - " + max + ")");
      return;
    }

    emptyEl.classList.add("hidden");
    emptyEl.textContent = "";
    contextEl.textContent =
      subject.label + " · บทที่ " + chapter.id + " " + chapter.title + " · ข้อ " + question;
    answerEl.textContent = answer;
    setAnswerSize(answer);
    noteEl.textContent = note || "";
    noteWrapEl.classList.toggle("hidden", !note);
    resultEl.classList.remove("hidden");
    resultEl.scrollIntoView({ block: "nearest" });
  }

  subjectEl.addEventListener("change", populateChapters);
  chapterEl.addEventListener("change", updateQuestionRange);
  formEl.addEventListener("submit", search);

  populateSubjects();
  populateChapters();
})();
