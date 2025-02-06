import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";

export default function CatClubsPage() {
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
            website: "https://www.sofisticat.ro/"
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
            website: "https://www.fnfr.ro"
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
            website: "https://www.fifeweb.org"
        }
    ];

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            <Header />

            <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto relative">
                    <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8 font-patrick">
                        <span className="inline-block align-middle mr-4">🐾</span>
                        Feline Elite Clubs
                        <span className="inline-block align-middle ml-4">🐾</span>
                    </h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {clubs.map((club, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-lg shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 relative group h-full flex flex-col"
                            >
                                <div className="p-6 flex flex-col flex-grow">
                                    <h2 className="text-2xl font-bold text-indigo-600 mb-4 flex items-center font-patrick">
                                        <span className="mr-2">🐈</span>
                                        {club.name}
                                    </h2>

                                    <p className="text-gray-600 mb-4 border-l-4 border-indigo-100 pl-3 italic">
                                        {club.description}
                                    </p>

                                    <div className="mb-6 flex-grow">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                                            <span className="mr-2">🎀</span>
                                            Membership Benefits:
                                        </h3>
                                        <ul className="space-y-2">
                                            {club.benefits.map((benefit, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-start text-gray-700 before:content-['🐾'] before:mr-2 before:text-sm"
                                                >
                                                    {benefit}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="mt-auto pt-4">
                                        <a
                                            href={club.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block w-full bg-indigo-600 text-white px-4 py-2 rounded-md text-center hover:bg-indigo-700 transition-all duration-300 hover:-translate-y-1"
                                        >
                                            Visit Website 🐾
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}