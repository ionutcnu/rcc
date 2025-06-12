"use client";

import React, { useEffect, useState } from 'react';
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import { GiCat, GiPawPrint } from "react-icons/gi";

export default function PostAdoptionGuidePage() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const adoptionSteps = [
        {
            title: "First 24 Hours",
            description: "Essential steps for your cat's first day in their new home",
            features: [
                "Create a quiet, safe room with food, water, and litter box",
                "Allow your cat to explore at their own pace",
                "Keep noise and activity levels low to reduce stress",
                "Provide hiding spots like cardboard boxes or cat caves",
                "Schedule a veterinary checkup within the first week"
            ],
            icon: "🏡",
            gradient: "from-green-400 to-emerald-500",
            color: "text-green-600",
            bgColor: "bg-green-50",
            hoverBg: "hover:bg-green-100"
        },
        {
            title: "Setting Up Your Home",
            description: "Preparing your living space for your new feline companion",
            features: [
                "Cat-proof dangerous areas and remove toxic plants",
                "Set up multiple feeding stations away from litter boxes",
                "Install scratching posts and climbing trees",
                "Secure windows and balconies for safety",
                "Create cozy resting spots in quiet areas"
            ],
            icon: "🛠️",
            gradient: "from-blue-400 to-indigo-500",
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            hoverBg: "hover:bg-blue-100"
        },
        {
            title: "Nutrition Transition",
            description: "Gradually introducing proper nutrition for optimal health",
            features: [
                "Continue feeding the same food from the shelter initially",
                "Slowly transition to Royal Canin age-appropriate formula",
                "Establish regular feeding times (2-3 meals per day)",
                "Provide fresh water in multiple locations",
                "Monitor eating habits and adjust portions as needed"
            ],
            icon: "🍽️",
            gradient: "from-orange-400 to-red-500",
            color: "text-orange-600",
            bgColor: "bg-orange-50",
            hoverBg: "hover:bg-orange-100"
        },
        {
            title: "Health & Veterinary Care",
            description: "Establishing a comprehensive healthcare routine",
            features: [
                "Schedule initial health examination within one week",
                "Discuss vaccination schedule and parasite prevention",
                "Microchip registration and ID tag setup",
                "Spay/neuter appointment if not already completed",
                "Establish relationship with emergency veterinary clinic"
            ],
            icon: "🩺",
            gradient: "from-teal-400 to-cyan-500",
            color: "text-teal-600",
            bgColor: "bg-teal-50",
            hoverBg: "hover:bg-teal-100"
        },
        {
            title: "Behavioral Adjustment",
            description: "Helping your cat adapt to their new environment",
            features: [
                "Allow 2-4 weeks for complete adjustment period",
                "Use positive reinforcement for desired behaviors",
                "Introduce family members and other pets gradually",
                "Establish consistent daily routines",
                "Watch for signs of stress and provide comfort"
            ],
            icon: "🧠",
            gradient: "from-purple-400 to-violet-500",
            color: "text-purple-600",
            bgColor: "bg-purple-50",
            hoverBg: "hover:bg-purple-100"
        },
        {
            title: "Long-term Care Planning",
            description: "Building a foundation for lifelong health and happiness",
            features: [
                "Regular grooming sessions to build trust and bonding",
                "Annual veterinary checkups and preventive care",
                "Mental stimulation through interactive toys and play",
                "Monitor weight and adjust diet as your cat ages",
                "Create enriching environment with variety and challenges"
            ],
            icon: "📅",
            gradient: "from-pink-400 to-rose-500",
            color: "text-pink-600",
            bgColor: "bg-pink-50",
            hoverBg: "hover:bg-pink-100"
        }
    ];

    const emergencyTips = [
        {
            title: "Warning Signs",
            description: "When to contact your veterinarian immediately",
            signs: [
                "Not eating or drinking for 24+ hours",
                "Difficulty breathing or rapid breathing",
                "Lethargy or hiding for extended periods",
                "Vomiting or diarrhea lasting more than 24 hours",
                "Any signs of pain or distress"
            ],
            gradient: "from-red-400 to-pink-500",
            icon: "🚨",
            color: "text-red-600",
            bgColor: "bg-red-50",
            hoverBg: "hover:bg-red-100"
        },
        {
            title: "Common Challenges",
            description: "Normal adjustment behaviors that may occur",
            signs: [
                "Hiding for the first few days",
                "Changes in appetite during adjustment",
                "Vocalization or calling, especially at night",
                "Litter box avoidance (stress-related)",
                "Excessive grooming or lack of grooming"
            ],
            gradient: "from-yellow-400 to-orange-500",
            icon: "💭",
            color: "text-yellow-600",
            bgColor: "bg-yellow-50",
            hoverBg: "hover:bg-yellow-100"
        }
    ];

    return (
        <div className="min-h-screen cat-bg-pattern relative overflow-hidden">
            {/* Floating Cat Elements */}
            <div className="cat-float top-16 left-8 cat-float-delayed">
                <GiCat className="w-14 h-14 text-green-300" />
            </div>
            <div className="cat-float top-32 right-16 cat-float-slow">
                <GiPawPrint className="w-10 h-10 text-pink-300" />
            </div>
            <div className="cat-float bottom-32 left-1/5">
                <GiCat className="w-18 h-18 text-blue-300" />
            </div>
            <div className="cat-float top-2/3 right-1/4 cat-float-delayed">
                <GiPawPrint className="w-12 h-12 text-purple-300" />
            </div>
            <div className="cat-float bottom-1/4 right-8">
                <GiCat className="w-16 h-16 text-orange-300" />
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
                                    <span className="cat-text-gradient-warm">Post-Adoption</span>
                                    <br />
                                    <span className="cat-text-gradient-cool">Guide</span>
                                </h1>
                                <div className="flex justify-center items-center gap-4 mb-6">
                                    <div className="animate-paw-wave text-4xl">🏠</div>
                                    <div className="animate-cat-bounce text-4xl">😸</div>
                                    <div className="animate-paw-wave text-4xl">💝</div>
                                </div>
                                <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
                                    Welcome to cat parenthood! This comprehensive guide will help you and your new feline 
                                    companion navigate the first weeks and months together, ensuring a smooth transition 
                                    to their forever home.
                                </p>
                            </div>
                        </div>

                        {/* Adoption Steps Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                            {adoptionSteps.map((step, index) => (
                                <div
                                    key={index}
                                    className="cat-card group hover:scale-105 transition-all duration-500 h-full flex flex-col"
                                    style={{
                                        animationDelay: `${index * 100}ms`,
                                        transform: 'translateY(0)',
                                        opacity: 1
                                    }}
                                >
                                    {/* Gradient Top Bar */}
                                    <div className={`h-2 bg-gradient-to-r ${step.gradient} rounded-t-3xl`}></div>
                                    
                                    <div className="p-8 flex flex-col flex-grow bg-white/90 backdrop-blur-sm rounded-b-3xl">
                                        {/* Icon and Title */}
                                        <div className="flex items-center mb-6">
                                            <div className="text-5xl mr-4 animate-purr group-hover:animate-cat-bounce">
                                                {step.icon}
                                            </div>
                                            <div>
                                                <h2 className={`text-2xl font-bold font-patrick ${step.color}`}>
                                                    {step.title}
                                                </h2>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className={`relative mb-6 p-4 rounded-2xl ${step.bgColor}`}>
                                            <p className="text-gray-700 italic text-lg leading-relaxed">
                                                {step.description}
                                            </p>
                                        </div>

                                        {/* Features */}
                                        <div className="flex-grow">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                                <span className="animate-whisker-twitch mr-2">✅</span>
                                                Action Items
                                            </h3>
                                            <ul className="space-y-3">
                                                {step.features.map((feature, i) => (
                                                    <li
                                                        key={i}
                                                        className={`flex items-start text-gray-700 p-2 rounded-lg ${step.hoverBg} transition-all duration-300 group/item`}
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

                        {/* Emergency Tips Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                            {emergencyTips.map((tip, index) => (
                                <div
                                    key={index}
                                    className="cat-card group hover:scale-105 transition-all duration-500"
                                    style={{
                                        transform: 'translateY(0)',
                                        opacity: 1
                                    }}
                                >
                                    {/* Gradient Top Bar */}
                                    <div className={`h-2 bg-gradient-to-r ${tip.gradient} rounded-t-3xl`}></div>
                                    
                                    <div className="p-8 bg-white/90 backdrop-blur-sm rounded-b-3xl">
                                        {/* Icon and Title */}
                                        <div className="flex items-center mb-6">
                                            <div className="text-5xl mr-4 animate-purr group-hover:animate-cat-bounce">
                                                {tip.icon}
                                            </div>
                                            <div>
                                                <h3 className={`text-2xl font-bold font-patrick ${tip.color}`}>
                                                    {tip.title}
                                                </h3>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className={`relative mb-6 p-4 rounded-2xl ${tip.bgColor}`}>
                                            <p className="text-gray-700 italic text-lg leading-relaxed">
                                                {tip.description}
                                            </p>
                                        </div>

                                        {/* Signs List */}
                                        <ul className="space-y-3">
                                            {tip.signs.map((sign, i) => (
                                                <li
                                                    key={i}
                                                    className={`flex items-start text-gray-700 p-2 rounded-lg ${tip.hoverBg} transition-all duration-300 group/item`}
                                                >
                                                    <span className="text-lg mr-3 mt-0.5 group-hover/item:animate-paw-wave">⚠️</span>
                                                    <span className="leading-relaxed">{sign}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Remember Section */}
                        <div className="cat-card p-10" style={{opacity: 1, transform: 'translateY(0)'}}>
                            <div className="text-center">
                                <div className="flex justify-center items-center gap-4 mb-8">
                                    <div className="animate-cat-bounce text-5xl">💝</div>
                                    <h2 className="text-4xl font-bold font-patrick text-pink-600">
                                        Remember: Patience is Key
                                    </h2>
                                    <div className="animate-cat-bounce text-5xl">💝</div>
                                </div>
                                
                                <p className="text-xl text-gray-700 mb-10 max-w-5xl mx-auto leading-relaxed">
                                    Every cat adjusts at their own pace. Some may feel at home within days, while others need 
                                    several weeks to fully settle in. Trust the process, follow your veterinarian's guidance, 
                                    and enjoy building a lifelong bond with your new companion.
                                </p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
                                    {[
                                        { icon: "⏰", title: "Take Your Time", desc: "Allow 2-4 weeks for full adjustment", color: "text-blue-600", bgColor: "bg-blue-50" },
                                        { icon: "📞", title: "Stay Connected", desc: "Keep in touch with your veterinarian", color: "text-purple-600", bgColor: "bg-purple-50" },
                                        { icon: "💕", title: "Show Love", desc: "Gentle patience builds trust", color: "text-pink-600", bgColor: "bg-pink-50" }
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