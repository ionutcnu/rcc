"use client";
import { useParams } from 'next/navigation';
import Header from "@/components/layouts/Header";
import { cats } from '@/app/data/catsData';
import Image from 'next/image';
export default function CatProfile() {
    const { alias } = useParams();

    // Find the matching cat by alias
    const cat = cats.find((c) => c.alias === alias);

    if (!cat) {
        return (
            <div>
                <Header />
                <p className="text-white">Cat not found.</p>
            </div>
        );
    }
    return (
        <>
            <Header />
            <div className="bg-[#1C1C21] text-white min-h-screen">
                <div className="bg-[#A3947C] text-center py-20">
                    <h1 className="text-5xl font-bold">{cat.name}</h1>
                    <p className="text-xl mt-4">{cat.description}</p>
                </div>

                <div className="container mx-auto py-16 px-8 flex flex-col lg:flex-row gap-16">
                    <div className="lg:w-1/2">
                        <Image
                            src={cat.image}  // Dynamic image from the cat object
                            alt={cat.name}   // Alt text for accessibility
                            className="rounded-lg shadow-lg"
                            width={500}
                            height={500}
                            // Optionally, layout="intrinsic" can help with responsive image rendering
                        />
                    </div>

                    <div className="lg:w-1/2 text-left">
                        <h2 className="text-3xl font-bold mb-4">{cat.name} is looking for a new home!</h2>
                        <h3 className="text-xl font-semibold mb-2">ABOUT:</h3>
                        <p className="text-gray-400 leading-relaxed mb-6">
                            {cat.description}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
