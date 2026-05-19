// backend/src/services/analysisWorker.js
// ─────────────────────────────────────────────────────────────────
// AI Analysis Worker — Full Pipeline
//
// Pipeline:  Audio File → Whisper STT → Translation → GPT-4o Analysis → Save
//
// Usage:
//   const { processAudioRecording } = require("./services/analysisWorker");
//   await processAudioRecording(audioRecordingId);
// ─────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const AudioRecording = require("../models/AudioRecording");
const CallAnalysis = require("../models/CallAnalysis");
const User = require("../models/User");
const { appendToExcel } = require("./excelExportService");
const { preprocessAudio, cleanupProcessedFile } = require("./audioPreprocessService");
const { sendAnalysisAlerts } = require("./notificationService");


// ── Lazy-initialised OpenAI client ────────────────────────────────
// We defer creation so the module can be required before dotenv loads
let _openai = null;
function getOpenAI() {
    if (!_openai) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error(
                "OPENAI_API_KEY is not set. Add it to your .env file."
            );
        }
        _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return _openai;
}

// ── Constants ─────────────────────────────────────────────────────
const WHISPER_MODEL = "whisper-1";
const GPT_MODEL = "gpt-4o";

// Whisper prompt to prime vocabulary for educational sales calls
const WHISPER_PROMPT =
    "Sales call recording. Possible speakers: Sales Executive, Student. " +
    "Topics: Data Science, Python, Full Stack, Digital Marketing, " +
    "Machine Learning, MBA, courses, fees, placement, admissions. " +
    "Common names: Rahul, Priya, Ankit, Sneha, Amit, Neha, Pooja, Ravi.";

// ─────────────────────────────────────────────────────────────────
// STEP 1 — Transcribe audio using OpenAI Whisper
// ─────────────────────────────────────────────────────────────────
async function transcribeAudio(filePath) {
    console.log(`  📝 [Step 1] Transcribing: ${path.basename(filePath)}`);

    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
        throw new Error(`Audio file not found: ${absolutePath}`);
    }

    const fileStream = fs.createReadStream(absolutePath);

    const response = await getOpenAI().audio.transcriptions.create({
        model: WHISPER_MODEL,
        file: fileStream,
        prompt: WHISPER_PROMPT,
        response_format: "verbose_json", // gives us language + segments
    });

    const detectedLanguage = response.language || "en";
    const transcriptText = response.text || "";

    console.log(`  ✅ Transcription complete — Language: ${detectedLanguage}, Length: ${transcriptText.length} chars`);

    return {
        originalText: transcriptText,
        detectedLanguage,
        segments: response.segments || [],
    };
}

// ─────────────────────────────────────────────────────────────────
// STEP 2 — Translate to English if not already English
// Uses GPT-4o for high-quality contextual translation
// ─────────────────────────────────────────────────────────────────
async function translateToEnglish(text, detectedLanguage) {
    // If already English, skip translation
    const englishCodes = ["en", "english"];
    if (englishCodes.includes(detectedLanguage.toLowerCase())) {
        console.log("  ⏭️  [Step 2] Already in English — skipping translation");
        return {
            englishText: text,
            translationRequired: false,
        };
    }

    console.log(`  🌐 [Step 2] Translating from '${detectedLanguage}' to English...`);

    const response = await getOpenAI().chat.completions.create({
        model: GPT_MODEL,
        temperature: 0.2,
        messages: [
            {
                role: "system",
                content:
                    "You are a professional translator. Translate the following text to English accurately. " +
                    "Preserve the conversational tone and all names, places, and technical terms. " +
                    "Return ONLY the translated text, nothing else.",
            },
            {
                role: "user",
                content: `Translate this ${detectedLanguage} text to English:\n\n${text}`,
            },
        ],
    });

    const englishText = response.choices[0].message.content.trim();
    console.log(`  ✅ Translation complete — ${englishText.length} chars`);

    return {
        englishText,
        translationRequired: true,
    };
}

// ─────────────────────────────────────────────────────────────────
// STEP 3 — Analyse English transcript using GPT-4o
// Returns structured JSON with all extracted fields
// ─────────────────────────────────────────────────────────────────
async function analyseTranscript(englishTranscript) {
    console.log("  🧠 [Step 3] Analysing transcript with GPT-4o...");

    const systemPrompt = `You are an expert sales call analyst for an educational technology company.
Your job is to analyse sales call transcripts and extract structured data.
You must return ONLY a valid JSON object. No markdown, no explanation, no code fences.
All scores are integers from 1 to 10 unless otherwise specified.

SCORING RUBRIC FOR LEAD SCORE:
- 9-10 (Hot Lead): Student explicitly asked for enrollment steps, fee payment details, or batch joining. No major objections raised.
- 7-8 (Warm Lead): Student showed clear interest, asked multiple questions, but has one pending concern (fees/timing). Follow-up likely to convert.
- 5-6 (Medium Lead): Student was engaged but non-committal. Mentioned comparing options. Needs 2+ follow-ups.
- 3-4 (Cold Lead): Student was polite but showed low engagement. Raised multiple objections. Low closing probability.
- 1-2 (Dead Lead): Student was uninterested, rude, wrong number, or asked to be removed from call list.

SUMMARY GUIDELINES:
- Summary must be 3-5 sentences maximum.
- Must mention: student's main interest, key concern(s), and next step (follow-up or closed).
- Must NOT reference the transcript directly (no "The student said..." — use neutral third person).`;

    const userPrompt = `Analyse the following sales call transcript and return a JSON object with exactly these fields:

{
  "student_name": "<string or null>",
  "counsellor_name": "<string or null>",
  "course_interested": "<string or null>",
  "city": "<string or null>",
  "sentiment": "<Positive|Negative|Neutral>",
  "interested": <true|false>,
  "follow_up_required": <true|false>,
  "follow_up_date": "<YYYY-MM-DD or null>",
  "key_concerns": ["<concern1>", "<concern2>"],
  "parent_concern": <true|false>,
  "fees_issue": <true|false>,
  "placement_concern": <true|false>,
  "timing_concern": <true|false>,
  "counsellor_confidence_score": <1-10>,
  "communication_quality_score": <1-10>,
  "student_engagement_score": <1-10>,
  "closing_probability": <0.0-100.0>,
  "lead_score": <1-10>,
  "call_summary": "<3-5 sentence plain English summary>"
}

Transcript:
${englishTranscript}`;

    const response = await getOpenAI().chat.completions.create({
        model: GPT_MODEL,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ],
    });

    const rawContent = response.choices[0].message.content.trim();

    let analysis;
    try {
        analysis = JSON.parse(rawContent);
    } catch (parseErr) {
        console.error("  ❌ Failed to parse LLM JSON response:", rawContent.substring(0, 200));
        throw new Error(`LLM returned invalid JSON: ${parseErr.message}`);
    }

    // ── Validate & sanitise required fields ────────────────────
    analysis = sanitiseAnalysis(analysis);

    console.log(`  ✅ Analysis complete — Sentiment: ${analysis.sentiment}, Lead Score: ${analysis.lead_score}`);
    return analysis;
}

// ─────────────────────────────────────────────────────────────────
// Sanitise and validate LLM output to ensure schema compliance
// ─────────────────────────────────────────────────────────────────
function sanitiseAnalysis(raw) {
    // Normalise sentiment to Title Case
    const sentimentMap = {
        positive: "Positive",
        negative: "Negative",
        neutral: "Neutral",
    };
    const sentiment = sentimentMap[(raw.sentiment || "neutral").toLowerCase()] || "Neutral";

    // Clamp scores to 1–10 range
    const clamp = (val, min, max) => {
        const num = parseInt(val, 10);
        if (isNaN(num)) return min;
        return Math.max(min, Math.min(max, num));
    };

    // Clamp probability to 0–100
    const clampProb = (val) => {
        const num = parseFloat(val);
        if (isNaN(num)) return 0;
        return Math.max(0, Math.min(100, Math.round(num * 100) / 100));
    };

    return {
        student_name: raw.student_name || null,
        counsellor_name: raw.counsellor_name || null,
        course_interested: raw.course_interested || null,
        city: raw.city || null,
        sentiment,
        interested: Boolean(raw.interested),
        follow_up_required: Boolean(raw.follow_up_required),
        follow_up_date: raw.follow_up_date || null,
        key_concerns: Array.isArray(raw.key_concerns) ? raw.key_concerns.filter(Boolean) : [],
        parent_concern: Boolean(raw.parent_concern),
        fees_issue: Boolean(raw.fees_issue),
        placement_concern: Boolean(raw.placement_concern),
        timing_concern: Boolean(raw.timing_concern),
        counsellor_confidence_score: clamp(raw.counsellor_confidence_score, 1, 10),
        communication_quality_score: clamp(raw.communication_quality_score, 1, 10),
        student_engagement_score: clamp(raw.student_engagement_score, 1, 10),
        closing_probability: clampProb(raw.closing_probability),
        lead_score: clamp(raw.lead_score, 1, 10),
        call_summary: raw.call_summary || raw.ai_summary || "No summary generated.",
    };
}

// ─────────────────────────────────────────────────────────────────
// MAIN PIPELINE — Orchestrates all steps and saves to MongoDB
// ─────────────────────────────────────────────────────────────────
async function processAudioRecording(audioRecordingId) {
    const startTime = Date.now();
    console.log(`\n${"═".repeat(60)}`);
    console.log(`🚀 Starting AI Analysis Pipeline`);
    console.log(`   AudioRecording ID: ${audioRecordingId}`);
    console.log(`${"═".repeat(60)}`);

    // ── Fetch the AudioRecording document ─────────────────────
    const recording = await AudioRecording.findById(audioRecordingId);
    if (!recording) {
        throw new Error(`AudioRecording not found: ${audioRecordingId}`);
    }

    // ── Check if already analysed (prevent duplicate processing) ─
    const existing = await CallAnalysis.findOne({ audioRecordingId });
    if (existing && existing.status === "completed") {
        console.log("⚠️  Already analysed — skipping. Use reanalyse endpoint to force.");
        return existing;
    }

    // ── Create or reset the CallAnalysis record ───────────────
    let callAnalysis;
    if (existing) {
        existing.status = "pending";
        existing.errorMessage = null;
        await existing.save();
        callAnalysis = existing;
    } else {
        callAnalysis = await CallAnalysis.create({
            audioRecordingId,
            status: "pending",
            sentiment: "Neutral",
            leadScore: 1,
            callSummary: "Processing...",
        });
    }

    try {
        // ────────────────────────────────────────────────────────
        // STEP 1 — Preprocess audio (noise reduction + normalise)
        // ────────────────────────────────────────────────────────
        callAnalysis.status = "transcribing";
        await callAnalysis.save();

        let audioPathForWhisper = recording.filePath;
        let cleanFilePath = null;

        try {
            const { cleanPath, durationSeconds } = await preprocessAudio(recording.filePath);
            audioPathForWhisper = cleanPath;
            cleanFilePath = cleanPath;

            if (durationSeconds > 0) {
                await AudioRecording.findByIdAndUpdate(audioRecordingId, {
                    durationSeconds,
                });
            }
        } catch (prepErr) {
            console.warn("⚠️  Preprocessing failed, using raw file:", prepErr.message);
            audioPathForWhisper = recording.filePath;
        }

        // ────────────────────────────────────────────────────────
        // STEP 2 — Transcribe using OpenAI Whisper
        // ────────────────────────────────────────────────────────
        const transcription = await transcribeAudio(audioPathForWhisper);

        callAnalysis.transcript = {
            originalText: transcription.originalText,
            detectedLanguage: transcription.detectedLanguage,
            translationRequired: false,
            englishText: null,
        };
        await callAnalysis.save();

        // ────────────────────────────────────────────────────────
        // STEP 3 — Translate to English if needed
        // ────────────────────────────────────────────────────────
        callAnalysis.status = "translating";
        await callAnalysis.save();

        const translation = await translateToEnglish(
            transcription.originalText,
            transcription.detectedLanguage
        );

        callAnalysis.transcript.translationRequired = translation.translationRequired;
        callAnalysis.transcript.englishText = translation.englishText;
        await callAnalysis.save();

        // ────────────────────────────────────────────────────────
        // STEP 4 — Analyse with GPT-4o
        // ────────────────────────────────────────────────────────
        callAnalysis.status = "analysing";
        await callAnalysis.save();

        const analysis = await analyseTranscript(translation.englishText);

        // ────────────────────────────────────────────────────────
        // STEP 5 — Save all results to MongoDB
        // ────────────────────────────────────────────────────────
        const processingTimeMs = Date.now() - startTime;    // FIX: defined before use

        callAnalysis.studentName = analysis.student_name;
        callAnalysis.counsellorName = analysis.counsellor_name;
        callAnalysis.courseInterested = analysis.course_interested;
        callAnalysis.city = analysis.city;
        callAnalysis.sentiment = analysis.sentiment;
        callAnalysis.interested = analysis.interested;
        callAnalysis.followUpRequired = analysis.follow_up_required;
        callAnalysis.followUpDate = analysis.follow_up_date;
        callAnalysis.keyConcerns = analysis.key_concerns;
        callAnalysis.parentConcern = analysis.parent_concern;
        callAnalysis.feesIssue = analysis.fees_issue;
        callAnalysis.placementConcern = analysis.placement_concern;
        callAnalysis.timingConcern = analysis.timing_concern;
        callAnalysis.counsellorConfidenceScore = analysis.counsellor_confidence_score;
        callAnalysis.communicationScore = analysis.communication_quality_score;
        callAnalysis.engagementScore = analysis.student_engagement_score;
        callAnalysis.closingProbability = analysis.closing_probability;
        callAnalysis.leadScore = analysis.lead_score;
        callAnalysis.callSummary = analysis.call_summary;
        callAnalysis.processingTimeMs = processingTimeMs;
        callAnalysis.llmModel = GPT_MODEL;
        callAnalysis.sttModel = WHISPER_MODEL;
        callAnalysis.status = "completed";
        callAnalysis.errorMessage = null;

        await callAnalysis.save();

        // ────────────────────────────────────────────────────────
        // STEP 6 — Update AudioRecording status + Excel export
        // ────────────────────────────────────────────────────────
        await AudioRecording.findByIdAndUpdate(audioRecordingId, {
            status: "analysed",
        });

        let uploaderName = "";                              // FIX: declared outside try block

        try {
            const uploaderDoc = await User.findById(recording.uploadedBy)
                .select("fullName")
                .lean();
            uploaderName = uploaderDoc?.fullName || "";     // FIX: assignment not declaration
            await appendToExcel(callAnalysis, recording, uploaderName);
        } catch (excelErr) {
            console.error("⚠️  Excel export failed (non-fatal):", excelErr.message);
        }

        // Clean up the processed audio file to save disk space
        if (cleanFilePath) {
            cleanupProcessedFile(cleanFilePath);
        }

        // ────────────────────────────────────────────────────────
        // STEP 7 — Send auto-alert notifications
        // Non-blocking: errors are caught inside sendAnalysisAlerts
        // ────────────────────────────────────────────────────────
        const notifyUploaderName = uploaderName || "";
        sendAnalysisAlerts(callAnalysis, notifyUploaderName).catch((err) => {
            console.error("⚠️  Alert dispatch error (non-fatal):", err.message);
        });

        const elapsedSec = (processingTimeMs / 1000).toFixed(1);

        console.log(`\n${"─".repeat(60)}`);
        console.log(`✅ Pipeline complete in ${elapsedSec}s`);
        console.log(`   Sentiment: ${analysis.sentiment} | Lead Score: ${analysis.lead_score}/10`);
        console.log(`   Student: ${analysis.student_name || "N/A"} | Course: ${analysis.course_interested || "N/A"}`);
        console.log(`${"─".repeat(60)}\n`);

        return callAnalysis;

    } catch (error) {
        // ── Handle pipeline failure ───────────────────────────────
        console.error(`\n❌ Pipeline FAILED for ${audioRecordingId}:`, error.message);

        callAnalysis.status = "failed";
        callAnalysis.errorMessage = error.message;
        await callAnalysis.save();

        await AudioRecording.findByIdAndUpdate(audioRecordingId, {
            status: "failed",
        });

        throw error;
    }
}

// ─────────────────────────────────────────────────────────────────
// BATCH PROCESSOR — Process multiple recordings sequentially
// ─────────────────────────────────────────────────────────────────
async function processBatch(audioRecordingIds) {
    console.log(`\n🔄 Batch processing ${audioRecordingIds.length} recordings...\n`);

    const results = {
        successful: [],
        failed: [],
    };

    for (const id of audioRecordingIds) {
        try {
            const result = await processAudioRecording(id);
            results.successful.push({ id, leadScore: result.leadScore, sentiment: result.sentiment });
        } catch (error) {
            results.failed.push({ id, error: error.message });
        }
    }

    console.log(`\n📊 Batch complete: ${results.successful.length} succeeded, ${results.failed.length} failed\n`);
    return results;
}

module.exports = {
    processAudioRecording,
    processBatch,
    transcribeAudio,
    translateToEnglish,
    analyseTranscript,
};