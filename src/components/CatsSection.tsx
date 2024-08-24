"use client";
import Image from "next/image";

export default function CatsSection() {
    const cats = [
        {
            name: "Gura mare",
            description: "Very active and playful, Misty is your trusting buddy when it comes to keeping rats away!",
            image: "/Cats/cat1.jpg",
        },
        {
            name: "Veve",
            description: "She's grumpy and always demands food, but also likes to cuddle in the couch or bed.",
            image: "/Cats/cat3.jpg",
        },
        {
            name: "Ollie",
            description: "He likes to run around and play hide-and-seek. He also loves head and belly rubs!",
            image: "/Cats/cat1.jpg",
        },
    ];

    return (
        <section className="bg-[#1C1C21] text-white py-16">
            <div className="container mx-auto text-center">
                {/* Title and subtitle */}
                <h2 className="text-4xl font-semibold mb-4">Meow, meow meow...</h2>
                <p className="text-xl mb-12">"Hello, we need a new home..."</p>

                {/* Cat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {cats.map((cat, index) => (
                        <div key={index} className="bg-white text-black rounded-lg overflow-hidden shadow-lg">
                            <Image
                                src={cat.image}
                                alt={cat.name}
                                className="object-cover h-56 w-full"
                                width={400}
                                height={300}
                            />
                            <div className="p-6">
                                <h3 className="text-2xl font-bold mb-2">{cat.name}</h3>
                                <p className="text-gray-700">{cat.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Call to Action */}
                <p className="mt-12 text-lg">
                    Rescued from the streets of Spain, these felines are treated with love, care, and full vaccinations.
                </p>
                <p className="text-lg">They’re now healthy and excited to meet their new owners!</p>
                <a href="/cats" className="text-yellow-500 mt-4 inline-block text-lg hover:underline">
                    See all cats &gt;
                </a>
            </div>
        </section>
    );
}
