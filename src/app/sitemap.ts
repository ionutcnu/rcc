import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const routes = [
        {
            url: 'https://quests.so/',
            lastModified: new Date().toISOString(),
            priority: 1.0,
            changeFrequency: 'weekly' as 'weekly'
        },
        {
            url: 'https://quests.so/contact',
            lastModified: new Date().toISOString(),
            priority: 0.8,
            changeFrequency: 'monthly' as 'monthly'
        },
        {
            url: 'https://quests.so/privacy',
            lastModified: new Date().toISOString(),
            priority: 0.5,
            changeFrequency: 'yearly' as 'yearly'
        },
        {
            url: 'https://quests.so/terms',
            lastModified: new Date().toISOString(),
            priority: 0.5,
            changeFrequency: 'yearly' as 'yearly'
        }
    ];

    return routes;
}