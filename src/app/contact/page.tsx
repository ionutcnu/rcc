"use client";
import React, { useState } from "react";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";

export default function ContactPage() {
    const [form, setForm] = useState({ firstName: "", lastName: "", email: "", message: "" });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to send email');

            alert('Message sent successfully!');
            setForm({ firstName: '', lastName: '', email: '', message: '' });
        } catch (error) {
            alert(`There was a problem sending your message: ${error}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F6FA] text-[#2E2E2E] flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto px-6 py-12 md:py-20">
                <section className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-[#5C6AC4]">Get in Touch</h1>
                    <p className="mt-4 text-lg">Interested in a cat? Send your inquiry directly to the owner.</p>
                </section>
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4 bg-white p-8 rounded-xl shadow-lg border-t-4 border-[#FF6B6B]">
                        <h2 className="text-2xl font-semibold mb-4 text-[#FF6B6B]">Contact Information</h2>
                        <p className="flex items-center gap-2">
                            📞 <span>+40 735 670 304</span>
                        </p>
                        <p className="flex items-center gap-2">
                            📧 <span>contact@rcc.org</span>
                        </p>
                        <div className="bg-[#F4F6FA] p-4 rounded-lg mt-6 text-center">
                            <span className="font-semibold">Your new furry friend awaits!</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-[#5C6AC4]">
                        <h2 className="text-2xl font-semibold mb-6 text-[#5C6AC4]">Send a Message</h2>
                        <div className="flex gap-4 mb-4">
                            <input
                                type="text"
                                name="firstName"
                                placeholder="First Name"
                                required
                                className="flex-1 p-3 rounded-lg bg-[#F4F6FA] focus:outline-none"
                                value={form.firstName}
                                onChange={handleChange}
                            />
                            <input
                                type="text"
                                name="lastName"
                                placeholder="Last Name"
                                required
                                className="flex-1 p-3 rounded-lg bg-[#F4F6FA] focus:outline-none"
                                value={form.lastName}
                                onChange={handleChange}
                            />
                        </div>
                        <input
                            type="email"
                            name="email"
                            placeholder="Your Email"
                            required
                            className="w-full p-3 rounded-lg bg-[#F4F6FA] mb-4 focus:outline-none"
                            value={form.email}
                            onChange={handleChange}
                        />
                        <textarea
                            name="message"
                            placeholder="Your Message"
                            required
                            rows={5}
                            className="w-full p-3 rounded-lg bg-[#F4F6FA] mb-4 focus:outline-none"
                            value={form.message}
                            onChange={handleChange}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-lg font-semibold bg-[#5C6AC4] hover:bg-[#3F4EB3] text-white transition-colors duration-300"
                        >
                            {loading ? "Sending..." : "Send Message"}
                        </button>
                    </form>
                </section>
            </main>
            <Footer />
        </div>
    );
}
