/**
 * topics.js
 * ---------
 * Decides what today's freewriting topic is. Prefers asking Claude for a
 * fresh one informed by writing history (so it can deliberately push
 * against patterns the Voice Lab has noticed); falls back to the local
 * topic bank when there's no API key or the call fails.
 */

const MODE_LABELS = {
  concrete: "A thing",
  abstract: "A concept",
  phrase: "A phrase to unpack",
  pair: "Connect these two",
  reframe: "A twist",
};

function recentTopicTexts(limit = 25) {
  return Storage.getEntries()
    .slice(-limit)
    .map((e) => e.topic);
}

function pickFallbackTopic() {
  const used = new Set(recentTopicTexts(TOPIC_BANK.length));
  const unused = TOPIC_BANK.filter((t) => !used.has(t.text));
  const pool = unused.length ? unused : TOPIC_BANK;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return { ...pick, challengeNote: "" };
}

function buildTopicPrompt() {
  const recent = recentTopicTexts(20);
  const analysis = Storage.latestAnalysis();
  const entryCount = Storage.getEntries().length;

  let context = `This person does a daily 10-minute freewriting practice to develop their writing voice. They write from pure recollection and imagination only — never look anything up. They've completed ${entryCount} sessions so far.`;

  if (recent.length) {
    context += `\n\nTopics they've already written about recently (do not repeat these, and avoid close variants):\n- ${recent.join("\n- ")}`;
  }

  if (analysis && analysis.parameters) {
    context += `\n\nThe most recent analysis of their writing voice found:\n${JSON.stringify(
      analysis.parameters,
      null,
      2
    )}\n\nUse this to pick a topic and mode that will genuinely stretch them — push against a pattern noted above (e.g. if they always open with concrete imagery, hand them something abstract or argumentative; if they favor short punchy sentences, give them something that invites a long unspooling one). Don't just play to their strengths.`;
  }

  return `${context}

Generate ONE new freewriting topic. Pick whichever mode will most productively challenge them today:
- "concrete": a specific thing, object, or sensory detail
- "abstract": a concept, emotion, or idea
- "phrase": an idiom or saying to unpack and argue with
- "pair": two unrelated things they must connect in one piece of writing
- "reframe": an unusual rhetorical stance on an ordinary subject (write X as if it were Y, defend the indefensible, etc.)

Reply with ONLY a JSON object, no other text:
{"mode": "one of the five modes above", "text": "the topic itself, phrased the way you'd say it to them directly", "challengeNote": "one short sentence (under 20 words) on why this pushes them, written directly to them, e.g. 'You tend to open with images — try leading with an argument instead.' Leave empty string if you have no real signal to base this on yet."}`;
}

/**
 * Returns { mode, text, challengeNote, source: "ai" | "bank" }
 */
async function generateTopic() {
  const settings = Storage.getSettings();
  if (!settings.apiKey) {
    return { ...pickFallbackTopic(), source: "bank" };
  }

  try {
    const json = await Api.callClaudeForJson(buildTopicPrompt(), {
      maxTokens: 300,
      model: settings.model,
    });
    if (!json || typeof json.text !== "string" || !json.text.trim()) {
      throw new Error("Malformed topic response.");
    }
    const mode = MODE_LABELS[json.mode] ? json.mode : "concrete";
    return {
      mode,
      text: json.text.trim(),
      challengeNote: (json.challengeNote || "").trim(),
      source: "ai",
    };
  } catch (err) {
    console.warn("Topic generation via API failed, using fallback bank:", err);
    return { ...pickFallbackTopic(), source: "bank" };
  }
}

window.Topics = { generateTopic, MODE_LABELS };
