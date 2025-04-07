/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'standalone',
    images: {
        domains: [
            'images.unsplash.com',
            'firebasestorage.googleapis.com', // Add Firebase Storage domain
            'storage.googleapis.com'          // Alternative Firebase Storage domain
        ],
    },
    async headers() {
        return [
            {
                // Apply these headers to all routes
                source: '/:path*',
                headers: [
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin',
                    },
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'require-corp',
                    },
                ],
            },
        ]
    },
};

export default nextConfig;