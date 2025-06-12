"use client";

import React, { useEffect, useState } from 'react';
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import { GiCat, GiPawPrint } from "react-icons/gi";

export default function LivingConditionsPage() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const livingAspects = [
        {
            title: "Premium Nutrition",
            description: "Quality nutrition is the foundation of feline health and happiness",
            features: [
                "Age-specific Royal Canin formulas for optimal development",
                "Breed-specific nutrition tailored to unique needs",
                "High-quality protein sources for muscle maintenance",
                "Essential vitamins and minerals for immune support",
                "Controlled portion sizes to maintain ideal weight"
            ],
            icon: "🍽️",
            gradient: "from-orange-400 to-red-500",
            color: "text-orange-600",
            bgColor: "bg-orange-50",
            hoverBg: "hover:bg-orange-100"
        },
        {
            title: "Comfortable Environment",
            description: "Creating the perfect living space for our feline companions",
            features: [
                "Temperature-controlled indoor environment (68-72°F)",
                "Multiple cozy resting areas with soft bedding",
                "Elevated perches for natural climbing behavior",
                "Quiet spaces away from household noise",
                "Easy access to fresh water fountains"
            ],
            icon: "🏠",
            gradient: "from-blue-400 to-purple-500",
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            hoverBg: "hover:bg-blue-100"
        },
        {
            title: "Health & Wellness",
            description: "Proactive healthcare ensures long, healthy lives",
            features: [
                "Regular veterinary checkups and vaccinations",
                "Dental care with appropriate Royal Canin dental formulas",
                "Parasite prevention and regular health monitoring",
                "Stress reduction through environmental enrichment",
                "Early detection protocols for common feline conditions"
            ],
            icon: "🩺",
            gradient: "from-green-400 to-teal-500",
            color: "text-green-600",
            bgColor: "bg-green-50",
            hoverBg: "hover:bg-green-100"
        },
        {
            title: "Mental Stimulation",
            description: "Keeping our cats mentally engaged and emotionally satisfied",
            features: [
                "Interactive toys and puzzle feeders",
                "Rotating toy selection to maintain interest",
                "Window perches for outdoor observation",
                "Scratching posts and climbing trees",
                "Regular play sessions with human interaction"
            ],
            icon: "🧩",
            gradient: "from-purple-400 to-pink-500",
            color: "text-purple-600",
            bgColor: "bg-purple-50",
            hoverBg: "hover:bg-purple-100"
        },
        {
            title: "Grooming & Hygiene",
            description: "Maintaining cleanliness and coat health",
            features: [
                "Regular brushing sessions for coat maintenance",
                "Royal Canin coat care nutrition for healthy fur",
                "Clean, accessible litter boxes changed daily",
                "Nail trimming and dental hygiene routines",
                "Bathing when necessary with cat-safe products"
            ],
            icon: "✨",
            gradient: "from-yellow-400 to-orange-500",
            color: "text-yellow-600",
            bgColor: "bg-yellow-50",
            hoverBg: "hover:bg-yellow-100"
        },
        {
            title: "Social Interaction",
            description: "Balanced socialization for well-adjusted cats",
            features: [
                "Daily interaction and bonding time with caregivers",
                "Appropriate socialization with other cats when suitable",
                "Respect for individual personality and preferences",
                "Consistent routine to reduce stress and anxiety",
                "Safe outdoor access through supervised time or enclosures"
            ],
            icon: "❤️",
            gradient: "from-pink-400 to-red-500",
            color: "text-pink-600",
            bgColor: "bg-pink-50",
            hoverBg: "hover:bg-pink-100"
        }
    ];

    return (
        <div className="min-h-screen cat-bg-pattern relative overflow-hidden">
            {/* Floating Cat Elements */}
            <div className="cat-float top-20 left-10 cat-float-delayed">
                <GiCat className="w-16 h-16 text-red-300" />
            </div>
            <div className="cat-float top-40 right-20 cat-float-slow">
                <GiPawPrint className="w-12 h-12 text-blue-300" />
            </div>
            <div className="cat-float bottom-40 left-1/4">
                <GiCat className="w-20 h-20 text-orange-300" />
            </div>
            <div className="cat-float top-1/3 right-1/3 cat-float-delayed">
                <GiPawPrint className="w-14 h-14 text-purple-300" />
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
                                    <span className="cat-text-gradient-warm">Optimal Living</span>
                                    <br />
                                    <span className="cat-text-gradient-cool">Conditions</span>
                                </h1>
                                <div className="flex justify-center items-center gap-4 mb-6">
                                    <div className="animate-paw-wave text-4xl">🐾</div>
                                    <div className="animate-cat-bounce text-4xl">🐱</div>
                                    <div className="animate-paw-wave text-4xl">🐾</div>
                                </div>
                                <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
                                    Our cats enjoy the finest living conditions, combining premium Royal Canin nutrition 
                                    with comprehensive care for their physical and emotional well-being.
                                </p>
                            </div>
                        </div>

                        {/* Living Aspects Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                            {livingAspects.map((aspect, index) => (
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
                                    <div className={`h-2 bg-gradient-to-r ${aspect.gradient} rounded-t-3xl`}></div>
                                    
                                    <div className="p-8 flex flex-col flex-grow bg-white/90 backdrop-blur-sm rounded-b-3xl">
                                        {/* Icon and Title */}
                                        <div className="flex items-center mb-6">
                                            <div className="text-5xl mr-4 animate-purr group-hover:animate-cat-bounce">
                                                {aspect.icon}
                                            </div>
                                            <div>
                                                <h2 className={`text-2xl font-bold font-patrick ${aspect.color}`}>
                                                    {aspect.title}
                                                </h2>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className={`relative mb-6 p-4 rounded-2xl ${aspect.bgColor}`}>
                                            <p className="text-gray-700 italic text-lg leading-relaxed">
                                                {aspect.description}
                                            </p>
                                        </div>

                                        {/* Features */}
                                        <div className="flex-grow">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                                <span className="animate-whisker-twitch mr-2">🎀</span>
                                                Key Features
                                            </h3>
                                            <ul className="space-y-3">
                                                {aspect.features.map((feature, i) => (
                                                    <li
                                                        key={i}
                                                        className={`flex items-start text-gray-700 p-2 rounded-lg ${aspect.hoverBg} transition-all duration-300 group/item`}
                                                    >
                                                        <span className="text-lg mr-3 mt-0.5 group-hover/item:animate-paw-wave">🐾</span>
                                                        <span className="leading-relaxed">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Royal Canin Partnership Section */}
                        <div className="cat-card p-10" style={{opacity: 1, transform: 'translateY(0)'}}>
                            <div className="text-center">
                                <div className="flex justify-center items-center gap-4 mb-8">
                                    <div className="animate-cat-bounce text-5xl">👑</div>
                                    <h2 className="text-4xl font-bold font-patrick text-orange-600">
                                        Royal Canin Partnership
                                    </h2>
                                    <div className="animate-cat-bounce text-5xl">👑</div>
                                </div>
                                
                                <p className="text-xl text-gray-700 mb-10 max-w-5xl mx-auto leading-relaxed">
                                    We proudly use Royal Canin premium nutrition products, scientifically formulated to meet 
                                    the specific nutritional needs of different cat breeds, ages, and lifestyles. This partnership 
                                    ensures our cats receive the highest quality nutrition available.
                                </p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
                                    {[
                                        { icon: "🔬", title: "Scientific Formula", desc: "Research-based nutrition", color: "text-blue-600", bgColor: "bg-blue-50" },
                                        { icon: "🎯", title: "Breed Specific", desc: "Tailored to individual needs", color: "text-purple-600", bgColor: "bg-purple-50" },
                                        { icon: "💎", title: "Premium Quality", desc: "Only the finest ingredients", color: "text-yellow-600", bgColor: "bg-yellow-50" }
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