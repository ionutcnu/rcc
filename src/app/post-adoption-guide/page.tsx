import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";

export default function PostAdoptionGuidePage() {
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
            icon: "🏡"
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
            icon: "🛠️"
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
            icon: "🍽️"
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
            icon: "🩺"
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
            icon: "🧠"
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
            icon: "📅"
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
            ]
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
            ]
        }
    ];

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            <Header />

            <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto relative">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 font-patrick">
                            <span className="inline-block align-middle mr-4">🐾</span>
                            Post-Adoption Guide
                            <span className="inline-block align-middle ml-4">🐾</span>
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Welcome to cat parenthood! This comprehensive guide will help you and your new feline companion navigate the first weeks and months together, ensuring a smooth transition to their forever home.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                        {adoptionSteps.map((step, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-lg shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 relative group h-full flex flex-col"
                            >
                                <div className="p-6 flex flex-col flex-grow">
                                    <h2 className="text-2xl font-bold text-indigo-600 mb-4 flex items-center font-patrick">
                                        <span className="mr-3 text-3xl">{step.icon}</span>
                                        {step.title}
                                    </h2>

                                    <p className="text-gray-600 mb-4 border-l-4 border-indigo-100 pl-3 italic">
                                        {step.description}
                                    </p>

                                    <div className="mb-6 flex-grow">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                            <span className="mr-2">🎀</span>
                                            Action Items:
                                        </h3>
                                        <ul className="space-y-2">
                                            {step.features.map((feature, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-start text-gray-700 before:content-['🐾'] before:mr-2 before:text-sm before:mt-0.5"
                                                >
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                        {emergencyTips.map((tip, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-lg shadow-xl p-6"
                            >
                                <h3 className="text-2xl font-bold text-red-600 mb-4 flex items-center font-patrick">
                                    <span className="mr-3">⚠️</span>
                                    {tip.title}
                                </h3>
                                <p className="text-gray-600 mb-4 italic">
                                    {tip.description}
                                </p>
                                <ul className="space-y-2">
                                    {tip.signs.map((sign, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start text-gray-700 before:content-['•'] before:mr-3 before:text-red-500 before:font-bold"
                                        >
                                            {sign}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-lg shadow-xl p-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-indigo-600 mb-6 font-patrick">
                                <span className="mr-3">💝</span>
                                Remember: Patience is Key
                                <span className="ml-3">💝</span>
                            </h2>
                            <p className="text-lg text-gray-700 mb-6 max-w-4xl mx-auto">
                                Every cat adjusts at their own pace. Some may feel at home within days, while others need several weeks to fully settle in. Trust the process, follow your veterinarian's guidance, and enjoy building a lifelong bond with your new companion.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                <div className="text-center">
                                    <div className="text-4xl mb-2">⏰</div>
                                    <h3 className="font-semibold text-gray-800">Take Your Time</h3>
                                    <p className="text-gray-600">Allow 2-4 weeks for full adjustment</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl mb-2">📞</div>
                                    <h3 className="font-semibold text-gray-800">Stay Connected</h3>
                                    <p className="text-gray-600">Keep in touch with your veterinarian</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl mb-2">💕</div>
                                    <h3 className="font-semibold text-gray-800">Show Love</h3>
                                    <p className="text-gray-600">Gentle patience builds trust</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}