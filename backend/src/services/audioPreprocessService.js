// backend/src/services/audioPreprocessService.js
// ─────────────────────────────────────────────────────────────────
// Audio preprocessing pipeline using fluent-ffmpeg + ffmpeg-static
//
// What this does before Whisper transcription:
//   1. Validates the file exists and is a supported format
//   2. Extracts audio duration (stored on the AudioRecording model)
//   3. Converts any format (M4A, WAV, OGG, WEBM) → MP3 at 16kHz mono
//      (Whisper works best with 16kHz mono MP3)
//   4. Applies noise reduction using ffmpeg's highpass + lowpass filters
//   5. Normalises audio volume (loudnorm filter)
//   6. Returns the path to the cleaned MP3 file
//
// The original uploaded file is NOT deleted — the cleaned file is
// saved alongside it with a "_clean.mp3" suffix.
//
// Usage (called from analysisWorker.js before transcription):
//   const { preprocessAudio } = require("./audioPreprocessService");
//   const { cleanPath, durationSeconds } = await preprocessAudio(filePath);
// ─────────────────────────────────────────────────────────────────

const path = require("path");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");

// Point fluent-ffmpeg at the static binary bundled by ffmpeg-static
ffmpeg.setFfmpegPath(ffmpegPath);

// ── Supported input formats ───────────────────────────────────────
const SUPPORTED_EXTENSIONS = [".mp3", ".wav", ".m4a", ".ogg", ".webm"];

// ─────────────────────────────────────────────────────────────────
// getDuration — returns audio duration in seconds using ffprobe
// ─────────────────────────────────────────────────────────────────
function getDuration(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                // Non-fatal — return 0 if probe fails
                console.warn("⚠️  ffprobe failed (duration will be 0):", err.message);
                return resolve(0);
            }
            const duration = metadata?.format?.duration || 0;
            resolve(Math.round(duration));
        });
    });
}

// ─────────────────────────────────────────────────────────────────
// convertAndClean — runs the ffmpeg processing pipeline
//
// Filters applied:
//   highpass=f=200   — removes low-frequency rumble / mic handling noise
//   lowpass=f=3000   — removes high-frequency hiss above voice range
//   loudnorm         — normalises loudness to broadcast standard (EBU R128)
//
// Output: 16kHz mono MP3 (ideal for Whisper)
// ─────────────────────────────────────────────────────────────────
function convertAndClean(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            // ── Audio filters ────────────────────────────────────
            .audioFilters([
                "highpass=f=200",       // cut low rumble
                "lowpass=f=3000",       // cut high hiss
                "loudnorm",             // normalise volume
            ])
            // ── Output settings ──────────────────────────────────
            .audioFrequency(16000)      // 16kHz — Whisper sweet spot
            .audioChannels(1)           // mono
            .audioBitrate("64k")        // compact but sufficient for speech
            .format("mp3")
            .output(outputPath)
            // ── Events ───────────────────────────────────────────
            .on("start", (cmd) => {
                console.log("  🎛️  ffmpeg started:", cmd.slice(0, 80) + "...");
            })
            .on("end", () => {
                console.log(`  ✅ Preprocessing done → ${path.basename(outputPath)}`);
                resolve();
            })
            .on("error", (err) => {
                console.error("  ❌ ffmpeg error:", err.message);
                reject(err);
            })
            .run();
    });
}

// ─────────────────────────────────────────────────────────────────
// preprocessAudio — main exported function
//
// @param  {string} filePath  — absolute or relative path to uploaded audio
// @returns {Object}
//   cleanPath       {string}  — path to the processed MP3 file
//   durationSeconds {number}  — audio duration in seconds
//   wasConverted    {boolean} — true if ffmpeg ran, false if skipped
// ─────────────────────────────────────────────────────────────────
async function preprocessAudio(filePath) {
    const absolutePath = path.resolve(filePath);

    // ── Step 1: Validate file exists ─────────────────────────────
    if (!fs.existsSync(absolutePath)) {
        throw new Error(`Audio file not found for preprocessing: ${absolutePath}`);
    }

    const ext = path.extname(absolutePath).toLowerCase();

    // ── Step 2: Validate format ───────────────────────────────────
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        throw new Error(
            `Unsupported audio format: "${ext}". Supported: ${SUPPORTED_EXTENSIONS.join(", ")}`
        );
    }

    console.log(`\n  🎵 [Preprocess] Input: ${path.basename(absolutePath)}`);

    // ── Step 3: Get duration ──────────────────────────────────────
    const durationSeconds = await getDuration(absolutePath);
    console.log(`  ⏱️  Duration: ${durationSeconds}s`);

    // ── Step 4: Build output path ─────────────────────────────────
    // Save cleaned file in the same directory as the original,
    // with "_clean.mp3" suffix so it's easy to identify
    const dir = path.dirname(absolutePath);
    const baseName = path.basename(absolutePath, ext);
    const cleanPath = path.join(dir, `${baseName}_clean.mp3`);

    // ── Step 5: Skip if clean file already exists and is valid ──
    const cleanFileExists = fs.existsSync(cleanPath);
    const cleanFileSize = cleanFileExists ? fs.statSync(cleanPath).size : 0;
    if (cleanFileExists && cleanFileSize > 10240) {
        console.log("  ⏭️  Clean file already exists and valid — skipping ffmpeg");
        return { cleanPath, durationSeconds, wasConverted: false };
    }
    if (cleanFileExists && cleanFileSize <= 10240) {
        console.log("  ⚠️  Clean file found but appears corrupt — reprocessing...");
        fs.unlinkSync(cleanPath);
    }

    // ── Step 6: Run ffmpeg preprocessing ─────────────────────────
    console.log(`  🔧 Processing → ${path.basename(cleanPath)}`);
    await convertAndClean(absolutePath, cleanPath);

    // ── Step 7: Verify output was created ────────────────────────
    if (!fs.existsSync(cleanPath)) {
        throw new Error("ffmpeg ran but output file was not created.");
    }

    const inputSizeMB = (fs.statSync(absolutePath).size / 1024 / 1024).toFixed(2);
    const outputSizeMB = (fs.statSync(cleanPath).size / 1024 / 1024).toFixed(2);
    console.log(`  📦 Size: ${inputSizeMB}MB → ${outputSizeMB}MB`);

    return { cleanPath, durationSeconds, wasConverted: true };
}

// ─────────────────────────────────────────────────────────────────
// cleanupProcessedFile — deletes the _clean.mp3 after analysis
// Call this optionally if you want to save disk space
// ─────────────────────────────────────────────────────────────────
function cleanupProcessedFile(cleanPath) {
    try {
        if (fs.existsSync(cleanPath)) {
            fs.unlinkSync(cleanPath);
            console.log(`  🗑️  Cleaned up: ${path.basename(cleanPath)}`);
        }
    } catch (err) {
        console.warn("⚠️  Could not delete clean file:", err.message);
    }
}

module.exports = { preprocessAudio, cleanupProcessedFile };