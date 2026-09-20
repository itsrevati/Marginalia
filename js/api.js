/**
 * api.js
 * ------
 * The only file that talks to the Anthropic API. Called directly from the
 * browser using the viewer's own API key (never stored anywhere but this
 * browser's localStorage, never sent anywhere but api.anthropic.com).
 *
 * Anthropic's API blocks plain browser calls by default (CORS) unless you
 * explicitly opt in, because shipping your API key to a browser exposes it
 * to anyone who opens dev tools — which is exactly what we're doing here,
 * knowingly, for a single-user personal tool. The
 * "anthropic-dangerous-direct-browser-access" header is how you opt in.
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

class ApiKeyMissingError extends Error {
  constructor() {
    super("No API key set. Add one in Settings.");
    this.name = "ApiKeyMissingError";
  }
}

/**
 * Sends a single-turn prompt to Claude and returns the raw text reply.
 * @param {string} prompt
 * @param {{ model?: string, maxTokens?: number, system?: string }} opts
 */
async function callClaude(prompt, opts = {}) {
  const settings = Storage.getSettings();
  const apiKey = settings.apiKey;
  if (!apiKey) throw new ApiKeyMissingError();

  const body = {
    model: opts.model || settings.model,
    max_tokens: opts.maxTokens || 1024,
    messages: [{ role: "user", content: prompt }],
  };
  if (opts.system) body.system = opts.system;

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const errJson = await res.json();
      detail = errJson?.error?.message || "";
    } catch {
      /* ignore parse failure, fall through to generic message */
    }
    if (res.status === 401) {
      throw new Error("That API key was rejected. Double-check it in Settings.");
    }
    if (res.status === 429) {
      throw new Error("Rate limited by Anthropic — wait a moment and try again.");
    }
    throw new Error(detail || `API request failed (${res.status}).`);
  }

  const json = await res.json();
  const text = (json.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!text) throw new Error("Claude returned an empty response.");
  return text;
}

/** Pulls the first {...} or [...] JSON value out of a reply, tolerantly. */
function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  try {
    return JSON.parse(candidate);
  } catch {
    /* fall through to bracket-scan */
  }
  const first = candidate.search(/[[{]/);
  const lastCurly = candidate.lastIndexOf("}");
  const lastSquare = candidate.lastIndexOf("]");
  const last = Math.max(lastCurly, lastSquare);
  if (first === -1 || last === -1 || last < first) {
    throw new Error("Could not find JSON in Claude's reply.");
  }
  return JSON.parse(candidate.slice(first, last + 1));
}

async function callClaudeForJson(prompt, opts = {}) {
  const text = await callClaude(prompt, opts);
  return extractJson(text);
}

window.Api = { callClaude, callClaudeForJson, ApiKeyMissingError };
