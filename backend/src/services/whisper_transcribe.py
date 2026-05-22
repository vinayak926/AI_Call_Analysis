import os
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

import sys
import json
import warnings
import logging
warnings.filterwarnings("ignore")
logging.disable(logging.WARNING)


def is_hallucination(text, full_text_parts, threshold=3):
    """Detect if a segment is a repetition hallucination."""
    if not text or len(text.strip()) <= 2:
        return True
    # If this exact phrase already appeared 3+ times, it's a loop
    if full_text_parts.count(text) >= threshold:
        return True
    # Urdu punctuation spam
    if text.count("۔") > 2:
        return True
    # Single repeated word/phrase detection
    words = text.strip().split()
    if len(words) >= 2 and len(set(words)) == 1:
        return True
    return False


def main():
    if len(sys.argv) < 2:
        out = json.dumps({"error": "No audio file path provided"})
        sys.stdout.buffer.write(out.encode("utf-8"))
        sys.stdout.buffer.write(b"\n")
        sys.exit(1)

    audio_path = sys.argv[1]

    try:
        from faster_whisper import WhisperModel

        # model = WhisperModel("medium", device="cpu", compute_type="int8")
        model = WhisperModel("large-v2", device="cpu", compute_type="int8")

        initial_prompt = (
            "Sales call recording in Hindi and English. "
            "Speakers: Sales Counsellor and Student. "
            "Topics: Data Science, Python, Full Stack, Digital Marketing, "
            "Machine Learning, MBA, courses, fees, placement, admissions. "
            "Names: Rahul, Priya, Ankit, Sneha, Amit, Neha, Pooja, Ravi."
        )

        segments_iter, info = model.transcribe(
            audio_path,
            beam_size=1,                      # Greedy — fastest, breaks hallucination loops
            best_of=1,
            initial_prompt=initial_prompt,
            # No hardcoded language — auto-detect handles Hindi+English mix
            vad_filter=True,                  # Skip silence chunks
            vad_parameters=dict(
                min_silence_duration_ms=500,
                speech_pad_ms=100,
            ),
            temperature=0.0,                  # Deterministic — no random sampling
            no_speech_threshold=0.8,          # Strict — skip low-speech segments
            compression_ratio_threshold=1.8,  # Strict — filter repetitive output
            condition_on_previous_text=False, # CRITICAL: breaks the repetition loop
            log_prob_threshold=-0.5,          # Skip very low confidence segments
        )

        segments = []
        full_text_parts = []
        hallucination_count = 0

        for seg in segments_iter:
            text = seg.text.strip()

            if is_hallucination(text, full_text_parts):
                hallucination_count += 1
                continue

            segments.append({
                "start": round(seg.start, 3),
                "end":   round(seg.end, 3),
                "text":  text,
            })
            full_text_parts.append(text)

        if hallucination_count > 0:
            sys.stderr.write(f"[whisper] Filtered {hallucination_count} hallucinated segments\n")

        result = {
            "originalText":     " ".join(full_text_parts),
            "detectedLanguage": info.language,
            "segments":         segments,
        }

        sys.stdout.buffer.write(json.dumps(result, ensure_ascii=False).encode("utf-8"))
        sys.stdout.buffer.write(b"\n")

    except Exception as e:
        import traceback
        err_detail = traceback.format_exc()
        sys.stderr.write(err_detail + "\n")
        out = json.dumps({"error": str(e), "traceback": err_detail})
        sys.stdout.buffer.write(out.encode("utf-8"))
        sys.stdout.buffer.write(b"\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
