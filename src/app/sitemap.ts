import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const routes = [
        {
            url: 'https://redcatcuasar.vercel.app',
            lastModified: new Date().toISOString(),
            priority: 1.0,
            changeFrequency: 'weekly' as 'weekly'
        },
        {
            url: 'https://redcatcuasar.vercel.app/contact',
            lastModified: new Date().toISOString(),
            priority: 0.8,
            changeFrequency: 'monthly' as 'monthly'
        },
        {
            url: 'https://redcatcuasar.vercel.app/cats',
            lastModified: new Date().toISOString(),
            priority: 0.5,
            changeFrequency: 'yearly' as 'yearly'
        },

    ];

    return routes;
}