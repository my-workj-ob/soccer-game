/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Silence Turbopack warning & ensure smooth compatibility with Vercel builds
  turbopack: {},
  // Transpile Three.js and Rapier WASM cleanly across Cloud Serverless containers
  transpilePackages: [
    '@react-three/fiber',
    '@react-three/drei',
    '@react-three/rapier',
    'three',
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = {
        ...config.externals,
        pg: 'pg',
        'drizzle-orm/node-postgres': 'drizzle-orm/node-postgres',
      }
    } else {
      // Avoid server-side evaluating canvas / WebGL WebAssembly bindings in cloud workers
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        path: false,
      }
    }
    return config
  },
}

export default nextConfig
