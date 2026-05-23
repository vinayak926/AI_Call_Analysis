// frontend/src/components/AudioPlayer.jsx

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw } from "lucide-react";

export default function AudioPlayer({ src, fileName }) {
    const audioRef = useRef(null);
    const playPromiseRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onLoadedMetadata = () => setDuration(audio.duration);
        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onEnded = () => setIsPlaying(false);
        const onWaiting = () => setIsLoading(true);
        const onCanPlay = () => setIsLoading(false);
        const onError = () => {
            setError("Failed to load audio. The file may be missing or corrupted.");
            setIsLoading(false);
        };

        audio.addEventListener("loadedmetadata", onLoadedMetadata);
        audio.addEventListener("timeupdate", onTimeUpdate);
        audio.addEventListener("ended", onEnded);
        audio.addEventListener("waiting", onWaiting);
        audio.addEventListener("canplay", onCanPlay);
        audio.addEventListener("error", onError);

        return () => {
            audio.removeEventListener("loadedmetadata", onLoadedMetadata);
            audio.removeEventListener("timeupdate", onTimeUpdate);
            audio.removeEventListener("ended", onEnded);
            audio.removeEventListener("waiting", onWaiting);
            audio.removeEventListener("canplay", onCanPlay);
            audio.removeEventListener("error", onError);
        };
    }, [src]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            if (playPromiseRef.current) {
                playPromiseRef.current.then(() => { audio.pause(); }).catch(() => {});
            } else {
                audio.pause();
            }
            setIsPlaying(false);
        } else {
            playPromiseRef.current = audio.play();
            playPromiseRef.current
                .then(() => { setIsPlaying(true); playPromiseRef.current = null; })
                .catch((e) => {
                    if (e.name !== 'AbortError') setError('Playback was blocked by the browser.');
                    setIsPlaying(false);
                    playPromiseRef.current = null;
                });
        }
    };

    const handleSeek = (e) => {
        const audio = audioRef.current;
        if (!audio || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = x / rect.width;
        audio.currentTime = ratio * duration;
    };

    const handleVolumeChange = (e) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (audioRef.current) audioRef.current.volume = val;
        setIsMuted(val === 0);
    };

    const toggleMute = () => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const restart = () => {
        const audio = audioRef.current;
        if (!audio) return;
        const doRestart = () => {
            audio.currentTime = 0;
            playPromiseRef.current = audio.play();
            playPromiseRef.current
                .then(() => { setIsPlaying(true); playPromiseRef.current = null; })
                .catch((e) => {
                    if (e.name !== 'AbortError') setError('Playback was blocked by the browser.');
                    setIsPlaying(false);
                    playPromiseRef.current = null;
                });
        };
        if (playPromiseRef.current) {
            playPromiseRef.current.then(() => { audio.pause(); doRestart(); }).catch(() => { doRestart(); });
        } else {
            doRestart();
        }
    };

    const formatTime = (secs) => {
        if (!secs || isNaN(secs)) return "0:00";
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const progressPercent = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "20px 24px",
            width: "100%",
        }}>
            <audio ref={audioRef} src={src} preload="metadata" />

            {/* File name */}
            {fileName && (
                <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "14px", fontWeight: "500", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    🎵 {fileName}
                </p>
            )}

            {/* Error */}
            {error && (
                <p style={{ fontSize: "13px", color: "#dc2626", marginBottom: "12px" }}>{error}</p>
            )}

            {/* Progress bar */}
            <div
                onClick={handleSeek}
                style={{
                    height: "6px",
                    background: "#e2e8f0",
                    borderRadius: "999px",
                    cursor: "pointer",
                    marginBottom: "16px",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <div style={{
                    height: "100%",
                    width: `${progressPercent}%`,
                    background: "#3b82f6",
                    borderRadius: "999px",
                    transition: "width 0.1s linear",
                }} />
            </div>

            {/* Controls row */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {/* Restart */}
                <button onClick={restart} style={btnStyle} title="Restart">
                    <RotateCcw size={15} />
                </button>

                {/* Play / Pause */}
                <button
                    onClick={togglePlay}
                    disabled={!!error}
                    style={{
                        width: "40px", height: "40px", borderRadius: "50%",
                        background: error ? "#94a3b8" : "#1e293b",
                        color: "white", border: "none", cursor: error ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}
                    title={isPlaying ? "Pause" : "Play"}
                >
                    {isLoading
                        ? <span style={{ fontSize: "11px" }}>...</span>
                        : isPlaying
                            ? <Pause size={16} fill="white" />
                            : <Play size={16} fill="white" style={{ marginLeft: "2px" }} />}
                </button>

                {/* Time */}
                <span style={{ fontSize: "12px", color: "#64748b", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                {/* Spacer */}
                <div style={{ flex: 1 }} />

                {/* Mute toggle */}
                <button onClick={toggleMute} style={btnStyle} title={isMuted ? "Unmute" : "Mute"}>
                    {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>

                {/* Volume slider */}
                <input
                    type="range"
                    min="0" max="1" step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    style={{ width: "70px", accentColor: "#3b82f6", cursor: "pointer" }}
                />
            </div>
        </div>
    );
}

const btnStyle = {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#64748b",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px",
};