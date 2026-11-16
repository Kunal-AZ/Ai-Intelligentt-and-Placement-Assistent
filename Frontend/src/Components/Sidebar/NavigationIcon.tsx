import type { ReactNode } from 'react';

/** Consistent navigation artwork; routes and actions stay in their owning components. */
export function NavigationIcon({ path }: { path: string }) {
  const shapes: Record<string, ReactNode> = {
    '/dashboard': <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" /></>,
    '/resume': <><path d="M14 3H5v18h14V8Z" /><path d="M14 3v5h5M8 12h8M8 16h6" /></>,
    '/skills': <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><path d="m9 12 2 2 4-4" /></>,
    '/jobs': <><rect x="3" y="7" width="18" height="14" rx="3" /><path d="M8 7V4h8v3M3 12a24 24 0 0 0 18 0M10 12v3h4v-3" /></>,
    '/applications': <><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M3 9h18M9 9v12M15 9v12M6 2v4M18 2v4" /></>,
    '/interviews': <><rect x="9" y="2" width="6" height="13" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8" /></>,
    '/roadmap': <><circle cx="5" cy="5" r="2" /><circle cx="19" cy="19" r="2" /><path d="M7 5h9a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h9" /></>,
    '/chat': <><path d="M21 12a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4Z" /><path d="m12 6 1.5 4.5L18 12l-4.5 1.5L12 18l-1.5-4.5L6 12l4.5-1.5Z" /></>,
    '/profile': <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
    '/settings': <><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="3" fill="var(--bg-surface)" /><circle cx="15" cy="17" r="3" fill="var(--bg-surface)" /></>,
    '/plans': <><path d="m12 3 9 6-9 12L3 9Z M3 9h18M8 9l4 12 4-12M8 9l4-6 4 6" /></>,
  };
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[path]}</svg>;
}
