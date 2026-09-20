/**
 * app.js
 * ------
 * Wires up the UI. Everything DOM-related lives here; the other files
 * (storage, api, topics, analysis, timer) know nothing about the page.
 */

(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const els = {
    tabs: $$(".tab"),
    panels: $$(".panel"),
    streakBadge: $("#streakBadge"),

    // write
    topicModeLabel: $("#topicModeLabel"),
    topicText: $("#topicText"),
    challengeNote: $("#challengeNote"),
    newTopicBtn: $("#newTopicBtn"),
    timerDisplay: $("#timerDisplay"),
    startPauseBtn: $("#startPauseBtn"),
    resetBtn: $("#resetBtn"),
    wordCount: $("#wordCount"),
    writeArea: $("#writeArea"),
    saveEntryBtn: $("#saveEntryBtn"),
    saveHint: $("#saveHint"),

    // archive
    entryList: $("#entryList"),
    archiveSummary: $("#archiveSummary"),

    // lab
    runAnalysisBtn: $("#runAnalysisBtn"),
    labHint: $("#labHint"),
    localStats: $("#localStats"),
    analysisDashboard: $("#analysisDashboard"),
    analysisHistory: $("#analysisHistory"),

    // settings
    apiKeyInput: $("#apiKeyInput"),
    modelSelect: $("#modelSelect"),
    minutesInput: $("#minutesInput"),
    analysisFreqInput: $("#analysisFreqInput"),
    saveSettingsBtn: $("#saveSettingsBtn"),
    settingsSaveHint: $("#settingsSaveHint"),
    exportBtn: $("#exportBtn"),
    importInput: $("#importInput"),
    clearBtn: $("#clearBtn"),

    toast: $("#toast"),
  };

  const MIN_WORDS_TO_SAVE = 15;
  const TODAY_TOPIC_KEY = "freewrite.todayTopic";

  let timer = null;
  let currentTopic = null;

  // ---------------- toast ----------------
  let toastTimer = null;
  function showToast(message, { duration = 2600 } = {}) {
    els.toast.textContent = message;
    els.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      els.toast.hidden = true;
    }, duration);
  }

  // ---------------- tabs ----------------
  function activateTab(name) {
    els.tabs.forEach((t) => {
      const active = t.dataset.tab === name;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", String(active));
    });
    els.panels.forEach((p) => {
      p.classList.toggle("is-active", p.id === `panel-${name}`);
    });
    if (name === "archive") renderArchive();
    if (name === "lab") renderVoiceLab();
    if (name === "settings") loadSettingsIntoForm();
  }
  els.tabs.forEach((t) => t.addEventListener("click", () => activateTab(t.dataset.tab)));

  // ---------------- streak ----------------
  function computeStreak() {
    const dates = new Set(Storage.getEntries().map((e) => e.date));
    if (!dates.size) return 0;
    let streak = 0;
    const cursor = new Date();
    // If nothing written yet today, still count a streak ending yesterday.
    if (!dates.has(cursor.toISOString().slice(0, 10))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (dates.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }
  function renderStreak() {
    const streak = computeStreak();
    if (streak > 0) {
      els.streakBadge.textContent = `${streak} day${streak === 1 ? "" : "s"} running`;
      els.streakBadge.classList.add("has-streak");
    } else {
      els.streakBadge.textContent = "";
      els.streakBadge.classList.remove("has-streak");
    }
  }

  // ---------------- write: topic ----------------
  function cacheTodayTopic(topic) {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(TODAY_TOPIC_KEY, JSON.stringify({ date: today, ...topic }));
  }
  function getCachedTodayTopic() {
    try {
      const cached = JSON.parse(localStorage.getItem(TODAY_TOPIC_KEY));
      const today = new Date().toISOString().slice(0, 10);
      if (cached && cached.date === today) return cached;
    } catch {
      /* ignore */
    }
    return null;
  }

  function renderTopic(topic) {
    currentTopic = topic;
    els.topicModeLabel.textContent = Topics.MODE_LABELS[topic.mode] || "Today's topic";
    els.topicText.textContent = topic.text;
    if (topic.challengeNote) {
      els.challengeNote.textContent = topic.challengeNote;
      els.challengeNote.hidden = false;
    } else {
      els.challengeNote.hidden = true;
    }
  }

  async function loadTopic({ force = false } = {}) {
    const cached = !force ? getCachedTodayTopic() : null;
    if (cached) {
      renderTopic(cached);
      return;
    }
    els.topicText.textContent = "Thinking of one…";
    els.topicModeLabel.textContent = "…";
    els.challengeNote.hidden = true;
    els.newTopicBtn.disabled = true;
    try {
      const topic = await Topics.generateTopic();
      cacheTodayTopic(topic);
      renderTopic(topic);
    } finally {
      els.newTopicBtn.disabled = false;
    }
  }

  els.newTopicBtn.addEventListener("click", () => {
    if (els.writeArea.value.trim().length > 0) {
      const ok = confirm("Get a new topic? What you've written so far will stay in the box, but it won't match the new prompt.");
      if (!ok) return;
    }
    loadTopic({ force: true });
  });

  // ---------------- write: timer ----------------
  function setupTimer() {
    const minutes = Storage.getSettings().writeMinutes;
    timer = new WriteTimer(minutes * 60, {
      onTick: (elapsed, remaining) => {
        els.timerDisplay.textContent = WriteTimer.formatMMSS(remaining);
        els.timerDisplay.classList.toggle("is-overtime", remaining < 0);
      },
      onComplete: () => {
        showToast("Time's up — keep going if you're mid-thought, or wrap it up.");
      },
    });
    els.timerDisplay.textContent = WriteTimer.formatMMSS(timer.totalSeconds);
  }

  els.startPauseBtn.addEventListener("click", () => {
    if (timer.running) {
      timer.pause();
      els.startPauseBtn.textContent = "Resume";
    } else {
      timer.start();
      els.startPauseBtn.textContent = "Pause";
    }
  });

  els.resetBtn.addEventListener("click", () => {
    if (els.writeArea.value.trim().length && !confirm("Reset the timer and clear what you've written?")) return;
    timer.reset();
    els.timerDisplay.textContent = WriteTimer.formatMMSS(timer.totalSeconds);
    els.timerDisplay.classList.remove("is-overtime");
    els.startPauseBtn.textContent = "Start";
    els.writeArea.value = "";
    updateWordCount();
  });

  // ---------------- write: textarea ----------------
  function countWords(text) {
    const trimmed = text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }
  function updateWordCount() {
    const n = countWords(els.writeArea.value);
    els.wordCount.textContent = `${n} word${n === 1 ? "" : "s"}`;
    els.saveEntryBtn.disabled = n < MIN_WORDS_TO_SAVE;
    els.saveHint.textContent =
      n > 0 && n < MIN_WORDS_TO_SAVE ? `${MIN_WORDS_TO_SAVE - n} more words to save` : "";
  }
  els.writeArea.addEventListener("input", updateWordCount);
  els.writeArea.addEventListener("paste", (e) => {
    e.preventDefault();
    showToast("Pasting is off in here — that's the whole point.");
  });

  // ---------------- write: save ----------------
  els.saveEntryBtn.addEventListener("click", () => {
    const text = els.writeArea.value.trim();
    if (countWords(text) < MIN_WORDS_TO_SAVE || !currentTopic) return;

    const now = new Date();
    const entry = {
      id: uid(),
      date: now.toISOString().slice(0, 10),
      createdAt: now.toISOString(),
      topic: currentTopic.text,
      topicMode: currentTopic.mode,
      text,
      wordCount: countWords(text),
      elapsedSeconds: timer ? timer.elapsed : 0,
    };
    Storage.saveEntry(entry);

    els.writeArea.value = "";
    updateWordCount();
    timer.reset();
    els.timerDisplay.textContent = WriteTimer.formatMMSS(timer.totalSeconds);
    els.timerDisplay.classList.remove("is-overtime");
    els.startPauseBtn.textContent = "Start";
    els.saveHint.textContent = "Saved.";
    els.saveHint.classList.add("is-good");
    setTimeout(() => els.saveHint.classList.remove("is-good"), 2000);
    renderStreak();

    const settings = Storage.getSettings();
    const total = Storage.getEntries().length;
    if (settings.apiKey && total % settings.analysisEveryNEntries === 0) {
      showToast(`${total} entries in — worth a trip to Voice Lab.`, { duration: 4000 });
    } else {
      showToast("Entry saved.");
    }
  });

  // ---------------- archive ----------------
  function renderArchive() {
    const entries = [...Storage.getEntries()].reverse();
    if (!entries.length) {
      els.archiveSummary.textContent = "";
      els.entryList.innerHTML = `<div class="empty-state">Nothing yet — your first entry will show up here.</div>`;
      return;
    }
    const totalWords = entries.reduce((sum, e) => sum + e.wordCount, 0);
    els.archiveSummary.textContent = `${entries.length} entr${entries.length === 1 ? "y" : "ies"} · ${totalWords.toLocaleString()} words total`;

    els.entryList.innerHTML = entries
      .map(
        (e) => `
      <details class="entry-card" data-id="${e.id}">
        <summary>
          <span class="entry-date">${formatDate(e.date)}</span>
          <span class="entry-topic">${escapeHtml(e.topic)}</span>
          <span class="entry-words">${e.wordCount}w</span>
        </summary>
        <div class="entry-body">${escapeHtml(e.text)}</div>
        <div class="entry-actions">
          <button class="ghost-btn small delete-entry-btn" data-id="${e.id}" type="button">Delete</button>
        </div>
      </details>
    `
      )
      .join("");

    $$(".delete-entry-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("Delete this entry for good?")) {
          Storage.deleteEntry(btn.dataset.id);
          renderArchive();
          renderStreak();
        }
      })
    );
  }

  function formatDate(iso) {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------------- voice lab ----------------
  function renderLocalStats() {
    const stats = Analysis.computeLocalStats(Storage.getEntries());
    if (!stats) {
      els.localStats.innerHTML = "";
      return;
    }
    els.localStats.innerHTML = `
      <div class="stat-tile">
        <div class="stat-value">${stats.entryCount}</div>
        <div class="stat-label">Entries</div>
      </div>
      <div class="stat-tile">
        <div class="stat-value">${stats.totalWords.toLocaleString()}</div>
        <div class="stat-label">Words written</div>
      </div>
      <div class="stat-tile">
        <div class="stat-value">${stats.avgWordsPerEntry}</div>
        <div class="stat-label">Avg. words / entry</div>
      </div>
      <div class="stat-tile">
        <div class="stat-value">${stats.avgSentenceLength}</div>
        <div class="stat-label">Avg. sentence length</div>
      </div>
      ${
        stats.topWords.length
          ? `<div class="stat-tile" style="grid-column: 1 / -1;">
              <div class="stat-label" style="margin-bottom:8px;">Words you reach for</div>
              <div class="word-chip-row">
                ${stats.topWords.map((w) => `<span class="word-chip">${escapeHtml(w.word)} · ${w.count}</span>`).join("")}
              </div>
            </div>`
          : ""
      }
    `;
  }

  function renderAnalysisDashboard(analysis) {
    if (!analysis) {
      els.analysisDashboard.innerHTML = "";
      return;
    }
    els.analysisDashboard.innerHTML = ANALYSIS_PARAMETERS.map((param) => {
      const val = analysis.parameters?.[param.key];
      if (!val) return "";
      const isGrowth = param.key === "growthEdge";
      return `
        <div class="analysis-card ${isGrowth ? "growth" : ""}">
          <h3>${escapeHtml(param.label)}</h3>
          <p>${escapeHtml(val.summary || "")}</p>
          ${val.quote ? `<blockquote>"${escapeHtml(val.quote)}"</blockquote>` : ""}
        </div>
      `;
    }).join("");
  }

  function renderAnalysisHistory() {
    const analyses = [...Storage.getAnalyses()].reverse();
    if (!analyses.length) {
      els.analysisHistory.innerHTML = "";
      return;
    }
    els.analysisHistory.innerHTML =
      `<div style="margin-bottom:8px; font-weight:600; color: var(--ink-soft);">Past runs</div>` +
      analyses
        .map(
          (a) =>
            `<div class="history-item">${new Date(a.date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })} — covered ${a.entryIds.length} entries</div>`
        )
        .join("");
  }

  function renderVoiceLab() {
    renderLocalStats();
    const latest = Storage.latestAnalysis();
    renderAnalysisDashboard(latest);
    renderAnalysisHistory();

    const entryCount = Storage.getEntries().length;
    const settings = Storage.getSettings();
    if (!settings.apiKey) {
      els.labHint.textContent = "Add an API key in Settings to run an analysis.";
      els.runAnalysisBtn.disabled = true;
    } else if (entryCount < Analysis.MIN_ENTRIES_FOR_ANALYSIS) {
      els.labHint.textContent = `Write ${Analysis.MIN_ENTRIES_FOR_ANALYSIS - entryCount} more entr${
        Analysis.MIN_ENTRIES_FOR_ANALYSIS - entryCount === 1 ? "y" : "ies"
      } to unlock an analysis.`;
      els.runAnalysisBtn.disabled = true;
    } else {
      els.labHint.textContent = latest ? "" : "Ready whenever you are.";
      els.runAnalysisBtn.disabled = false;
    }
  }

  els.runAnalysisBtn.addEventListener("click", async () => {
    els.runAnalysisBtn.disabled = true;
    const originalLabel = els.runAnalysisBtn.textContent;
    els.runAnalysisBtn.textContent = "Reading your entries…";
    els.labHint.textContent = "";
    try {
      const analysis = await Analysis.runAnalysis({});
      renderAnalysisDashboard(analysis);
      renderAnalysisHistory();
      showToast("Analysis updated.");
    } catch (err) {
      showToast(err.message || "Analysis failed.", { duration: 4000 });
    } finally {
      els.runAnalysisBtn.textContent = originalLabel;
      els.runAnalysisBtn.disabled = false;
    }
  });

  // ---------------- settings ----------------
  function loadSettingsIntoForm() {
    const s = Storage.getSettings();
    els.apiKeyInput.value = s.apiKey;
    els.modelSelect.value = s.model;
    els.minutesInput.value = s.writeMinutes;
    els.analysisFreqInput.value = s.analysisEveryNEntries;
  }

  els.saveSettingsBtn.addEventListener("click", () => {
    const minutes = Math.max(1, Math.min(60, Number(els.minutesInput.value) || 10));
    const freq = Math.max(1, Math.min(60, Number(els.analysisFreqInput.value) || 7));
    Storage.saveSettings({
      apiKey: els.apiKeyInput.value.trim(),
      model: els.modelSelect.value,
      writeMinutes: minutes,
      analysisEveryNEntries: freq,
    });
    els.settingsSaveHint.textContent = "Saved.";
    setTimeout(() => (els.settingsSaveHint.textContent = ""), 2000);
    // A changed session length should take effect next time the timer resets.
    setupTimer();
  });

  els.exportBtn.addEventListener("click", () => {
    const data = Storage.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marginalia-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  els.importInput.addEventListener("change", async () => {
    const file = els.importInput.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      Storage.importAll(data, { merge: true });
      showToast("Imported. Entries merged in.");
      renderStreak();
    } catch (err) {
      showToast("Couldn't read that file — is it a Marginalia export?", { duration: 4000 });
    } finally {
      els.importInput.value = "";
    }
  });

  els.clearBtn.addEventListener("click", () => {
    if (!confirm("Delete every entry and analysis? This can't be undone (export a backup first if you're not sure).")) return;
    Storage.clearAll();
    renderStreak();
    showToast("All entries cleared.");
  });

  // ---------------- init ----------------
  function init() {
    setupTimer();
    updateWordCount();
    renderStreak();
    loadTopic();
  }
  init();
})();
