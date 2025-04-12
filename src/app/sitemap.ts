import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const routes = [
        {
            url: 'rcc-kappa.vercel.app',
            lastModified: new Date().toISOString(),
            priority: 1.0,
            changeFrequency: 'weekly' as 'weekly'
        },
        {
            url: 'rcc-kappa.vercel.app/contact',
            lastModified: new Date().toISOString(),
            priority: 0.8,
            changeFrequency: 'monthly' as 'monthly'
        },
        {
            url: 'rcc-kappa.vercel.app/cats',
            lastModified: new Date().toISOString(),
            priority: 0.5,
            changeFrequency: 'yearly' as 'yearly'
        },

    ];

    return routes;
}