"use client";
import React from "react";

export default function AboutMe() {
    return (
        <section className="bg-gray-200 dark:bg-gray-800 py-12">
            <div className="container mx-auto max-w-6xl">
                <h2 className="text-4xl font-bold text-center mb-6 text-gray-900 dark:text-white">
                    Meet Felissa
                </h2>
                <div className="flex flex-col md:flex-row items-center md:space-x-8">
                    {/* Image */}
                    <div className="md:w-1/3 mb-6 md:mb-0">
                        <img
                            src="/Images/fellisa.jpg"
                            alt="Red Cat Cuasar Felissa"
                            className="rounded-lg shadow-lg object-cover h-full"
                        />
                    </div>

                    {/* Text Content */}
                    <div className="md:w-2/3 text-gray-700 dark:text-gray-300">
                        <h3 className="text-2xl font-semibold mb-4">Felissa - Cat Enthusiast and Rescue Specialist</h3>
                        <p className="mb-4">
                            Cats have been a part of my life for as long as I can remember. Growing up with
                            these majestic creatures, I realized that their loyalty and love for their owners
                            are unmatched. Felissa is a place where I share my passion for cats and help them find
                            loving homes.
                        </p>
                        <p className="mb-4">
                            Our mission is to rescue cats and provide them with the care they deserve, ensuring
                            they are vaccinated, microchipped, and ready to find their forever home.
                        </p>
                        <p className="mb-4">
                            If you are interested in learning more about our work, feel free to explore our
                            platform and meet the wonderful cats that are ready to become part of your family.
                        </p>
                        <a
                            href="/contact"
                            className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-lg transition-colors duration-300"
                        >
                            Get in Touch
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
