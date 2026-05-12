import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '1gb',
    },
    /** Dev / middleware proxy body limit (default ~10MB); large multipart uploads need this */
    middlewareClientMaxBodySize: '1gb',
  },
  async headers() {
    return [
      {
        source: '/api/files/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
