import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Track } from "../types";

interface Props {
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (t: number) => void;
  onNext: () => void;
  onPrev: () => void;
}

const fmt = (t: number) =>
  `${Math.floor(t / 60)}:${Math.floor(t % 60)
    .toString()
    .padStart(2, "0")}`;

export default function PlayerBar({
  track,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
  onNext,
  onPrev,
}: Props) {
  if (!track) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        padding: 20,
        borderRadius: 22,
        background: "rgba(12,18,32,0.8)",
        backdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 -10px 40px rgba(0,0,0,0.6)",
      }}
    >
      {/* TOP */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <img
          src={track.albumArt}
          width={56}
          height={56}
          style={{ borderRadius: 12 }}
        />

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{track.title}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            {track.artist}
          </div>
        </div>

        <SkipBack onClick={onPrev} style={{ cursor: "pointer" }} />

        <button
          onClick={onTogglePlay}
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "#22d3ee",
            border: "none",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          {isPlaying ? <Pause /> : <Play />}
        </button>

        <SkipForward onClick={onNext} style={{ cursor: "pointer" }} />
      </div>

      {/* PROGRESS */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 12,
        }}
      >
        <span style={{ fontSize: 12 }}>{fmt(currentTime)}</span>

        <div
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            onSeek(((e.clientX - r.left) / r.width) * duration);
          }}
          style={{
            flex: 1,
            height: 6,
            background: "rgba(255,255,255,0.12)",
            borderRadius: 3,
          }}
        >
          <div
            style={{
              width: `${(currentTime / duration) * 100}%`,
              height: "100%",
              background: "#22d3ee",
              borderRadius: 3,
            }}
          />
        </div>

        <span style={{ fontSize: 12 }}>{fmt(duration)}</span>
      </div>
    </div>
  );
}
