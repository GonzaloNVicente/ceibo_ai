import React from 'react';

/** Iconos del dashboard, trazados tal cual el diseño (stroke 24x24, sin dependencias). */
export type IconName =
  | 'chat' | 'check' | 'cart' | 'alert' | 'question' | 'slash'
  | 'clock' | 'coin' | 'bolt' | 'users' | 'userAlert' | 'trendUp'
  | 'chevDown' | 'chevRight' | 'close' | 'download' | 'refresh' | 'warn';

const PATHS: Record<IconName, React.ReactNode> = {
  chat: <path d="M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.4-5.6A8.5 8.5 0 1 1 21 12z" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  cart: <path d="M3 4h2.5l2.2 10.5h10.6L20.5 7H6.6M9.5 19.5h.01M17 19.5h.01" />,
  alert: <path d="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 7.5v5.5M12 16.5h.01" />,
  question: <path d="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17h.01" />,
  slash: <path d="M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM5.6 5.6l12.8 12.8" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  coin: <path d="M15.2 8.8c-.6-1-1.8-1.6-3.2-1.6-1.8 0-3.1.9-3.1 2.2 0 1.4 1.3 1.9 3.1 2.3 1.8.4 3.1.9 3.1 2.3 0 1.3-1.3 2.2-3.1 2.2-1.4 0-2.6-.6-3.2-1.6M12 5v2.2M12 16.8V19" />,
  bolt: <path d="M13 3L5 13.5h6L10 21l8-10.5h-6L13 3z" />,
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
      <path d="M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.5 14.6a5.5 5.5 0 0 1 3 4.9" />
    </>
  ),
  userAlert: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
      <path d="M18.5 7v5M18.5 15.5h.01" />
    </>
  ),
  trendUp: (
    <>
      <path d="M4 16l5.5-5.5 4 4L20 8" />
      <path d="M14.5 8H20v5.5" />
    </>
  ),
  chevDown: <path d="M6 9l6 6 6-6" />,
  chevRight: <path d="M9 6l6 6-6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  download: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 4v5h-5" />
    </>
  ),
  warn: (
    <>
      <path d="M10.3 4.2L2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" />
      <path d="M12 9.5v4.5M12 17h.01" />
    </>
  ),
};

export function Icon({ name, size = 16, stroke = 2.2 }: { name: IconName; size?: number; stroke?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flex: `0 0 ${size}px` }}
    >
      {PATHS[name]}
    </svg>
  );
}
