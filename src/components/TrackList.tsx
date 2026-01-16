import { Play, Pause } from "lucide-react";
import { Track } from "../types";

interface TrackListProps {
  tracks: Track[];
  currentTrackId: number | null;
  isPlaying: boolean;
  onSelectTrack: (track: Track) => void;
}

const TrackList = ({
  tracks,
  currentTrackId,
  isPlaying,
  onSelectTrack,
}: TrackListProps) => {
  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        paddingBottom: 140,
      }}
    >
      {tracks.map((track, index) => {
        const isActive = track.id === currentTrackId;

        return (
          <div
            key={track.id}
            onClick={() => onSelectTrack(track)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "18px 22px",
              marginBottom: 10,
              borderRadius: 18,
              cursor: "pointer",

              background: isActive
                ? "linear-gradient(90deg, rgba(34,211,238,0.18), rgba(15,23,42,0.75))"
                : "rgba(255,255,255,0.03)",

              border: "1px solid rgba(255,255,255,0.08)",

              boxShadow: isActive
                ? "0 0 0 1px rgba(34,211,238,0.25), 0 12px 30px rgba(34,211,238,0.15)"
                : "0 8px 24px rgba(0,0,0,0.45)",

              transform: "translateY(0)",
              transition:
                "transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
            }}
          >
            {/* Index */}
            <div
              style={{
                width: 24,
                textAlign: "center",
                fontSize: 13,
                opacity: 0.6,
              }}
            >
              {index + 1}
            </div>

            {/* Album Art */}
            <img
              src={track.albumArt}
              width={54}
              height={54}
              style={{
                borderRadius: 12,
                objectFit: "cover",
                boxShadow: isActive
                  ? "0 0 20px rgba(34,211,238,0.35)"
                  : "0 6px 18px rgba(0,0,0,0.5)",
                transition: "box-shadow 0.2s ease",
              }}
            />

            {/* Track Info */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: 0.3,
                }}
              >
                {track.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.7,
                  marginTop: 3,
                }}
              >
                {track.artist}
              </div>
            </div>

            {/* Play / Pause */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: isActive
                  ? "rgba(34,211,238,0.18)"
                  : "rgba(255,255,255,0.06)",
                transition: "background 0.15s ease",
              }}
            >
              {isActive && isPlaying ? (
                <Pause size={18} color="#22d3ee" />
              ) : (
                <Play
                  size={18}
                  color={isActive ? "#22d3ee" : "#9ca3af"}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TrackList;
