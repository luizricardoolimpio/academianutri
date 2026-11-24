import { formatShort } from '../../domain/dates';

export interface Point { x: string; y: number }
const fmt = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');

/** Gráfico de linha em SVG puro; x = data (AAAA-MM-DD). */
export function LineChart({ title, points, unit, goal }: { title: string; points: Point[]; unit: string; goal?: number }) {
  const W = 320, H = 150, P = 28;
  const ys = points.map((p) => p.y).concat(goal !== undefined ? [goal] : []);
  const min = Math.min(...ys), max = Math.max(...ys);
  const span = max - min || 1;
  const sx = (i: number) => (points.length === 1 ? W / 2 : P + (i * (W - 2 * P)) / (points.length - 1));
  const sy = (v: number) => H - P - ((v - min) / span) * (H - 2 * P);
  const last = points.at(-1);
  const label = `${title}: ${points.length} ${points.length === 1 ? 'registro' : 'registros'}`;
  return (
    <figure class="card" style="margin:10px 0">
      <div class="row spread small">
        <strong>{title}</strong>
        {last && <span>{`${fmt(last.y)} ${unit}`}</span>}
      </div>
      <svg role="img" aria-label={label} viewBox={`0 0 ${W} ${H}`} style="width:100%;height:auto">
        {goal !== undefined && (
          <line x1={P} x2={W - P} y1={sy(goal)} y2={sy(goal)} stroke="var(--ok)" stroke-dasharray="5 4" stroke-width="1.5" />
        )}
        <polyline fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"
          points={points.map((p, i) => `${sx(i)},${sy(p.y)}`).join(' ')} />
        {points.map((p, i) => <circle key={p.x} cx={sx(i)} cy={sy(p.y)} r="3.5" fill="var(--accent)" />)}
        {points.length > 0 && (
          <>
            <text x={P} y={H - 6} font-size="10" fill="var(--muted)">{formatShort(points[0].x)}</text>
            {points.length > 1 && <text x={W - P} y={H - 6} font-size="10" fill="var(--muted)" text-anchor="end">{formatShort(points.at(-1)!.x)}</text>}
          </>
        )}
      </svg>
      {goal !== undefined && <figcaption class="small" style="color:var(--ok)">{`Meta: ${fmt(goal)} ${unit}`}</figcaption>}
    </figure>
  );
}
