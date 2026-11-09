export type Platform = { apiBaseUrl: string; now(): Date };
export function browserPlatform(): Platform {
  return { apiBaseUrl: import.meta.env.VITE_API_BASE_URL || new URL('/api/v1/', window.location.origin).href, now: () => new Date() };
}
