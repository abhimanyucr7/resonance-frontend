import { useEffect, useRef, useState } from "react";
import TrackList from "./components/TrackList";
import PlayerBar from "./components/PlayerBar";
import { Track } from "./types";

type Preference = {
  label: string;
  query: string;
};

const PREFERENCES: Preference[] = [
  { label: "English Pop", query: "english pop hits" },
  { label: "Hindi Bollywood", query: "hindi bollywood songs" },
  { label: "Tamil Hits", query: "tamil hit songs" },
  { label: "Lo-fi / Chill", query: "lofi chill beats" },
  { label: "Hip Hop", query: "hip hop popular" },
  { label: "Classical / Instrumental", query: "instrumental classical music" },
];

function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [preference, setPreference] = useState<Preference | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* 🔹 Load preference for THIS SESSION ONLY */
  useEffect(() => {
    const saved = sessionStorage.getItem("music-preference");
    if (saved) setPreference(JSON.parse(saved));
  }, []);

  /* 🔹 Fetch tracks when preference OR search changes */
  useEffect(() => {
    if (!preference && !searchTerm) return;

    const query = searchTerm || preference?.query;
    if (!query) return;

    fetch(`http://localhost:5000/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => {
        setTracks(data);
        setQueueIndex(null);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
      });
  }, [preference, searchTerm]);

  const currentTrack =
    queueIndex !== null ? tracks[queueIndex] : null;

  const playAtIndex = (index: number) => {
    const track = tracks[index];
    if (!track) return;

    audioRef.current?.pause();

    const audio = new Audio(track.previewUrl);
    audioRef.current = audio;

    audio.play();
    setQueueIndex(index);
    setIsPlaying(true);

    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onended = () => playNext();
  };

  const playNext = () => {
    if (queueIndex === null) return;
    if (queueIndex < tracks.length - 1) {
      playAtIndex(queueIndex + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const playPrev = () => {
    if (queueIndex === null) return;
    if (queueIndex > 0) {
      playAtIndex(queueIndex - 1);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const seek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  /* 🔹 ONBOARDING SCREEN */
  if (!preference) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <h1 style={{ fontSize: 28 }}>Choose your vibe</h1>
        <p style={{ opacity: 0.6 }}>
          Music recommendations for this session
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            maxWidth: 700,
            width: "100%",
            padding: 20,
          }}
        >
          {PREFERENCES.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                sessionStorage.setItem(
                  "music-preference",
                  JSON.stringify(p)
                );
                setPreference(p);
              }}
              style={{
                padding: 20,
                borderRadius: 18,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "white",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* 🔹 MAIN APP */
  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "24px 16px 160px",
      }}
    >
      {/* SEARCH BAR */}
      <input
        placeholder="Search songs, artists, moods..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: "100%",
          padding: "14px 18px",
          marginBottom: 20,
          borderRadius: 18,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "white",
          fontSize: 15,
          outline: "none",
        }}
      />

      <TrackList
        tracks={tracks}
        currentTrackId={currentTrack?.id ?? null}
        isPlaying={isPlaying}
        onSelectTrack={(track) =>
          playAtIndex(tracks.findIndex((t) => t.id === track.id))
        }
      />

      <PlayerBar
        track={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onTogglePlay={togglePlay}
        onSeek={seek}
        onNext={playNext}
        onPrev={playPrev}
      />
    </div>
  );
}

export default App;
