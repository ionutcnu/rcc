"use client";
import React, { useState } from "react";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";

export default function ContactPage() {
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        howDidYouFindUs: "",
        message: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
                    <h1 className="text-5xl font-bold">Get in touch</h1>
                    <p className="text-xl mt-4">Connecting souls with souls </p>
                </div>
                <div className="flex flex-wrap justify-between items-start">
                    <div className="w-full md:w-5/12 mb-8 md:mb-0">
                        <h2 className="text-2xl font-semibold">Contact us</h2>
                        <p className="mt-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="inline-block w-6 h-6 mr-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 8c0 2.21-1.79 4-4 4S8 10.21 8 8m4 4v6m0 0h-3m3 0h3" />
                            </svg>
                            +40 735 670 304
                        </p>
                        <p className="mt-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="inline-block w-6 h-6 mr-2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 8c0 2.21-1.79 4-4 4S8 10.21 8 8m4 4v6m0 0h-3m3 0h3" />
                            </svg>
                            contact@rcc.org
                        </p>
                        <div className="mt-8 p-6 bg-[#2A2A2E] rounded-lg shadow-lg">
                            <h3 className="text-lg font-semibold">Become the next hero</h3>
                        </div>
                    </div>
                    <div className="w-full md:w-6/12 bg-[#2A2A2E] p-8 rounded-lg shadow-lg">
                        <h2 className="text-2xl font-semibold">From screening to owner in 5 days</h2>
                        <p className="mt-4">Reach out and let's start  your  journey today.</p>
                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <div className="flex flex-wrap -mx-2">
                                <div className="w-full md:w-1/2 px-2 mb-4">
                                    <input
                                        type="text"
                                        name="firstName"
                                        placeholder="First name"
                                        className="w-full p-3 bg-[#3E3E42] text-white rounded-lg focus:outline-none"
                                        value={form.firstName}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="w-full md:w-1/2 px-2 mb-4">
                                    <input
                                        type="text"
                                        name="lastName"
                                        placeholder="Last name"
                                        className="w-full p-3 bg-[#3E3E42] text-white rounded-lg focus:outline-none"
                                        value={form.lastName}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <input
                                type="email"
                                name="email"
                                placeholder="Enter your email address"
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
                                <option value="">How did you find out about RCC?</option>
                                <option value="google">Google</option>
                                <option value="friend">Friend</option>
                                <option value="social_media">Social Media</option>
                            </select>
                            <textarea
                                name="message"
                                placeholder="Type your message in here"
                                className="w-full p-3 bg-[#3E3E42] text-white rounded-lg focus:outline-none"
                                rows={4}
                                value={form.message}
                                onChange={handleChange}
                            />
                            <button type="submit" className="w-full bg-candlelight-500 hover:bg-candlelight-600 text-black font-semibold py-3 px-4 rounded-lg">Send message</button>
                        </form>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
