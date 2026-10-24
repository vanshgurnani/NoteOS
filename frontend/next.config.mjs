import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawBackendUrl = (
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000'
).trim().replace(/\/$/, '');

const backendUrl =
  rawBackendUrl.startsWith('http://') || rawBackendUrl.startsWith('https://')
    ? rawBackendUrl
    : `https://${rawBackendUrl}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/.well-known/:path*',
        destination: `${backendUrl}/.well-known/:path*`,
      },
      {
        source: '/oauth/:path*',
        destination: `${backendUrl}/oauth/:path*`,
      },
    ];
  },
};

export default nextConfig;
