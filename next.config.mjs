/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'standalone',
    images: {
        domains: ['images.unsplash.com'], // Add your image host domains here
    },
};

export default nextConfig;