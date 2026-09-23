export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
        <circle cx="13" cy="13" r="12" fill="none" stroke="var(--gold)" strokeOpacity="0.45" />
        <path
          d="M6 17 C9 9, 13 19, 20 8"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeDasharray="2.5 2.5"
        />
        <circle cx="6" cy="17" r="2" fill="var(--sand)" />
        <circle cx="20" cy="8" r="2.4" fill="var(--gold)" />
      </svg>
      <span className="font-display text-xl font-semibold tracking-wide text-sand">
        TRIP<span className="text-gold">YYY</span>
      </span>
    </span>
  );
}
