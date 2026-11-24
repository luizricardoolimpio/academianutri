export function Scale({ label, value, onChange }: { label: string; value: number | undefined; onChange: (v: number) => void }) {
  return (
    <div>
      <div class="small muted">{label}</div>
      <div class="scale" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} aria-label={`${label}: ${n}`} aria-pressed={value === n} onClick={() => onChange(n)}>{n}</button>
        ))}
      </div>
    </div>
  );
}
