import type { ScheduleItem } from '../../domain/schedule';

const ICON: Record<ScheduleItem['kind'], string> = {
  meal: '🍽️', supplement: '💊', training: '🏋️', volley: '🏐', water: '💧', wellness: '🙂',
};

export function CheckItem({ item, done, onToggle }: { item: ScheduleItem; done: boolean; onToggle: () => void }) {
  return (
    <label class={done ? 'check-item done' : 'check-item'}>
      <input type="checkbox" checked={done} onChange={onToggle} />
      <span class="time">{item.time}</span>
      <span aria-hidden="true">{ICON[item.kind]}</span>
      <span class="title">
        {item.title}
        {item.detail && <span class="muted small"> · {item.detail}</span>}
      </span>
    </label>
  );
}
