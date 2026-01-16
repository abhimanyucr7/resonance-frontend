import "./App.css";

type Song = {
  title: string;
  artist: string;
  cover: string;
};

const songs: Song[] = [
  {
    title: "Kiss from a Rose",
    artist: "Seal",
    cover:
      "https://i.scdn.co/image/ab67616d00001e02b6f7cbe3d94fca7fa8c1f6b7",
  },
  {
    title: "Break It Off",
    artist: "PinkPantheress",
    cover:
      "https://i.scdn.co/image/ab67616d00001e025d3c44b0e8f63c19e78146ee",
  },
  {
    title: "We Will Rock You",
    artist: "Queen",
    cover:
      "https://i.scdn.co/image/ab67616d00001e02c54f8c4c3a0e64e6f2b7e03d",
  },
  {
    title: "Send My Love (To Your New Lover)",
    artist: "Adele",
    cover:
      "https://i.scdn.co/image/ab67616d00001e02d9d6fca14d2f4a3d2b04f6fa",
  },
  {
    title: "New Rules",
    artist: "Dua Lipa",
    cover:
      "https://i.scdn.co/image/ab67616d00001e02b2e9e8cb3c70d9d0c1a4a9e1",
  },
  {
    title: "Wait a Minute!",
    artist: "WILLOW",
    cover:
      "https://i.scdn.co/image/ab67616d00001e024bc8b1c66f0cbbcc52f3c7e5",
  },
];

function App() {
  return (
    <div className="app">
      <input
        className="search-input"
        placeholder="Search songs, artists, moods..."
      />

      {songs.map((song, index) => (
        <div className="song-card" key={index}>
          <div className="song-left">
            <div className="song-index">{index + 1}</div>
            <img
              src={song.cover}
              alt={song.title}
              className="album-art"
            />
            <div>
              <div className="song-title">{song.title}</div>
              <div className="song-artist">{song.artist}</div>
            </div>
          </div>

          <button className="play-btn">▶</button>
        </div>
      ))}
    </div>
  );
}

export default App;
