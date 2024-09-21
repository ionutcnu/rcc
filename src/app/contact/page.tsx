// ContactPage.tsx

"use client";
import React, { useState } from "react";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import { useTranslation } from 'react-i18next';

export default function ContactPage() {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        howDidYouFindUs: "",
        message: "",
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission logic
    };

    return (
        <div className="min-h-screen bg-[#1C1C21] text-white">
            <Header />
            <div className="container mx-auto py-16 px-8">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold">{t('contact.get_in_touch')}</h1>
                    <p className="text-xl mt-4">{t('contact.connecting_souls')}</p>
                </div>
                <div className="flex flex-wrap justify-between items-start">
                    <div className="w-full md:w-5/12 mb-8 md:mb-0">
                        <h2 className="text-2xl font-semibold">{t('contact.contact_us')}</h2>
                        <p className="mt-4">
                            {/* Icon */}
                            {t('contact.phone_number')}
                        </p>
                        <p className="mt-2">
                            {/* Icon */}
                            {t('contact.email_address')}
                        </p>
                        <div className="mt-8 p-6 bg-[#2A2A2E] rounded-lg shadow-lg">
                            <h3 className="text-lg font-semibold">{t('contact.become_hero')}</h3>
                        </div>
                    </div>
                    <div className="w-full md:w-6/12 bg-[#2A2A2E] p-8 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-semibold">{t('contact.from_screening')}</h2>
                        <p className="mt-4">{t('contact.reach_out')}</p>
                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <div className="flex flex-wrap -mx-2">
                                <div className="w-full md:w-1/2 px-2 mb-4">
                                    <input
                                        type="text"
                                        name="firstName"
                                        placeholder={t('contact.first_name')}
                                        className="w-full p-3 bg-[#3E3E42] text-white rounded-lg focus:outline-none"
                                        value={form.firstName}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="w-full md:w-1/2 px-2 mb-4">
                                    <input
                                        type="text"
                                        name="lastName"
                                        placeholder={t('contact.last_name')}
                                        className="w-full p-3 bg-[#3E3E42] text-white rounded-lg focus:outline-none"
                                        value={form.lastName}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <input
                                type="email"
                                name="email"
                                placeholder={t('contact.email_placeholder')}
                                className="w-full p-3 bg-[#3E3E42] text-white rounded-lg focus:outline-none"
                                value={form.email}
                                onChange={handleChange}
                            />
                            <select
                                name="howDidYouFindUs"
                                className="w-full p-3 bg-[#3E3E42] text-white rounded-lg focus:outline-none"
                                value={form.howDidYouFindUs}
                                onChange={handleChange}
                            >
                                <option value="">{t('contact.how_did_you_find_us')}</option>
                                <option value="google">{t('contact.google')}</option>
                                <option value="friend">{t('contact.friend')}</option>
                                <option value="social_media">{t('contact.social_media')}</option>
                            </select>
                            <textarea
                                name="message"
                                placeholder={t('contact.message_placeholder')}
                                className="w-full p-3 bg-[#3E3E42] text-white rounded-lg focus:outline-none"
                                rows={4}
                                value={form.message}
                                onChange={handleChange}
                            />
                            <button
                                type="submit"
                                className="w-full bg-candlelight-500 hover:bg-candlelight-600 text-black font-semibold py-3 px-4 rounded-lg"
                            >
                                {t('contact.send_message')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
