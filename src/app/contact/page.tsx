"use client";
import React, { useState, useEffect } from "react";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import CatPopup from "@/components/CatPopup";

export default function ContactPage() {
    const [form, setForm] = useState({ firstName: "", lastName: "", email: "", message: "" });
    const [loading, setLoading] = useState(false);
    const [popupVisible, setPopupVisible] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

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
        <div className="min-h-screen bg-gradient-to-br from-[#F4F6FA] via-[#E8ECFF] to-[#F0F4FF] flex flex-col text-[#2E2E2E] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-50/20 to-purple-50/20 pointer-events-none"></div>
            
            <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-40 right-20 w-40 h-40 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br from-orange-200/20 to-red-200/20 rounded-full blur-2xl animate-pulse delay-500"></div>

            <Header />
            <main className={`container mx-auto flex-grow py-16 px-6 relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                    <div className="group animate-slide-in-left">
                        <div className="bg-white/80 backdrop-blur-sm p-10 shadow-2xl rounded-3xl border border-white/20 transform transition-all duration-500 hover:scale-105 hover:shadow-3xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#FF6B6B] via-pink-400 to-orange-400"></div>
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-pink-100 to-orange-100 rounded-full opacity-50"></div>
                            
                            <div className="relative z-10">
                                <div className="flex items-center mb-6">
                                    <span className="text-3xl mr-3">📞</span>
                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-[#FF6B6B] to-pink-500 bg-clip-text text-transparent">
                                        Contact Information
                                    </h2>
                                </div>
                                
                                <div className="space-y-6">
                                    <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl transform transition-all duration-300 hover:scale-105">
                                        <span className="text-2xl mr-4">📞</span>
                                        <div>
                                            <p className="font-semibold text-gray-800">Phone</p>
                                            <p className="text-[#5C6AC4] font-mono text-lg">+40 735 670 304</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl transform transition-all duration-300 hover:scale-105">
                                        <span className="text-2xl mr-4">📧</span>
                                        <div>
                                            <p className="font-semibold text-gray-800">Email</p>
                                            <p className="text-[#FF6B6B] font-mono text-lg">contact@rcc.org</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-8 bg-gradient-to-r from-purple-100 via-pink-100 to-orange-100 rounded-2xl p-6 text-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-200/30 to-pink-200/30 animate-pulse"></div>
                                    <div className="relative z-10">
                                        <span className="text-2xl block mb-2">🐾</span>
                                        <p className="font-bold text-lg text-gray-800">Your new furry friend awaits!</p>
                                        <p className="text-sm text-gray-600 mt-1">Every cat deserves a loving home</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="group animate-slide-in-right">
                        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl p-10 border border-white/20 transform transition-all duration-500 hover:scale-105 hover:shadow-3xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#5C6AC4] via-blue-400 to-indigo-400"></div>
                            <div className="absolute -top-6 -left-6 w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-50"></div>
                            
                            <div className="relative z-10">
                                <div className="text-center mb-8">
                                    <span className="text-4xl animate-bounce block mb-3">🐱</span>
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-[#5C6AC4] to-blue-500 bg-clip-text text-transparent mb-2">
                                        Get in Touch
                                    </h1>
                                    <p className="text-gray-600">Find your purrfect companion 🏠</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="relative group">
                                        <input
                                            name="firstName"
                                            type="text"
                                            placeholder="First Name"
                                            className="w-full bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border-2 border-transparent focus:border-[#5C6AC4] focus:bg-white transition-all duration-300 focus:scale-105 focus:shadow-lg placeholder-gray-400"
                                            value={form.firstName}
                                            onChange={handleChange}
                                            required
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#5C6AC4]/10 to-blue-400/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                                    </div>
                                    <div className="relative group">
                                        <input
                                            name="lastName"
                                            type="text"
                                            placeholder="Last Name"
                                            className="w-full bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border-2 border-transparent focus:border-[#5C6AC4] focus:bg-white transition-all duration-300 focus:scale-105 focus:shadow-lg placeholder-gray-400"
                                            value={form.lastName}
                                            onChange={handleChange}
                                            required
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#5C6AC4]/10 to-blue-400/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                                    </div>
                                </div>

                                <div className="relative group mb-6">
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="Your Email"
                                        className="w-full bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border-2 border-transparent focus:border-[#5C6AC4] focus:bg-white transition-all duration-300 focus:scale-105 focus:shadow-lg placeholder-gray-400"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#5C6AC4]/10 to-blue-400/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                                </div>

                                <div className="relative group mb-8">
                                    <textarea
                                        name="message"
                                        rows={5}
                                        placeholder="Your Message (Tell us about your experience with cats, your living situation, and what kind of companion you're looking for!)"
                                        className="w-full bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border-2 border-transparent focus:border-[#5C6AC4] focus:bg-white transition-all duration-300 focus:scale-105 focus:shadow-lg placeholder-gray-400 resize-none"
                                        value={form.message}
                                        onChange={handleChange}
                                        required
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#5C6AC4]/10 to-blue-400/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-[#5C6AC4] via-blue-500 to-[#5C6AC4] text-white rounded-xl py-4 px-6 font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                                >
                                    <span className="relative z-10 flex items-center justify-center">
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Sending your message...
                                            </>
                                        ) : (
                                            <>
                                                Send Message
                                                <span className="ml-2">🚀</span>
                                            </>
                                        )}
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </main>
            <Footer />

            <CatPopup
                visible={popupVisible}
                message="Thank you! Your message was sent successfully. We'll get back to you soon! 🐱"
                onClose={() => setPopupVisible(false)}
            />

            <style jsx>{`
                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slide-in-left {
                    from {
                        opacity: 0;
                        transform: translateX(-50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes slide-in-right {
                    from {
                        opacity: 0;
                        transform: translateX(50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                .animate-fade-in-up {
                    animation: fade-in-up 0.8s ease-out forwards;
                }

                .animate-slide-in-left {
                    animation: slide-in-left 0.8s ease-out forwards;
                }

                .animate-slide-in-right {
                    animation: slide-in-right 0.8s ease-out forwards;
                    animation-delay: 0.2s;
                    opacity: 0;
                }

                .delay-200 {
                    animation-delay: 0.2s;
                }
            `}</style>
        </div>
    );
}
