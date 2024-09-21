// app/about-me/page.tsx

"use client";
import React from "react";
import { useTranslation } from 'react-i18next';

export default function AboutMe() {
    const { t } = useTranslation();

    return (
        <section className="bg-gray-200 dark:bg-gray-800 py-12">
            <div className="container mx-auto max-w-6xl">
                <h2 className="text-4xl font-bold text-center mb-6 text-gray-900 dark:text-white">
                    {t('about_me.title')}
                </h2>
                <div className="flex flex-col md:flex-row items-center md:space-x-8">
                    {/* Image */}
                    <div className="md:w-1/3 mb-6 md:mb-0">
                        <img
                            src="/Images/fellisa.jpg"
                            alt={t('about_me.image_alt')}
                            className="rounded-lg shadow-lg object-cover h-full"
                        />
                    </div>

                    {/* Text Content */}
                    <div className="md:w-2/3 text-gray-700 dark:text-gray-300">
                        <h3 className="text-2xl font-semibold mb-4">
                            {t('about_me.subtitle')}
                        </h3>
                        <p className="mb-4">
                            {t('about_me.paragraph1')}
                        </p>
                        <p className="mb-4">
                            {t('about_me.paragraph2')}
                        </p>
                        <p className="mb-4">
                            {t('about_me.paragraph3')}
                        </p>
                        <a
                            href="/contact"
                            className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-lg transition-colors duration-300"
                        >
                            {t('about_me.get_in_touch')}
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
