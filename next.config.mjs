/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/library',
        destination: '/dashboard',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
