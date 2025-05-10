/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: "standalone",
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // Disable source maps in production
    devIndicators: false,
    productionBrowserSourceMaps: false,
    images: {
        domains: ["images.unsplash.com", "firebasestorage.googleapis.com", "storage.googleapis.com"],
        unoptimized: true,
    },
    // Compress output
    compress: true,
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
