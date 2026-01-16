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
  { label: "Classical / Instrumental", query: "instrumental classical music" }
];

const BACKEND_URL = "https://resonance-backend-5qgm.onrender.com";
const MAX_PAGES = 10;

function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [preference, setPreference] = useState<Preference | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const pageRef = useRef(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* Load preference */
  useEffect(() => {
    const saved = sessionStorage.getItem("music-preference");
    if (saved) setPreference(JSON.parse(saved));
  }, []);

  /* Initial fetch */
  useEffect(() => {
    if (!preference && !searchTerm) return;

    const query = searchTerm || preference?.query;
    if (!query) return;

    pageRef.current = 1;
    setHasMore(true);

    fetch(`${BACKEND_URL}/search?q=${encodeURIComponent(query)}&page=1`)
      .then((res) => res.json())
      .then((data: Track[]) => {
        setTracks(data);
        setQueueIndex(null);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
      })
      .catch(() => setTracks([]));
  }, [preference, searchTerm]);

  /* LOAD MORE — FIXED */
  const loadMore = () => {
    if (loadingMore || !hasMore) return;

    const query = searchTerm || preference?.query;
    if (!query) return;

    const nextPage = pageRef.current + 1;
    if (nextPage > MAX_PAGES) {
      setHasMore(false);
      return;
    }

    setLoadingMore(true);

    fetch(
      `${BACKEND_URL}/search?q=${encodeURIComponent(query)}&page=${nextPage}`
    )
      .then((res) => res.json())
      .then((data: Track[]) => {
        if (data.length === 0) {
          setHasMore(false);
          return;
        }

        // ✅ APPEND DIRECTLY (NO FILTERING)
        setTracks((prev) => [...prev, ...data]);

        pageRef.current = nextPage;
      })
      .finally(() => setLoadingMore(false));
  };

  /* Playback (unchanged) */
  const currentTrack = queueIndex !== null ? tracks[queueIndex] : null;

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
    if (queueIndex !== null && queueIndex < tracks.length - 1) {
      playAtIndex(queueIndex + 1);
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

  /* ONBOARDING (unchanged) */
  if (!preference) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div style={{ maxWidth: 700, width: "100%", padding: 24 }}>
          <h1>Choose your vibe</h1>
          <div style={{ display: "grid", gap: 16, marginTop: 24 }}>
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
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* MAIN APP */
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 160px" }}>
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
          color: "white"
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

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button onClick={loadMore}>
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}

      <PlayerBar
        track={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onTogglePlay={togglePlay}
        onSeek={seek}
        onNext={playNext}
        onPrev={playNext}
      />
    </div>
  );
}

export default App;
