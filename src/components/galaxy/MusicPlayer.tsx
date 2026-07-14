import { useEffect, useRef, useState } from "react";
import { Music, Pause } from "lucide-react";

/** Floating lo-fi piano music toggle. Uploads an mp3 into public/audio/lofi.mp3 to enable. */
export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [hasSource, setHasSource] = useState(true);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onError = () => setHasSource(false);
    el.addEventListener("error", onError);
    return () => el.removeEventListener("error", onError);
  }, []);

  const toggle = async () => {
    const el = audioRef.current;
    if (!el) return;
    try {
      if (playing) { el.pause(); setPlaying(false); }
      else { await el.play(); setPlaying(true); }
    } catch {
      setHasSource(false);
    }
  };

  return (
    <>
      <audio ref={audioRef} src="/audio/lofi.mp3" loop preload="none" />
      <button
        onClick={toggle}
        aria-label={playing ? "Pause music" : "Play lo-fi music"}
        className="glass fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full text-primary transition-all hover:scale-110 hover:glow"
      >
        {playing ? <Pause className="h-5 w-5" /> : <Music className="h-5 w-5" />}
        {!hasSource && (
          <span className="absolute -top-2 -right-2 rounded-full bg-accent px-1.5 py-0.5 text-[9px] text-accent-foreground">
            add mp3
          </span>
        )}
      </button>
    </>
  );
}
