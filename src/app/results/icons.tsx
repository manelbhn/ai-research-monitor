type IconProps = {
  className?: string;
};

export function BackIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M15 6L9 12L15 18" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20L16 16" />
    </svg>
  );
}

export function FilterIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4 6H20L14 13V18L10 20V13L4 6Z" />
    </svg>
  );
}

export function TopicIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4 16L10 10L13 13L20 6" />
      <path d="M20 10V6H16" />
    </svg>
  );
}

export function GapIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 3A7 7 0 0 0 8 16V18H16V16A7 7 0 0 0 12 3Z" />
      <path d="M10 21H14" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="4" y="6" width="16" height="14" rx="2" />
      <path d="M8 4V8" />
      <path d="M16 4V8" />
      <path d="M4 10H20" />
    </svg>
  );
}

export function AnalyticsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M6 18V10" />
      <path d="M12 18V6" />
      <path d="M18 18V13" />
    </svg>
  );
}

export function RankIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="2.5" />
      <path d="M7 18C7 14.5 9.2 13 12 13C14.8 13 17 14.5 17 18" />
    </svg>
  );
}

export function SaveIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M7 5H17V20L12 17L7 20V5Z" />
    </svg>
  );
}

export function ShareIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="18" cy="5" r="2" />
      <circle cx="6" cy="12" r="2" />
      <circle cx="18" cy="19" r="2" />
      <path d="M8 12L16 6" />
      <path d="M8 12L16 18" />
    </svg>
  );
}

export function DocumentIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="7" y="4" width="10" height="16" rx="2" />
      <path d="M10 9H14" />
      <path d="M10 13H14" />
    </svg>
  );
}

export function TrendIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M5 16L10 11L13 14L19 8" />
      <path d="M19 12V8H15" />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="8" cy="8" r="2.5" />
      <circle cx="16" cy="8" r="2.5" />
      <path d="M4 18C4 15.5 5.7 14 8 14C10.3 14 12 15.5 12 18" />
      <path d="M12 18C12 15.5 13.7 14 16 14C18.3 14 20 15.5 20 18" />
    </svg>
  );
}

export function SuccessIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12L11 15L16 9" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M7 7L17 17" />
      <path d="M17 7L7 17" />
    </svg>
  );
}