import type { NextConfig } from 'next';
const config: NextConfig = {
  transpilePackages: ['@lawprep/contracts'],
  skipTrailingSlashRedirect: true,
  async rewrites() { return [{ source: '/study/', destination: '/study/index.html' }]; },
  async headers() { return [{ source: '/:path*', headers: [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
  ] }]; }
};
export default config;
