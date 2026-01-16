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

  // pageRef prevents async/state races when resetting or incrementing page
  const pageRef = useRef(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* Load saved preference (session only) */
  useEffect(() => {
    const saved = sessionStorage.getItem("music-preference");
    if (saved) setPreference(JSON.parse(saved));
  }, []);

  /* Initial fetch for page 1 whenever preference or search changes */
  useEffect(() => {
    const query = searchTerm || preference?.query;
    if (!query) return;

    pageRef.current = 1;
    setHasMore(true);

    fetch(`${BACKEND_URL}/search?q=${encodeURIComponent(query)}&page=1`)
      .then((res) => res.json())
      .then((data: Track[]) => {
        // set fresh list (page 1)
        setTracks(data);
        setQueueIndex(null);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
      })
      .catch((err) => {
        console.error("Initial search failed:", err);
        setTracks([]);
      });
  }, [preference, searchTerm]);

  /* LOAD MORE (safe, user-clicked) */
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    const query = searchTerm || preference?.query;
    if (!query) return;

    const nextPage = pageRef.current + 1;
    if (nextPage > MAX_PAGES) {
      setHasMore(false);
      return;
    }

    setLoadingMore(true);

    try {
      const res = await fetch(
        `${BACKEND_URL}/search?q=${encodeURIComponent(query)}&page=${nextPage}`
      );
      const data: Track[] = await res.json();

      if (!data || data.length === 0) {
        setHasMore(false);
        return;
      }

      // Important: some backends return overlapping ids across pages.
      // To guarantee visible results we append items and make sure repeated ids
      // get turned into unique values for rendering only (so duplicates show).
      // We preserve all original metadata (title, previewUrl, etc).
      setTracks((prev) => {
        const existingIds = new Set(prev.map((t) => String((t as any).id)));
        const normalized: Track[] = data.map((t) => {
          const rawId = String((t as any).id);
          if (!existingIds.has(rawId)) {
            // no collision — return as-is
            return t;
          } else {
            // collision — create a stable synthetic id for this copy
            // keep all other fields identical. We cast to unknown then to Track
            const synthetic = { ...t, id: `${rawId}-p${nextPage}` } as unknown as Track;
            return synthetic;
          }
        });

        // Append directly (no filtering) so the user always sees the new results.
        return [...prev, ...normalized];
      });

      // update page ref only after successful append
      pageRef.current = nextPage;

      // if we've reached max pages, stop
      if (nextPage >= MAX_PAGES) setHasMore(false);
    } catch (err) {
      console.error("Load more failed:", err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  /* Playback logic (unchanged, uses index) */
  const currentTrack = queueIndex !== null ? tracks[queueIndex] : null;

  const playAtIndex = (index: number) => {
    const track = tracks[index];
    if (!track) return;

    audioRef.current?.pause();
    const audio = new Audio((track as any).previewUrl);
    audioRef.current = audio;

    audio
      .play()
      .catch((e) => {
        // autoplay may be blocked; handle gracefully
        console.warn("Playback failed to start:", e);
      });

    setQueueIndex(index);
    setIsPlaying(true);

    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onended = () => {
      if (index < tracks.length - 1) playAtIndex(index + 1);
      else setIsPlaying(false);
    };
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
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24
        }}
      >
        <h1 style={{ fontSize: 32 }}>Choose your vibe</h1>
        <p style={{ opacity: 0.6 }}>Music recommendations for this session</p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            maxWidth: 700,
            width: "100%",
            padding: 20
          }}
        >
          {PREFERENCES.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                sessionStorage.setItem("music-preference", JSON.stringify(p));
                setPreference(p);
              }}
              style={{
                padding: 20,
                borderRadius: 18,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "white",
                fontSize: 16,
                cursor: "pointer"
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* MAIN APP (unchanged layout) */
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
          color: "white",
          fontSize: 15,
          outline: "none"
        }}
      />

      <TrackList
        tracks={tracks}
        currentTrackId={currentTrack ? (currentTrack as any).id : null}
        isPlaying={isPlaying}
        onSelectTrack={(track) => {
          // Find the index of the selected track (id might be synthetic)
          const idx = tracks.findIndex((t) => String((t as any).id) === String((track as any).id));
          if (idx >= 0) playAtIndex(idx);
        }}
      />

      {hasMore && (
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            style={{
              padding: "12px 24px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.18)",
              color: "white",
              cursor: "pointer"
            }}
          >
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
        onNext={() => {
          if (queueIndex !== null && queueIndex < tracks.length - 1) playAtIndex(queueIndex + 1);
        }}
        onPrev={() => {
          if (queueIndex !== null && queueIndex > 0) playAtIndex(queueIndex - 1);
        }}
      />
    </div>
  );
}

export default App;
