/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = {
        ...config.externals,
        pg: 'pg',
        'drizzle-orm/node-postgres': 'drizzle-orm/node-postgres',
      }
    }
    return config
  },
}

export default nextConfig
