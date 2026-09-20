/**
 * storage.js
 * ----------
 * Every read/write to the browser's localStorage goes through this file.
 * Nothing here ever leaves the device — there is no server. Keep this
 * file the single source of truth for the data shape so the rest of the
 * app never has to know how things are persisted.
 *
 * Data shapes (all stored as JSON strings):
 *
 *   freewrite.entries   -> Entry[]
 *     Entry = {
 *       id: string,            // uuid
 *       date: string,          // ISO date, e.g. "2026-09-19"
 *       createdAt: string,     // ISO datetime
 *       topic: string,         // the prompt they wrote from
 *       topicMode: string,     // "single" | "pair" | "reframe" | "phrase"
 *       text: string,          // what they wrote
 *       wordCount: number,
 *       elapsedSeconds: number
 *     }
 *
 *   freewrite.analyses  -> Analysis[]
 *     Analysis = {
 *       id: string,
 *       date: string,           // ISO datetime the analysis was run
 *       entryIds: string[],     // which entries it covers
 *       parameters: object,     // see js/analysisConfig.js for the shape
 *       raw: string              // the full text Claude returned, kept for reference
 *     }
 *
 *   freewrite.settings  -> Settings
 *     Settings = {
 *       apiKey: string,          // Anthropic API key, stored locally only
 *       model: string,           // e.g. "claude-haiku-4-5-20251001"
 *       writeMinutes: number,    // default 10
 *       analysisEveryNEntries: number  // how often to prompt for a Voice Lab run
 *     }
 */

const STORAGE_KEYS = {
  entries: "freewrite.entries",
  analyses: "freewrite.analyses",
  settings: "freewrite.settings",
};

const DEFAULT_SETTINGS = {
  apiKey: "",
  model: "claude-haiku-4-5-20251001",
  writeMinutes: 10,
  analysisEveryNEntries: 7,
};

function uid() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
}

const Storage = {
  // --- entries ---
  getEntries() {
    return safeParse(localStorage.getItem(STORAGE_KEYS.entries), []);
  },
  saveEntry(entry) {
    const entries = Storage.getEntries();
    entries.push(entry);
    entries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entries));
    return entry;
  },
  deleteEntry(id) {
    const entries = Storage.getEntries().filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entries));
  },
  hasEntryToday() {
    const today = new Date().toISOString().slice(0, 10);
    return Storage.getEntries().some((e) => e.date === today);
  },

  // --- analyses ---
  getAnalyses() {
    return safeParse(localStorage.getItem(STORAGE_KEYS.analyses), []);
  },
  saveAnalysis(analysis) {
    const analyses = Storage.getAnalyses();
    analyses.push(analysis);
    localStorage.setItem(STORAGE_KEYS.analyses, JSON.stringify(analyses));
    return analysis;
  },
  latestAnalysis() {
    const analyses = Storage.getAnalyses();
    return analyses.length ? analyses[analyses.length - 1] : null;
  },

  // --- settings ---
  getSettings() {
    return {
      ...DEFAULT_SETTINGS,
      ...safeParse(localStorage.getItem(STORAGE_KEYS.settings), {}),
    };
  },
  saveSettings(partial) {
    const merged = { ...Storage.getSettings(), ...partial };
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(merged));
    return merged;
  },

  // --- bulk / portability ---
  exportAll() {
    return {
      exportedAt: new Date().toISOString(),
      entries: Storage.getEntries(),
      analyses: Storage.getAnalyses(),
      // deliberately excludes settings.apiKey — never put the key in an export file
      settings: { ...Storage.getSettings(), apiKey: undefined },
    };
  },
  importAll(data, { merge = true } = {}) {
    if (!data || typeof data !== "object") throw new Error("Invalid file.");
    const incomingEntries = Array.isArray(data.entries) ? data.entries : [];
    const incomingAnalyses = Array.isArray(data.analyses) ? data.analyses : [];

    if (merge) {
      const existingIds = new Set(Storage.getEntries().map((e) => e.id));
      const toAdd = incomingEntries.filter((e) => !existingIds.has(e.id));
      const merged = [...Storage.getEntries(), ...toAdd].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(merged));

      const existingAnalysisIds = new Set(Storage.getAnalyses().map((a) => a.id));
      const addAnalyses = incomingAnalyses.filter((a) => !existingAnalysisIds.has(a.id));
      localStorage.setItem(
        STORAGE_KEYS.analyses,
        JSON.stringify([...Storage.getAnalyses(), ...addAnalyses])
      );
    } else {
      localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(incomingEntries));
      localStorage.setItem(STORAGE_KEYS.analyses, JSON.stringify(incomingAnalyses));
    }
  },
  clearAll() {
    localStorage.removeItem(STORAGE_KEYS.entries);
    localStorage.removeItem(STORAGE_KEYS.analyses);
    // settings (including the API key) are left untouched on purpose
  },
};

window.Storage = Storage;
window.uid = uid;
