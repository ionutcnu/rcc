import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";

export default function LivingConditionsPage() {
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
            icon: "🍽️"
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
            icon: "🏠"
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
            icon: "🩺"
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
            icon: "🧩"
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
            icon: "✨"
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
            icon: "❤️"
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
                            Optimal Living Conditions
                            <span className="inline-block align-middle ml-4">🐾</span>
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Our cats enjoy the finest living conditions, combining premium Royal Canin nutrition with comprehensive care for their physical and emotional well-being.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {livingAspects.map((aspect, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-lg shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 relative group h-full flex flex-col"
                            >
                                <div className="p-6 flex flex-col flex-grow">
                                    <h2 className="text-2xl font-bold text-indigo-600 mb-4 flex items-center font-patrick">
                                        <span className="mr-3 text-3xl">{aspect.icon}</span>
                                        {aspect.title}
                                    </h2>

                                    <p className="text-gray-600 mb-4 border-l-4 border-indigo-100 pl-3 italic">
                                        {aspect.description}
                                    </p>

                                    <div className="mb-6 flex-grow">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                            <span className="mr-2">🎀</span>
                                            Key Features:
                                        </h3>
                                        <ul className="space-y-2">
                                            {aspect.features.map((feature, i) => (
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

                    <div className="mt-16 bg-white rounded-lg shadow-xl p-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-indigo-600 mb-6 font-patrick">
                                <span className="mr-3">👑</span>
                                Royal Canin Partnership
                                <span className="ml-3">👑</span>
                            </h2>
                            <p className="text-lg text-gray-700 mb-6 max-w-4xl mx-auto">
                                We proudly use Royal Canin premium nutrition products, scientifically formulated to meet the specific nutritional needs of different cat breeds, ages, and lifestyles. This partnership ensures our cats receive the highest quality nutrition available.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                <div className="text-center">
                                    <div className="text-4xl mb-2">🔬</div>
                                    <h3 className="font-semibold text-gray-800">Scientific Formula</h3>
                                    <p className="text-gray-600">Research-based nutrition</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl mb-2">🎯</div>
                                    <h3 className="font-semibold text-gray-800">Breed Specific</h3>
                                    <p className="text-gray-600">Tailored to individual needs</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl mb-2">💎</div>
                                    <h3 className="font-semibold text-gray-800">Premium Quality</h3>
                                    <p className="text-gray-600">Only the finest ingredients</p>
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