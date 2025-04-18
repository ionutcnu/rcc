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
                source: '/(.*)',
                headers: [
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'credentialless',
                    },
                    {
                        key: 'Cross-Origin-Resource-Policy',
                        value: 'cross-origin',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;