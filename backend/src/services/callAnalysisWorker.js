// backend/src/services/callAnalysisWorker.js
// ─────────────────────────────────────────────────────────────────
// AI pipeline for the CALL flow (/api/calls/*)
//
// Unlike analysisWorker.js (which targets AudioRecording + CallAnalysis),
// this worker reads from a Call document and writes results back into the
// same Call document's embedded fields.
//
// Pipeline: Call.filePath → Whisper STT → Translation → GPT-4o → Call save
// ─────────────────────────────────────────────────────────────────

const fs   = require("fs");
const path = require("path");
const OpenAI = require("openai");
const Call = require("../models/Call");

// ── Lazy OpenAI client ────────────────────────────────────────────
let _openai = null;
function getOpenAI() {
    if (!_openai) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is not set. Add it to your .env file.");
        }
        _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return _openai;
}

const WHISPER_MODEL = "whisper-1";
const GPT_MODEL     = "gpt-4o";

const WHISPER_PROMPT =
    "Sales call recording. Speakers: Sales Counsellor, Student. " +
    "Topics: Data Science, Python, Full Stack, Digital Marketing, Machine Learning, " +
    "MBA, fees, placement, admissions. " +
    "Names: Rahul, Priya, Ankit, Sneha, Amit, Neha, Pooja, Ravi.";

// ── Step 1 — Transcribe ───────────────────────────────────────────
async function transcribeAudio(filePath) {
    const absPath = path.resolve(filePath);
    if (!fs.existsSync(absPath)) {
        throw new Error(`Audio file not found: ${absPath}`);
    }

    console.log(`  📝 [STT] Transcribing: ${path.basename(absPath)}`);

    const response = await getOpenAI().audio.transcriptions.create({
        model: WHISPER_MODEL,
        file: fs.createReadStream(absPath),
        prompt: WHISPER_PROMPT,
        response_format: "verbose_json",
    });

    return {
        originalText: response.text || "",
        detectedLanguage: response.language || "en",
    };
}

// ── Step 2 — Translate ────────────────────────────────────────────
async function translateToEnglish(text, lang) {
    const isEnglish = ["en", "english"].includes((lang || "en").toLowerCase());
    if (isEnglish) {
        console.log("  ⏭️  [Translate] Already English — skipping");
        return { englishText: text, translated: false };
    }

    console.log(`  🌐 [Translate] ${lang} → English`);

    const res = await getOpenAI().chat.completions.create({
        model: GPT_MODEL,
        temperature: 0.2,
        messages: [
            {
                role: "system",
                content:
                    "You are a professional translator. Translate the text to English accurately. " +
                    "Preserve the conversational tone, names, and technical terms. Return ONLY the translated text.",
            },
            { role: "user", content: `Translate this ${lang} text to English:\n\n${text}` },
        ],
    });

    return { englishText: res.choices[0].message.content.trim(), translated: true };
}

// ── Step 3 — GPT-4o Analysis ──────────────────────────────────────
async function analyseTranscript(transcript) {
    console.log("  🧠 [GPT-4o] Analysing transcript...");

    const systemPrompt = `You are an expert sales call analyst for an educational technology company.
Analyse the transcript and return ONLY a valid JSON object — no markdown, no explanation.
All scores are integers 1–10 unless otherwise noted.

LEAD SCORE RUBRIC:
9-10: Hot lead — asked about enrollment/payment, no major objections.
7-8:  Warm lead — clear interest, one pending concern.
5-6:  Medium lead — engaged but non-committal, comparing options.
3-4:  Cold lead — polite but low engagement, multiple objections.
1-2:  Dead lead — uninterested, wrong number, or asked to be removed.`;

    const userPrompt = `Analyse this sales call and return a JSON object with EXACTLY these fields:
{
  "student_name": "<string|null>",
  "counsellor_name": "<string|null>",
  "course_interested": "<string|null>",
  "city": "<string|null>",
  "sentiment": "<Positive|Negative|Neutral>",
  "interested": <true|false>,
  "follow_up_required": <true|false>,
  "follow_up_date": "<YYYY-MM-DD|null>",
  "key_concerns": ["<concern>"],
  "parent_concern": <true|false>,
  "fees_issue": <true|false>,
  "placement_concern": <true|false>,
  "timing_concern": <true|false>,
  "confidence_score": <1-10>,
  "communication_score": <1-10>,
  "engagement_score": <1-10>,
  "objection_handling_score": <1-10>,
  "script_compliance_score": <1-10>,
  "closing_probability": <0-100>,
  "lead_score": <1-10>,
  "call_summary": "<3-5 sentence summary>"
}

Transcript:
${transcript}`;

    const res = await getOpenAI().chat.completions.create({
        model: GPT_MODEL,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user",   content: userPrompt },
        ],
    });

    let raw;
    try {
        raw = JSON.parse(res.choices[0].message.content.trim());
    } catch (e) {
        throw new Error(`LLM returned invalid JSON: ${e.message}`);
    }

    // Sanitise and clamp
    const clamp = (v, lo, hi) => {
        const n = parseInt(v, 10);
        return isNaN(n) ? lo : Math.max(lo, Math.min(hi, n));
    };
    const clampF = (v) => {
        const n = parseFloat(v);
        return isNaN(n) ? 0 : Math.max(0, Math.min(100, Math.round(n * 100) / 100));
    };
    const sentMap = { positive: "Positive", negative: "Negative", neutral: "Neutral" };

    return {
        studentName:     raw.student_name   || null,
        counsellorName:  raw.counsellor_name || null,
        courseInterest:  raw.course_interested || null,
        studentCity:     raw.city            || null,
        sentiment:       sentMap[(raw.sentiment || "neutral").toLowerCase()] || "Neutral",
        followUpRequired: Boolean(raw.follow_up_required),
        followUpDate:    raw.follow_up_date  || null,
        keyConcerns:     Array.isArray(raw.key_concerns) ? raw.key_concerns.filter(Boolean) : [],
        parentConcern:   Boolean(raw.parent_concern),
        feesIssue:       Boolean(raw.fees_issue),
        placementConcern:Boolean(raw.placement_concern),
        timingConcern:   Boolean(raw.timing_concern),
        leadScore:       clamp(raw.lead_score, 1, 10),
        callSummary:     raw.call_summary || "No summary generated.",
        closingProbability: clampF(raw.closing_probability),
        scores: {
            confidence:         clamp(raw.confidence_score, 1, 10),
            communication:      clamp(raw.communication_score, 1, 10),
            engagement:         clamp(raw.engagement_score, 1, 10),
            objectionHandling:  clamp(raw.objection_handling_score, 1, 10),
            scriptCompliance:   clamp(raw.script_compliance_score, 1, 10),
        },
    };
}

// ── Main Pipeline ─────────────────────────────────────────────────
async function processCall(callId) {
    const start = Date.now();
    console.log(`\n${"═".repeat(56)}`);
    console.log(`🚀 Call Analysis Pipeline — Call ID: ${callId}`);
    console.log(`${"═".repeat(56)}`);

    const call = await Call.findById(callId);
    if (!call) throw new Error(`Call not found: ${callId}`);

    try {
        // Step 1 — Transcribe
        const { originalText, detectedLanguage } = await transcribeAudio(call.filePath);
        call.transcriptOriginal = originalText;
        call.detectedLanguage   = detectedLanguage;
        await call.save();

        // Step 2 — Translate
        const { englishText } = await translateToEnglish(originalText, detectedLanguage);
        call.transcriptEnglish = englishText;
        await call.save();

        // Step 3 — Analyse
        const result = await analyseTranscript(englishText);

        // Step 4 — Write results back to Call document
        Object.assign(call, result);
        call.status       = "completed";
        call.errorMessage = null;
        await call.save();

        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`\n${"─".repeat(56)}`);
        console.log(`✅ Done in ${elapsed}s | Sentiment: ${result.sentiment} | Lead: ${result.leadScore}/10`);
        console.log(`${"─".repeat(56)}\n`);

        return call;

    } catch (err) {
        console.error(`\n❌ Call pipeline FAILED for ${callId}:`, err.message);
        await Call.findByIdAndUpdate(callId, {
            status:       "failed",
            errorMessage: err.message,
        });
        throw err;
    }
}

module.exports = { processCall, transcribeAudio, translateToEnglish, analyseTranscript };
