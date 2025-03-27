// pages/contact/page.tsx
"use client";
import React, { useState } from "react";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import CatPopup from "@/components/elements/CatsRelated/CatPopup";

export default function ContactPage() {
    const [form, setForm] = useState({ firstName: "", lastName: "", email: "", message: "" });
    const [loading, setLoading] = useState(false);
    const [popupVisible, setPopupVisible] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const sendEmail = async () => {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Email sending failed");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await sendEmail();
            setPopupVisible(true);
            setForm({ firstName: '', lastName: '', email: '', message: '' });
        } catch (error) {
            alert(`Oops, something went wrong: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F6FA] flex flex-col text-[#2E2E2E]">
            <Header />
            <main className="container mx-auto flex-grow py-16 px-6">
                <section className="mb-12 text-center">
                    <h1 className="text-4xl font-bold text-[#5C6AC4]">Get in Touch</h1>
                    <p className="mt-4 text-lg">Interested in a cat? Send your inquiry directly to the owner.</p>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 shadow-lg rounded-xl border-t-4 border-[#FF6B6B]">
                        <h2 className="text-2xl font-semibold text-[#FF6B6B]">Contact Information</h2>
                        <p className="mt-4">📞 +40 735 670 304</p>
                        <p className="mt-2">📧 contact@rcc.org</p>
                        <div className="mt-6 bg-[#F4F6FA] rounded-lg p-4 text-center font-semibold">
                            Your new furry friend awaits!
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl p-8 border-t-4 border-[#5C6AC4]">
                        <h2 className="text-2xl font-semibold text-[#5C6AC4] mb-6">Send a Message</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input
                                name="firstName"
                                type="text"
                                placeholder="First Name"
                                className="w-full bg-[#F4F6FA] p-3 rounded-lg"
                                value={form.firstName}
                                onChange={handleChange}
                                required
                            />
                            <input
                                name="lastName"
                                type="text"
                                placeholder="Last Name"
                                className="w-full bg-[#F4F6FA] p-3 rounded-lg"
                                value={form.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <input
                            name="email"
                            type="email"
                            placeholder="Your Email"
                            className="w-full bg-[#F4F6FA] p-3 rounded-lg mb-4"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />

                        <textarea
                            name="message"
                            rows={5}
                            placeholder="Your Message"
                            className="w-full bg-[#F4F6FA] p-3 rounded-lg mb-4"
                            value={form.message}
                            onChange={handleChange}
                            required
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#5C6AC4] text-white rounded-lg py-3 transition-colors hover:bg-[#3F4EB3]"
                        >
                            {loading ? "Sending..." : "Send Message"}
                        </button>
                    </form>
                </section>
            </main>
            <Footer />

            <CatPopup
                visible={popupVisible}
                message="Thank you! Your message was sent successfully."
                onClose={() => setPopupVisible(false)}
            />
        </div>
    );
}
