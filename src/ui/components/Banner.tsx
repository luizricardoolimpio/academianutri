import type { ComponentChildren } from 'preact';

export function Banner({ children, tone = 'warn' }: { children: ComponentChildren; tone?: 'warn' | 'info' }) {
  return <div class={tone === 'info' ? 'banner info' : 'banner'} role="status">{children}</div>;
}
