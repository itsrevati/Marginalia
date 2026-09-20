/**
 * topicBank.js
 * ------------
 * A hand-curated fallback list, used when no API key is set (or a call
 * fails) so the app still works with zero setup and zero cost. Also used
 * to seed variety alongside AI-generated topics.
 *
 * Add to this freely — it's just data. `mode` controls how the topic is
 * framed on the Write screen; see js/topics.js MODE_LABELS for the copy.
 *
 * Modes:
 *   "concrete" - a plain noun or thing
 *   "abstract" - a concept, emotion, or idea
 *   "phrase"   - an idiom or saying to unpack
 *   "pair"     - two unrelated things to connect
 *   "reframe"  - a rhetorical stance applied to something ordinary
 */

const TOPIC_BANK = [
  // concrete
  { mode: "concrete", text: "Mango" },
  { mode: "concrete", text: "A rotary phone" },
  { mode: "concrete", text: "Static electricity" },
  { mode: "concrete", text: "A rusted key" },
  { mode: "concrete", text: "The smell of rain on hot pavement" },
  { mode: "concrete", text: "A vending machine" },
  { mode: "concrete", text: "Fog" },
  { mode: "concrete", text: "A church bell" },
  { mode: "concrete", text: "A splinter" },
  { mode: "concrete", text: "A library card" },
  { mode: "concrete", text: "A paper cut" },
  { mode: "concrete", text: "The last matchstick in a box" },
  { mode: "concrete", text: "A subway turnstile" },
  { mode: "concrete", text: "A cast-iron skillet" },
  { mode: "concrete", text: "A dial-up modem" },
  { mode: "concrete", text: "Sea glass" },
  { mode: "concrete", text: "A held elevator door" },
  { mode: "concrete", text: "A wristwatch that's stopped" },
  { mode: "concrete", text: "A parking ticket" },
  { mode: "concrete", text: "A dog-eared page" },

  // abstract
  { mode: "abstract", text: "Jealousy" },
  { mode: "abstract", text: "Momentum" },
  { mode: "abstract", text: "Nostalgia" },
  { mode: "abstract", text: "Debt" },
  { mode: "abstract", text: "Loyalty" },
  { mode: "abstract", text: "Boredom" },
  { mode: "abstract", text: "Ambition" },
  { mode: "abstract", text: "Forgiveness" },
  { mode: "abstract", text: "Luck" },
  { mode: "abstract", text: "Silence" },
  { mode: "abstract", text: "Patience" },
  { mode: "abstract", text: "Vanity" },
  { mode: "abstract", text: "Inheritance" },
  { mode: "abstract", text: "Discipline" },
  { mode: "abstract", text: "Envy" },
  { mode: "abstract", text: "Ritual" },
  { mode: "abstract", text: "Doubt" },
  { mode: "abstract", text: "Permission" },

  // phrases / idioms to unpack
  { mode: "phrase", text: "Beauty is in the eye of the beholder" },
  { mode: "phrase", text: "The grass is always greener" },
  { mode: "phrase", text: "Time heals all wounds" },
  { mode: "phrase", text: "Don't judge a book by its cover" },
  { mode: "phrase", text: "Actions speak louder than words" },
  { mode: "phrase", text: "You can't have your cake and eat it too" },
  { mode: "phrase", text: "Absence makes the heart grow fonder" },
  { mode: "phrase", text: "Curiosity killed the cat" },
  { mode: "phrase", text: "Still waters run deep" },
  { mode: "phrase", text: "A watched pot never boils" },
  { mode: "phrase", text: "The exception proves the rule" },
  { mode: "phrase", text: "Out of sight, out of mind" },
  { mode: "phrase", text: "History repeats itself" },
  { mode: "phrase", text: "Blood is thicker than water" },
  { mode: "phrase", text: "Fortune favors the bold" },

  // pairs — force an unexpected connection
  { mode: "pair", text: "A mango and jealousy" },
  { mode: "pair", text: "A rotary phone and forgiveness" },
  { mode: "pair", text: "Fog and ambition" },
  { mode: "pair", text: "A parking ticket and nostalgia" },
  { mode: "pair", text: "Static electricity and loyalty" },
  { mode: "pair", text: "A library card and debt" },
  { mode: "pair", text: "Sea glass and patience" },
  { mode: "pair", text: "A church bell and doubt" },

  // reframes — same subject, different rhetorical posture
  { mode: "reframe", text: "Write about your left shoe as if it kept a diary" },
  { mode: "reframe", text: "Argue against the existence of the color blue" },
  { mode: "reframe", text: "Describe Tuesday to someone who has never experienced a week" },
  { mode: "reframe", text: "Write an apology on behalf of the number thirteen" },
  { mode: "reframe", text: "Explain traffic lights as ancient religious symbols" },
  { mode: "reframe", text: "Write a eulogy for your least favorite chore" },
  { mode: "reframe", text: "Defend procrastination as an underrated virtue" },
  { mode: "reframe", text: "Describe your kitchen as a crime scene" },
  { mode: "reframe", text: "Write the terms and conditions for owning a houseplant" },
  { mode: "reframe", text: "Interview a Tuesday about what it's like being the least interesting day" },
];

window.TOPIC_BANK = TOPIC_BANK;
