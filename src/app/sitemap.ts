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
            url: 'https://redcatcuasar.vercel.app/cats',
            lastModified: new Date().toISOString(),
            priority: 0.9,
            changeFrequency: 'weekly' as 'weekly'
        },
        {
            url: 'https://redcatcuasar.vercel.app/allcats',
            lastModified: new Date().toISOString(),
            priority: 0.8,
            changeFrequency: 'weekly' as 'weekly'
        },
        {
            url: 'https://redcatcuasar.vercel.app/contact',
            lastModified: new Date().toISOString(),
            priority: 0.8,
            changeFrequency: 'monthly' as 'monthly'
        },
        {
            url: 'https://redcatcuasar.vercel.app/club',
            lastModified: new Date().toISOString(),
            priority: 0.7,
            changeFrequency: 'monthly' as 'monthly'
        },
        {
            url: 'https://redcatcuasar.vercel.app/family-tree',
            lastModified: new Date().toISOString(),
            priority: 0.6,
            changeFrequency: 'monthly' as 'monthly'
        },
        {
            url: 'https://redcatcuasar.vercel.app/living-conditions',
            lastModified: new Date().toISOString(),
            priority: 0.6,
            changeFrequency: 'monthly' as 'monthly'
        },
        {
            url: 'https://redcatcuasar.vercel.app/post-adoption-guide',
            lastModified: new Date().toISOString(),
            priority: 0.6,
            changeFrequency: 'monthly' as 'monthly'
        },
        {
            url: 'https://redcatcuasar.vercel.app/contract',
            lastModified: new Date().toISOString(),
            priority: 0.5,
            changeFrequency: 'yearly' as 'yearly'
        },
        {
            url: 'https://redcatcuasar.vercel.app/login',
            lastModified: new Date().toISOString(),
            priority: 0.3,
            changeFrequency: 'yearly' as 'yearly'
        },
        {
            url: 'https://redcatcuasar.vercel.app/register',
            lastModified: new Date().toISOString(),
            priority: 0.3,
            changeFrequency: 'yearly' as 'yearly'
        },
    ];

    return routes;
}