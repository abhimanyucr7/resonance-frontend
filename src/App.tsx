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

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);

  /* Restore preference */
  useEffect(() => {
    const saved = sessionStorage.getItem("music-preference");
    if (saved) setPreference(JSON.parse(saved));
  }, []);

  /* Reset on new search / preference */
  useEffect(() => {
    setTracks([]);
    setPage(1);
    setHasMore(true);
    setQueueIndex(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [preference, searchTerm]);

  /* Fetch tracks */
  useEffect(() => {
    const query = searchTerm || preference?.query;
    if (!query || !hasMore || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);

    fetch(
      `${BACKEND_URL}/search?q=${encodeURIComponent(query)}&page=${page}`
    )
      .then((res) => res.json())
      .then((data: Track[]) => {
        if (data.length === 0 || page >= MAX_PAGES) {
          setHasMore(false);
          return;
        }

        setTracks((prev) => {
          const ids = new Set(prev.map((t) => t.id));
          const unique = data.filter((t) => !ids.has(t.id));
          return [...prev, ...unique];
        });
      })
      .catch(() => setHasMore(false))
      .finally(() => {
        setLoading(false);
        isFetchingRef.current = false;
      });
  }, [page, preference, searchTerm, hasMore]);

  /* ✅ SAFE Infinite Scroll */
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingRef.current) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore]);

  /* Playback logic (unchanged) */
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

  const playPrev = () => {
    if (queueIndex !== null && queueIndex > 0) {
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

  /* ONBOARDING */
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

      {hasMore && <div ref={loadMoreRef} style={{ height: 1 }} />}

      {loading && (
        <p style={{ textAlign: "center", opacity: 0.6 }}>
          Loading more songs…
        </p>
      )}

      {!hasMore && (
        <p style={{ textAlign: "center", opacity: 0.5 }}>
          End of recommendations
        </p>
      )}

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
