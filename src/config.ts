/**
 * API base URL.
 * - Development (npm run dev): http://localhost:3000
 * - Production (npm run build): https://orderlyai.fishwebsite.com
 * Override with VITE_API_BASE_URL in .env or .env.[mode].
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? 'https://orderlyai.fishwebsite.com' : 'http://localhost:3000');
