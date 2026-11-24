import { useEffect, useState } from 'preact/hooks';

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/** Contagem regressiva do descanso; reinicia quando `startedAt` muda. */
export function RestTimer({ seconds, startedAt, onClose }: { seconds: number; startedAt: number; onClose: () => void }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    setLeft(seconds);
    const end = startedAt + seconds * 1000;
    const id = setInterval(() => {
      const l = Math.max(0, Math.round((end - Date.now()) / 1000));
      setLeft(l);
      if (l === 0) {
        clearInterval(id);
        navigator.vibrate?.([200, 100, 200]);
      }
    }, 250);
    return () => clearInterval(id);
  }, [seconds, startedAt]);
  return (
    <div class="card row spread" style={{ background: left === 0 ? 'color-mix(in srgb, var(--ok) 18%, var(--surface))' : undefined }}>
      <span>⏱ Descanso <strong class="big" role="timer" aria-live="off">{fmt(left)}</strong></span>
      <button class="btn secondary small" onClick={onClose}>{left === 0 ? 'Bora!' : 'Pular'}</button>
    </div>
  );
}
