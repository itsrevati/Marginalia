/**
 * analysis.js
 * -----------
 * Runs a "Voice Lab" analysis over past entries using the parameters
 * defined in js/analysisConfig.js, and computes a few cheap local stats
 * (no API needed) to show alongside it.
 */

const MIN_ENTRIES_FOR_ANALYSIS = 3;

function buildAnalysisPrompt(entries) {
  const schemaLines = ANALYSIS_PARAMETERS.map(
    (p) => `  "${p.key}": { "summary": string, "quote": string },  // ${p.instruction}`
  ).join("\n");

  const entriesBlock = entries
    .map((e, i) => `--- Entry ${i + 1} (${e.date}, topic: "${e.topic}") ---\n${e.text}`)
    .join("\n\n");

  return `You are analyzing a sequence of daily 10-minute freewriting entries to characterize this writer's distinctive voice. Read all entries below as one body of work, look for patterns that repeat across entries (not just what one entry does), and cite short verbatim quotes as evidence where possible.

${entriesBlock}

Reply with ONLY a JSON object shaped exactly like this, no other text:
{
${schemaLines}
}`;
}

/** Cheap, non-AI stats computed locally — always available, free. */
function computeLocalStats(entries) {
  if (!entries.length) return null;
  const words = entries.flatMap((e) => e.text.trim().split(/\s+/).filter(Boolean));
  const totalWords = words.length;
  const avgWordsPerEntry = Math.round(totalWords / entries.length);

  const sentences = entries.flatMap((e) =>
    e.text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
  );
  const avgSentenceLength = sentences.length
    ? Math.round(
        sentences.reduce((sum, s) => sum + s.split(/\s+/).filter(Boolean).length, 0) /
          sentences.length
      )
    : 0;

  const stop = new Set(
    "the a an and or but so if of to in on for with at by from as is are was were be been being this that these those it its i you he she they we my your his her their our not no do does did".split(
      " "
    )
  );
  const freq = new Map();
  for (const raw of words) {
    const w = raw.toLowerCase().replace(/[^a-z']/g, "");
    if (w.length < 4 || stop.has(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  const topWords = [...freq.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  return { totalWords, avgWordsPerEntry, avgSentenceLength, topWords, entryCount: entries.length };
}

/**
 * Runs a full analysis over the most recent `windowSize` entries (or all,
 * if fewer). Returns the saved Analysis record.
 */
async function runAnalysis({ windowSize = 15 } = {}) {
  const entries = Storage.getEntries();
  if (entries.length < MIN_ENTRIES_FOR_ANALYSIS) {
    throw new Error(
      `Write at least ${MIN_ENTRIES_FOR_ANALYSIS} entries before running an analysis — there isn't enough to find a pattern in yet.`
    );
  }
  const settings = Storage.getSettings();
  if (!settings.apiKey) {
    throw new Api.ApiKeyMissingError();
  }

  const window = entries.slice(-windowSize);
  const prompt = buildAnalysisPrompt(window);
  const raw = await Api.callClaude(prompt, { maxTokens: 2000, model: settings.model });
  const parameters = extractJson(raw);

  const analysis = {
    id: uid(),
    date: new Date().toISOString(),
    entryIds: window.map((e) => e.id),
    parameters,
    raw,
  };
  Storage.saveAnalysis(analysis);
  return analysis;
}

window.Analysis = { runAnalysis, computeLocalStats, MIN_ENTRIES_FOR_ANALYSIS };
