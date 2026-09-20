/**
 * analysisConfig.js
 * -----------------
 * This is the file to edit if you want the Voice Lab to track different
 * things. Each entry becomes one card in the analysis dashboard and one
 * instruction in the prompt sent to Claude. Add, remove, or rewrite
 * entries freely — nothing else in the app needs to change; js/analysis.js
 * builds its prompt and renders its dashboard from this array.
 *
 * Each parameter Claude returns as:
 *   { "summary": "1-2 sentence finding", "quote": "a short verbatim excerpt as evidence, or empty string" }
 *
 * Fields:
 *   key         - unique, used as the JSON key Claude replies with
 *   label       - shown as the card title
 *   instruction - tells Claude exactly what to look for and how to report it
 */

const ANALYSIS_PARAMETERS = [
  {
    key: "sentenceRhythm",
    label: "Sentence rhythm",
    instruction:
      "Their sentence-length pattern: roughly how long sentences tend to run, how much that varies, and whether they use short sentences for emphasis or transition.",
  },
  {
    key: "vocabularyFingerprint",
    label: "Vocabulary fingerprint",
    instruction:
      "5-10 specific words or short phrases that recur across entries and feel like a personal signature or verbal tic, not generic language.",
  },
  {
    key: "openingMove",
    label: "Favored opening move",
    instruction:
      "The rhetorical move they most often reach for to open a piece — a concrete image, a bold claim, a question, a scene, a definition — with one quoted example.",
  },
  {
    key: "abstractionGradient",
    label: "Abstraction gradient",
    instruction:
      "Whether they tend to start concrete and drift abstract, start abstract and ground out in detail, or stay at one register throughout.",
  },
  {
    key: "resolutionStyle",
    label: "How pieces land",
    instruction:
      "How their entries tend to end: a resolved conclusion, a trailing-off, a loop back to the opening image or line, a punchline, or an unanswered question.",
  },
  {
    key: "tone",
    label: "Emotional register",
    instruction:
      "The dominant emotional tone(s) across entries, and whether tone shifts with topic or stays fairly constant regardless of subject.",
  },
  {
    key: "distinctiveMoves",
    label: "What makes it theirs",
    instruction:
      "2-3 specific techniques, habits, or turns of phrase that make this writing recognizable as this person's, as opposed to generic competent prose.",
  },
  {
    key: "growthEdge",
    label: "What to work on",
    instruction:
      "One concrete, specific thing to try in the next few sessions — a technique to push on, a habit to break, a mode to attempt — not generic encouragement.",
  },
];

window.ANALYSIS_PARAMETERS = ANALYSIS_PARAMETERS;
