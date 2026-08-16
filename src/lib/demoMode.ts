/** True when the app is built/served as a public read-only demo (VITE_DEMO_MODE=true at build time). */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
