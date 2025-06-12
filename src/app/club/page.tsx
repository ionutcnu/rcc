"use client";

import React, { useEffect, useState } from 'react';
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import { GiCat, GiPawPrint } from "react-icons/gi";

export default function CatClubsPage() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const clubs = [
        {
            name: "Sofisticat",
            description: "Romanian National Feline Federation",
            benefits: [
                "Exclusive access to championship breeding seminars",
                "International cat show access",
                "VIP veterinary genetic consultation services",
                "Curated luxury cat furniture & accessory discounts",
                "Private member network for rare breed enthusiasts"
            ],
            website: "https://www.sofisticat.ro/",
            gradient: "from-purple-400 to-indigo-500",
            color: "text-purple-600",
            bgColor: "bg-purple-50",
            hoverBg: "hover:bg-purple-100",
            buttonColor: "bg-purple-600 hover:bg-purple-700"
        },
        {
            name: "FNFR",
            description: "Fédération Nationale Féline de Romania - National authority for cat pedigree registration.",
            benefits: [
                "Official pedigree certification",
                "National competition circuit",
                "Breeder accreditation programs",
                "Feline health research initiatives"
            ],
            website: "https://www.fnfr.ro",
            gradient: "from-blue-400 to-cyan-500",
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            hoverBg: "hover:bg-blue-100",
            buttonColor: "bg-blue-600 hover:bg-blue-700"
        },
        {
            name: "FIFE",
            description: "Fédération Internationale Féline - Worldwide federation of cat organizations.",
            benefits: [
                "International cat registration",
                "World Cat Congress participation",
                "Global breeder network",
                "International show standards"
            ],
            website: "https://www.fifeweb.org",
            gradient: "from-emerald-400 to-teal-500",
            color: "text-emerald-600",
            bgColor: "bg-emerald-50",
            hoverBg: "hover:bg-emerald-100",
            buttonColor: "bg-emerald-600 hover:bg-emerald-700"
        }
    ];

    return (
        <div className="min-h-screen cat-bg-pattern relative overflow-hidden">
            {/* Floating Cat Elements */}
            <div className="cat-float top-20 left-10 cat-float-delayed">
                <GiCat className="w-16 h-16 text-purple-300" />
            </div>
            <div className="cat-float top-40 right-20 cat-float-slow">
                <GiPawPrint className="w-12 h-12 text-blue-300" />
            </div>
            <div className="cat-float bottom-40 left-1/4">
                <GiCat className="w-20 h-20 text-emerald-300" />
            </div>
            <div className="cat-float top-1/3 right-1/3 cat-float-delayed">
                <GiPawPrint className="w-14 h-14 text-indigo-300" />
            </div>

            {/* Main Content */}
            <div className={`relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <Header />

                <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto relative">
                        {/* Hero Section */}
                        <div className="text-center mb-16">
                            <div>
                                <h1 className="text-5xl md:text-6xl font-extrabold mb-6 font-patrick">
                                    <span className="cat-text-gradient-warm">Feline Elite</span>
                                    <br />
                                    <span className="cat-text-gradient-cool">Clubs</span>
                                </h1>
                                <div className="flex justify-center items-center gap-4 mb-6">
                                    <div className="animate-paw-wave text-4xl">🏆</div>
                                    <div className="animate-cat-bounce text-4xl">🐱</div>
                                    <div className="animate-paw-wave text-4xl">👑</div>
                                </div>
                                <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
                                    Join prestigious feline organizations that promote breeding excellence, 
                                    show standards, and the advancement of cat welfare worldwide.
                                </p>
                            </div>
                        </div>

                        {/* Clubs Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {clubs.map((club, index) => (
                                <div
                                    key={index}
                                    className="cat-card group hover:scale-105 transition-all duration-500 h-full flex flex-col"
                                    style={{
                                        animationDelay: `${index * 150}ms`,
                                        transform: 'translateY(0)',
                                        opacity: 1
                                    }}
                                >
                                    {/* Gradient Top Bar */}
                                    <div className={`h-2 bg-gradient-to-r ${club.gradient} rounded-t-3xl`}></div>
                                    
                                    <div className="p-8 flex flex-col flex-grow bg-white/90 backdrop-blur-sm rounded-b-3xl">
                                        {/* Icon and Title */}
                                        <div className="flex items-center mb-6">
                                            <div className="text-5xl mr-4 animate-purr group-hover:animate-cat-bounce">
                                                🐈
                                            </div>
                                            <div>
                                                <h2 className={`text-2xl font-bold font-patrick ${club.color}`}>
                                                    {club.name}
                                                </h2>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className={`relative mb-6 p-4 rounded-2xl ${club.bgColor}`}>
                                            <p className="text-gray-700 italic text-lg leading-relaxed">
                                                {club.description}
                                            </p>
                                        </div>

                                        {/* Benefits */}
                                        <div className="flex-grow mb-6">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                                <span className="animate-whisker-twitch mr-2">🎀</span>
                                                Membership Benefits
                                            </h3>
                                            <ul className="space-y-3">
                                                {club.benefits.map((benefit, i) => (
                                                    <li
                                                        key={i}
                                                        className={`flex items-start text-gray-700 p-2 rounded-lg ${club.hoverBg} transition-all duration-300 group/item`}
                                                    >
                                                        <span className="text-lg mr-3 mt-0.5 group-hover/item:animate-paw-wave">🐾</span>
                                                        <span className="leading-relaxed">{benefit}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        {/* Website Button */}
                                        <div className="mt-auto pt-4">
                                            <a
                                                href={club.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`inline-block w-full ${club.buttonColor} text-white px-6 py-3 rounded-xl text-center font-semibold transition-all duration-300 hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl`}
                                            >
                                                Visit Website 🐾
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Additional Info Section */}
                        <div className="cat-card p-10 mt-16" style={{opacity: 1, transform: 'translateY(0)'}}>
                            <div className="text-center">
                                <div className="flex justify-center items-center gap-4 mb-8">
                                    <div className="animate-cat-bounce text-5xl">🌟</div>
                                    <h2 className="text-4xl font-bold font-patrick text-indigo-600">
                                        Why Join Elite Clubs?
                                    </h2>
                                    <div className="animate-cat-bounce text-5xl">🌟</div>
                                </div>
                                
                                <p className="text-xl text-gray-700 mb-10 max-w-5xl mx-auto leading-relaxed">
                                    Membership in these prestigious organizations provides access to exclusive resources, 
                                    networking opportunities, and the highest standards of feline care and breeding practices.
                                </p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
                                    {[
                                        { icon: "📚", title: "Education", desc: "Access to breeding seminars and research", color: "text-blue-600", bgColor: "bg-blue-50" },
                                        { icon: "🤝", title: "Networking", desc: "Connect with fellow enthusiasts globally", color: "text-purple-600", bgColor: "bg-purple-50" },
                                        { icon: "🏅", title: "Recognition", desc: "Official certifications and show access", color: "text-emerald-600", bgColor: "bg-emerald-50" }
                                    ].map((item, index) => (
                                        <div 
                                            key={index}
                                            className={`${item.bgColor} backdrop-blur-sm rounded-2xl p-6 hover:scale-105 transition-all duration-300 group/feature`}
                                        >
                                            <div className="text-6xl mb-4 group-hover/feature:animate-cat-bounce">{item.icon}</div>
                                            <h3 className={`font-bold text-xl mb-2 ${item.color}`}>
                                                {item.title}
                                            </h3>
                                            <p className="text-gray-600 text-lg">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </div>
    );
}