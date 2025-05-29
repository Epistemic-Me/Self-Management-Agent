/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/profile/:path*',
        destination: 'http://localhost:8010/:path*',
      },
      {
        source: '/api/em/:path*',
        destination: 'http://localhost:8120/:path*',
      },
    ]
  },
}

module.exports = nextConfig 