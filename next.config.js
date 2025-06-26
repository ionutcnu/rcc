/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: process.env.NODE_ENV === 'production',
    eslint: {
        ignoreDuringBuilds: true,
        dirs: ['src'],
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // Disable source maps in production
    devIndicators: false,
    productionBrowserSourceMaps: false,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
            },
            {
                protocol: 'https',
                hostname: 'storage.googleapis.com',
            },
        ],
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 86400,
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        dangerouslyAllowSVG: false,
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
    // Compress output
    compress: true,
    // Performance optimizations
    experimental: {
        optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
    },
    // Turbopack configuration (now stable)
    turbopack: {
        rules: {
            '*.svg': {
                loaders: ['@svgr/webpack'],
                as: '*.js',
            },
        },
    },
    // Static optimization
    trailingSlash: false,
    output: 'standalone',
    // Add security headers
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value:
                          "default-src 'self'; " +
                          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com; " +
                          "connect-src 'self' https://firebasestorage.googleapis.com https://identitytoolkit.googleapis.com https://www.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://*.google-analytics.com https://region1.google-analytics.com; " +
                          "img-src 'self' data: https://firebasestorage.googleapis.com; " +
                          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                          "font-src 'self' data: https://fonts.gstatic.com; " +
                          "frame-src 'self'",
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "X-XSS-Protection",
                        value: "1; mode=block",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=()",
                    },
                ],
            },
            // Special headers for PDF files to allow them to be embedded
            {
                source: "/Documents/:path*",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "SAMEORIGIN",
                    },
                    {
                        key: "Content-Disposition",
                        value: "inline",
                    },
                ],
            },
        ]
    },
    // Configure webpack for production
    webpack: (config, { dev, isServer }) => {
        // Only run in production client-side build
        if (!dev && !isServer) {
            // Remove console statements in production
            config.optimization.minimizer.forEach((minimizer) => {
                if (minimizer.constructor.name === "TerserPlugin") {
                    minimizer.options.terserOptions.compress.drop_console = true
                }
            })
        }

        // Fix for "Module not found: Can't resolve 'net'" error
        if (!isServer) {
            // Provide empty modules for Node.js built-in modules when used on the client side
            config.resolve.fallback = {
                ...config.resolve.fallback,
                net: false,
                tls: false,
                fs: false,
                dns: false,
                child_process: false,
                http2: false,
                path: false,
                os: false,
                crypto: false,
                stream: false,
                http: false,
                https: false,
                zlib: false,
                util: false,
                url: false,
                querystring: false,
                buffer: false,
                assert: false,
                constants: false,
                events: false,
                timers: false,
                string_decoder: false,
                punycode: false,
                process: false,
                vm: false,
                tty: false,
                domain: false,
                dgram: false,
                readline: false,
                perf_hooks: false,
                async_hooks: false,
                worker_threads: false,
            }
        }

        return config
    },
}

// Add bundle analyzer if ANALYZE is set
let configExport = nextConfig

if (process.env.ANALYZE === "true") {
    const withBundleAnalyzer = require("next-bundle-analyzer")({
        enabled: true,
    })
    configExport = withBundleAnalyzer(nextConfig)
}

module.exports = configExport
