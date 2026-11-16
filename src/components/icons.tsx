type P = { size?: number };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const IconHome = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path {...base} d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-5v-6h-4v6H5a1 1 0 01-1-1z" /></svg>
);
export const IconUsers = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><circle {...base} cx="9" cy="8" r="3.5" /><path {...base} d="M2.5 20c.5-3.5 3.2-5.5 6.5-5.5s6 2 6.5 5.5M16 4.8a3.5 3.5 0 010 6.4M18 14.8c2 .6 3.3 2.4 3.5 5.2" /></svg>
);
export const IconVote = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path {...base} d="M4 14h16v6H4zM8 14l-2-3h12l-2 3M9 8l2.5 2.5L16 6" /></svg>
);
export const IconBack = ({ size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path {...base} strokeWidth={2.4} d="M15 6l-6 6 6 6" /></svg>
);
export const IconShield = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path {...base} d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /><path {...base} d="M9 12l2 2 4-4" /></svg>
);
export const IconInfo = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><circle {...base} cx="12" cy="12" r="9" /><path {...base} strokeWidth={2.4} d="M12 11v5M12 8h.01" /></svg>
);
export const IconChart = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path {...base} d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
);
export const IconCal = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><rect {...base} x="3" y="5" width="18" height="16" rx="3" /><path {...base} d="M3 10h18M8 3v4M16 3v4" /></svg>
);
export const IconFile = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path {...base} d="M6 3h8l5 5v13H6zM14 3v5h5M9 13h7M9 17h5" /></svg>
);
export const IconLog = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><circle {...base} cx="12" cy="12" r="9" /><path {...base} d="M12 7v5l3 2" /></svg>
);
export const IconDownload = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path {...base} d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
);
export const IconFullscreen = ({ size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path {...base} strokeWidth={2.2} d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
);
export const IconExitFullscreen = ({ size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path {...base} strokeWidth={2.2} d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>
);
export const IconLogout = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path {...base} d="M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4M16 8l4 4-4 4M20 12H9" /></svg>
);
export const IconChevron = ({ size = 16 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path {...base} strokeWidth={2.4} d="M6 9l6 6 6-6" /></svg>
);
export const IconCheck = ({ size = 16 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path {...base} strokeWidth={2.6} d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);
export const IconClose = ({ size = 16 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path {...base} strokeWidth={2.4} d="M6 6l12 12M18 6L6 18" /></svg>
);
export const IconAlert = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path {...base} d="M12 3l10 18H2L12 3z" /><path {...base} strokeWidth={2.4} d="M12 10v5M12 18h.01" /></svg>
);
export const IconGoogle = ({ size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);
