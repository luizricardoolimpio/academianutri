import { useState } from 'preact/hooks';
import type { ScheduleItem } from '../../domain/schedule';

const ICON: Record<ScheduleItem['kind'], string> = {
  meal: '🍽️', supplement: '💊', training: '🏋️', volley: '🏐', water: '💧', wellness: '🙂',
};

export function CheckItem({ item, done, onToggle, options }: { item: ScheduleItem; done: boolean; onToggle: () => void; options?: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div class="check-wrap">
      <div class="row" style="gap:0">
        <label class={done ? 'check-item done' : 'check-item'} style="flex:1;border-bottom:0">
          <input type="checkbox" checked={done} onChange={onToggle} />
          <span class="time">{item.time}</span>
          <span aria-hidden="true">{ICON[item.kind]}</span>
          <span class="title">
            {item.title}
            {item.detail && <span class="muted small"> · {item.detail}</span>}
          </span>
        </label>
        {options && (
          <button type="button" class="icon-btn" aria-label={`Opções: ${item.title}`} aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? '▴' : '▾'}
          </button>
        )}
      </div>
      {open && options && <ul class="small" style="margin:0 12px 10px 48px;padding-left:16px">{options.map((o) => <li key={o}>{o}</li>)}</ul>}
    </div>
  );
}
