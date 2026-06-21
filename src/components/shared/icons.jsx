/* Inline SVG icons. Hand-tuned line glyphs in the manuscript register —
   no icon-library dependency. Stroke inherits currentColor. */

export function BrandMark() {
  // An illuminated rosette (şemse) abstracted to a few strokes + a gold core.
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="21" fill="none" stroke="var(--gold)" strokeWidth="1.2" opacity="0.7" />
      <circle cx="24" cy="24" r="15.5" fill="none" stroke="var(--lapis)" strokeWidth="1.1" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line
          key={a}
          x1="24" y1="24"
          x2={24 + 15.5 * Math.cos((a * Math.PI) / 180)}
          y2={24 + 15.5 * Math.sin((a * Math.PI) / 180)}
          stroke="var(--sepia)" strokeWidth="0.8" opacity="0.55"
        />
      ))}
      <circle cx="24" cy="24" r="6.5" fill="var(--gold)" opacity="0.92" />
      <circle cx="24" cy="24" r="2.4" fill="var(--paper2)" />
    </svg>
  );
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const Icons = {
  pano: (p) => (
    <svg viewBox="0 0 24 24" className={p?.className} {...stroke}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  harita: (p) => (
    <svg viewBox="0 0 24 24" className={p?.className} {...stroke}>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  ),
  zaman: (p) => (
    <svg viewBox="0 0 24 24" className={p?.className} {...stroke}>
      <path d="M3 12h18" />
      <circle cx="7" cy="12" r="2" /><circle cx="13" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
      <path d="M7 8V6M13 16v2M19 8V6" />
    </svg>
  ),
  kavram: (p) => (
    <svg viewBox="0 0 24 24" className={p?.className} {...stroke}>
      <circle cx="6" cy="7" r="2.5" /><circle cx="18" cy="6" r="2.5" />
      <circle cx="17" cy="17" r="2.5" /><circle cx="7" cy="17" r="2.5" />
      <path d="M8.2 8.4 15.5 7M16.8 8.2 17 14.6M15.2 17.8 9.3 17.4M7 14.6 6.4 9.3M8.6 15.6 16 8.4" />
    </svg>
  ),
  silsile: (p) => (
    <svg viewBox="0 0 24 24" className={p?.className} {...stroke}>
      <circle cx="12" cy="4" r="2" /><circle cx="5" cy="13" r="2" />
      <circle cx="12" cy="13" r="2" /><circle cx="19" cy="13" r="2" />
      <circle cx="12" cy="21" r="2" />
      <path d="M12 6v5M11 5.5 6 11.5M13 5.5 18 11.5M12 15v4" />
    </svg>
  ),
  kulliyat: (p) => (
    <svg viewBox="0 0 24 24" className={p?.className} {...stroke}>
      <path d="M4 5a1 1 0 0 1 1-1h6v16H5a1 1 0 0 1-1-1V5Z" />
      <path d="M20 5a1 1 0 0 0-1-1h-6v16h6a1 1 0 0 0 1-1V5Z" />
      <path d="M7 8h2M7 11h2M15 8h2M15 11h2" />
    </svg>
  ),
  rehber: (p) => (
    <svg viewBox="0 0 24 24" className={p?.className} {...stroke}>
      <path d="M4 5h16v11H9l-4 3v-3H4V5Z" />
      <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" />
    </svg>
  ),
  intertext: (p) => (
    <svg viewBox="0 0 24 24" className={p?.className} {...stroke}>
      <circle cx="8.5" cy="12" r="5" />
      <circle cx="15.5" cy="12" r="5" />
      <circle cx="5" cy="5" r="1.4" /><circle cx="19" cy="5" r="1.4" /><circle cx="19" cy="19" r="1.4" /><circle cx="5" cy="19" r="1.4" />
    </svg>
  ),
  search: (p) => (
    <svg viewBox="0 0 24 24" className={p?.className} {...stroke}>
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
    </svg>
  ),
  close: (p) => (
    <svg viewBox="0 0 24 24" className={p?.className} {...stroke}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  arrow: (p) => (
    <svg viewBox="0 0 24 24" className={p?.className} {...stroke}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  flame: (p) => (
    <svg viewBox="0 0 24 24" className={p?.className} {...stroke}>
      <path d="M12 3c1 3-2 4-2 7a3 3 0 0 0 6 0c0-1-.5-2-1-2.5C16 11 18 13 18 16a6 6 0 0 1-12 0c0-4 4-6 6-13Z" />
    </svg>
  ),
};
