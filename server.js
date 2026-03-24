// ============================================================
// HumaFlow AI — server.js
// Express backend with humanizer engine
// ============================================================

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ============================================================
// 🧠 HUMANIZER ENGINE
// ============================================================

// Contractions map — expand formal → natural
const contractionMap = {
  "it is": "it's",
  "do not": "don't",
  "does not": "doesn't",
  "did not": "didn't",
  "is not": "isn't",
  "are not": "aren't",
  "was not": "wasn't",
  "were not": "weren't",
  "have not": "haven't",
  "has not": "hasn't",
  "had not": "hadn't",
  "will not": "won't",
  "would not": "wouldn't",
  "could not": "couldn't",
  "should not": "shouldn't",
  "cannot": "can't",
  "we are": "we're",
  "you are": "you're",
  "they are": "they're",
  "i am": "I'm",
  "we have": "we've",
  "you have": "you've",
  "they have": "they've",
  "i have": "I've",
  "i will": "I'll",
  "we will": "we'll",
  "you will": "you'll",
  "they will": "they'll",
  "that is": "that's",
  "there is": "there's",
  "here is": "here's",
  "who is": "who's",
  "what is": "what's",
  "it would": "it'd",
  "that would": "that'd",
  "i would": "I'd",
  "we would": "we'd",
};

// Robotic filler phrases to remove or replace
const roboticPhrases = [
  { pattern: /\bin conclusion\b/gi, replacements: ["to wrap things up", "so, to summarize", "all in all", "when you step back and look at it"] },
  { pattern: /\bfurthermore\b/gi, replacements: ["on top of that", "and also", "plus", "not just that —"] },
  { pattern: /\bmoreover\b/gi, replacements: ["what's more", "beyond that", "also worth noting", "and honestly"] },
  { pattern: /\bnevertheless\b/gi, replacements: ["still", "even so", "that said", "but here's the thing"] },
  { pattern: /\bnotwithstanding\b/gi, replacements: ["despite that", "even so", "still"] },
  { pattern: /\bsubsequently\b/gi, replacements: ["after that", "then", "next", "following that"] },
  { pattern: /\bultimately\b/gi, replacements: ["in the end", "at the end of the day", "when it comes down to it"] },
  { pattern: /\badditionally\b/gi, replacements: ["also", "and", "plus", "on top of that"] },
  { pattern: /\bdelve into\b/gi, replacements: ["explore", "dig into", "look at", "get into"] },
  { pattern: /\bit is important to note\b/gi, replacements: ["worth noting", "keep in mind", "something to remember"] },
  { pattern: /\bit is worth noting\b/gi, replacements: ["interestingly", "one thing to keep in mind", "notably"] },
  { pattern: /\bin order to\b/gi, replacements: ["to", "so you can", "if you want to"] },
  { pattern: /\bfor the purpose of\b/gi, replacements: ["to", "for"] },
  { pattern: /\bin the event that\b/gi, replacements: ["if", "should"] },
  { pattern: /\bprior to\b/gi, replacements: ["before"] },
  { pattern: /\bsubsequent to\b/gi, replacements: ["after", "following"] },
  { pattern: /\bin terms of\b/gi, replacements: ["when it comes to", "regarding", "as for"] },
  { pattern: /\bwith regard to\b/gi, replacements: ["about", "when it comes to", "regarding"] },
  { pattern: /\bthis allows\b/gi, replacements: ["this lets", "this helps", "this makes it possible to"] },
  { pattern: /\bone can\b/gi, replacements: ["you can", "it's possible to", "anyone can"] },
  { pattern: /\bensure\b/gi, replacements: ["make sure", "guarantee", "confirm"] },
  { pattern: /\butilize\b/gi, replacements: ["use", "put to use", "take advantage of"] },
  { pattern: /\bimplementation\b/gi, replacements: ["setup", "rollout", "execution", "how it works"] },
  { pattern: /\bfacilitate\b/gi, replacements: ["help", "make easier", "support"] },
  { pattern: /\bdemonstrate\b/gi, replacements: ["show", "prove", "make clear"] },
  { pattern: /\bcommencement\b/gi, replacements: ["start", "beginning"] },
  { pattern: /\btermination\b/gi, replacements: ["end", "finish", "close"] },
];

// Tone-specific openers and connectors
const toneConfig = {
  casual: {
    openers: ["okay so,", "so basically,", "honestly,", "here's the thing —", "real talk:", "look,", "right, so"],
    connectors: ["anyway,", "so yeah,", "basically,", "I mean,", "and honestly", "which is pretty cool", "you know?"],
    closers: ["pretty simple, right?", "makes sense?", "just like that.", "easy enough.", "hope that helps!"],
  },
  professional: {
    openers: ["to clarify,", "it should be noted that", "from a practical standpoint,", "the key insight here is", "in practice,"],
    connectors: ["building on this,", "as a result,", "with that in mind,", "to put it plainly,", "notably,"],
    closers: ["this represents a meaningful step forward.", "the implications are clear.", "the data supports this approach.", "this is the core of the strategy."],
  },
  friendly: {
    openers: ["hey, so", "you know what's great?", "here's something interesting —", "let me walk you through this.", "so, here's the deal:"],
    connectors: ["and the best part?", "which is awesome because", "and honestly,", "plus,", "and don't forget —"],
    closers: ["pretty cool, right?", "you've got this!", "hope that makes things clearer!", "let me know if you need more!"],
  },
  persuasive: {
    openers: ["here's what you need to know:", "think about it this way:", "the reality is,", "let's be honest —", "consider this:"],
    connectors: ["and that's exactly why", "which is exactly the point", "and here's the kicker —", "the proof is clear:", "what this means for you is"],
    closers: ["the choice is obvious.", "the results speak for themselves.", "don't miss this.", "act on this now.", "the opportunity is right in front of you."],
  },
  storytelling: {
    openers: ["it all started when", "picture this:", "here's a story worth telling.", "let me paint a picture.", "once you understand this,"],
    connectors: ["and that's when", "but then something shifted —", "the real turning point was", "what happened next was", "and just like that,"],
    closers: ["and that's the whole story.", "the lesson? simple.", "the journey ends there.", "and so the story goes.", "what a ride it's been."],
  },
};

// ── Helper: pick random element from array ──────────────────
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Apply contractions to text ──────────────────────────────
function applyContractions(text) {
  let result = text;
  for (const [formal, contraction] of Object.entries(contractionMap)) {
    const regex = new RegExp(`\\b${formal}\\b`, "gi");
    result = result.replace(regex, (match) => {
      // Preserve original case pattern
      return match[0] === match[0].toUpperCase()
        ? contraction.charAt(0).toUpperCase() + contraction.slice(1)
        : contraction;
    });
  }
  return result;
}

// ── Replace robotic phrases ─────────────────────────────────
function removeRoboticPhrases(text) {
  let result = text;
  for (const { pattern, replacements } of roboticPhrases) {
    result = result.replace(pattern, (match) => {
      const replacement = pick(replacements);
      // Match capitalisation
      if (match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });
  }
  return result;
}

// ── Split long sentences ────────────────────────────────────
function varySentenceLengths(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sentences
    .map((sentence, idx) => {
      const trimmed = sentence.trim();
      const wordCount = trimmed.split(/\s+/).length;

      // Break very long sentences (> 30 words) at a comma/connector
      if (wordCount > 30) {
        const midComma = trimmed.lastIndexOf(",", Math.floor(trimmed.length / 2));
        if (midComma > 20 && midComma < trimmed.length - 20) {
          return trimmed.slice(0, midComma + 1) + " " + trimmed.slice(midComma + 1).trim();
        }
      }

      // Occasionally start a sentence with a short punchy lead-in (every 4th sentence)
      if (idx % 4 === 0 && wordCount > 10) {
        const leadIns = ["Here's the thing: ", "The truth is, ", "Simply put, ", "Worth knowing: "];
        // Only 40% chance — keeps it natural
        if (Math.random() < 0.4) {
          return pick(leadIns) + trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
        }
      }
      return trimmed;
    })
    .join(" ");
}

// ── Add tone-specific flavor ────────────────────────────────
function applyTone(text, tone) {
  const config = toneConfig[tone] || toneConfig["casual"];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  if (sentences.length === 0) return text;

  let result = [...sentences];

  // Add opener before first sentence occasionally
  if (Math.random() < 0.5 && result.length > 1) {
    result[0] = pick(config.openers) + " " + result[0].charAt(0).toLowerCase() + result[0].slice(1);
  }

  // Add a connector after a middle sentence
  if (result.length > 3) {
    const midIdx = Math.floor(result.length / 2);
    result[midIdx] = result[midIdx] + " " + pick(config.connectors);
  }

  return result.join(" ");
}

// ── Reduce word repetition ──────────────────────────────────
function reduceRepetition(text) {
  // Replace consecutive repeated words
  return text.replace(/\b(\w+)\s+\1\b/gi, "$1");
}

// ── Fix spacing/punctuation artifacts ──────────────────────
function cleanUp(text) {
  return text
    .replace(/\s{2,}/g, " ")           // double spaces
    .replace(/\s([,.!?;:])/g, "$1")    // space before punctuation
    .replace(/([.!?])\s*([a-z])/g, (m, p, q) => `${p} ${q.toUpperCase()}`) // capitalise after sentence
    .trim();
}

// ── MAIN HUMANIZE FUNCTION ──────────────────────────────────
function humanizeText(inputText, tone = "casual") {
  if (!inputText || inputText.trim().length === 0) {
    return { error: "No text provided." };
  }

  let text = inputText;

  // Pipeline: apply transformations in order
  text = applyContractions(text);       // Step 1: Contractions
  text = removeRoboticPhrases(text);    // Step 2: Remove AI phrases
  text = varySentenceLengths(text);     // Step 3: Vary structure
  text = applyTone(text, tone);         // Step 4: Tone injection
  text = reduceRepetition(text);        // Step 5: Cut repetition
  text = cleanUp(text);                 // Step 6: Polish

  return {
    original: inputText,
    humanized: text,
    tone,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    charCount: text.length,
  };
}

// ============================================================
// 🚀 API ROUTES
// ============================================================

// POST /humanize — main endpoint
app.post("/humanize", (req, res) => {
  const { text, tone } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'text' field." });
  }

  const validTones = ["casual", "professional", "friendly", "persuasive", "storytelling"];
  const selectedTone = validTones.includes(tone) ? tone : "casual";

  // Simulate slight processing delay (like a real AI call)
  setTimeout(() => {
    const result = humanizeText(text, selectedTone);
    res.json(result);
  }, 600 + Math.random() * 400); // 600–1000ms realistic delay
});

// GET /health — status check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "HumaFlow AI", version: "1.0.0" });
});

// GET /* — serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Start server ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 HumaFlow AI running at http://localhost:${PORT}\n`);
});
