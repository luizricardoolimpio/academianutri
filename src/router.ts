import { useEffect, useState } from 'preact/hooks';

export interface Route { path: string; params: Record<string, string> }

const PATTERNS: Array<[string, RegExp, string[]]> = [
  ['/treino/:date', /^\/treino\/(\d{4}-\d{2}-\d{2})$/, ['date']],
  ['/treinos/:exerciseId', /^\/treinos\/([\w-]+)$/, ['exerciseId']],
];

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/hoje';
  for (const [path, re, keys] of PATTERNS) {
    const m = raw.match(re);
    if (m) return { path, params: Object.fromEntries(keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
  }
  return { path: raw, params: {} };
}

export function navigate(hash: string): void {
  location.hash = hash.startsWith('#') ? hash : `#${hash}`;
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
