"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { GiCat, GiPawPrint, GiHearts } from "react-icons/gi";

export default function MeetFelissa() {
    const [isVisible, setIsVisible] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <section className="relative cat-bg-pattern overflow-hidden py-20">
            {/* Floating Cat Elements */}
            <div className="cat-float top-10 right-20">
                <GiCat className="w-16 h-16 text-pink-300" />
            </div>
            <div className="cat-float bottom-10 left-10 cat-float-delayed">
                <GiPawPrint className="w-12 h-12 text-blue-300" />
            </div>
            <div className="cat-float top-1/2 right-10 cat-float-slow">
                <GiHearts className="w-10 h-10 text-red-300" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    {/* Header Section */}
                    <div className="text-center mb-16">
                        <div className="animate-cat-bounce mb-6">
                            <GiHearts className="w-16 h-16 cat-text-gradient-warm mx-auto" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold cat-text-gradient-cool mb-4">
                            Meet Felissa
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            The heart and soul behind Red Cat Cuasar 💝
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
                        {/* Image Section */}
                        <div className="relative group">
                            <div className="cat-card p-6 cat-hover-lift">
                                <div className="relative overflow-hidden rounded-3xl">
                                    <Image
                                        src="/Images/felissa.jpg"
                                        alt="Felissa holding a cat"
                                        width={800}
                                        height={600}
                                        className={`object-cover w-full h-auto transition-all duration-700 group-hover:scale-105 ${
                                            imageLoaded ? 'opacity-100' : 'opacity-0'
                                        }`}
                                        onLoad={() => setImageLoaded(true)}
                                        priority
                                    />
                                    
                                    {/* Overlay with floating hearts */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    
                                    {/* Decorative corner elements */}
                                    <div className="absolute top-4 right-4 animate-purr">
                                        <GiCat className="w-8 h-8 text-white/70" />
                                    </div>
                                    <div className="absolute bottom-4 left-4 animate-paw-wave">
                                        <GiPawPrint className="w-6 h-6 text-white/70" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="space-y-8">
                            <div className="cat-card p-8 relative">
                                {/* Title with animated icon */}
                                <div className="flex items-center mb-6">
                                    <div className="animate-cat-bounce mr-4">
                                        <GiHearts className="w-10 h-10 text-red-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl md:text-3xl font-bold cat-text-gradient-warm">
                                            Cat Enthusiast & Rescue Specialist
                                        </h3>
                                        <div className="flex items-center mt-2">
                                            <GiPawPrint className="w-4 h-4 text-orange-500 mr-2" />
                                            <span className="text-gray-600 font-medium">Founder of Red Cat Cuasar</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Story Content */}
                                <div className="space-y-6 text-gray-700 leading-relaxed">
                                    <div className="relative pl-6">
                                        <div className="absolute left-0 top-2">
                                            <GiCat className="w-4 h-4 text-pink-500" />
                                        </div>
                                        <p className="text-lg">
                                            Cats have been a part of my life for as long as I can remember. Growing up surrounded by these magnificent creatures, 
                                            I discovered my calling to help homeless and abandoned cats find their forever homes. Each whisker, each purr, 
                                            each gentle head bump reminds me why this work is so important.
                                        </p>
                                    </div>

                                    <div className="relative pl-6">
                                        <div className="absolute left-0 top-2">
                                            <GiHearts className="w-4 h-4 text-red-500" />
                                        </div>
                                        <p className="text-lg">
                                            Our mission at Red Cat Cuasar is to rescue, rehabilitate, and rehome cats in need while educating our community 
                                            about responsible pet ownership. Every cat deserves love, care, and a warm home where they can thrive. 
                                            Together, we&apos;re changing lives - both feline and human.
                                        </p>
                                    </div>

                                    <div className="relative pl-6">
                                        <div className="absolute left-0 top-2">
                                            <GiPawPrint className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <p className="text-lg">
                                            If you&apos;re interested in learning more about our cats, adoption process, or how you can help support our mission, 
                                            I&apos;d love to hear from you! Whether you&apos;re looking to adopt, volunteer, or simply want to share your own cat stories,
                                            every connection makes our community stronger.
                                        </p>
                                    </div>
                                </div>

                                {/* Stats or highlights */}
                                <div className="mt-8 grid grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-gradient-to-b from-pink-50 to-red-50 rounded-xl">
                                        <div className="animate-cat-bounce">
                                            <GiCat className="w-8 h-8 text-pink-500 mx-auto mb-2" />
                                        </div>
                                        <div className="text-2xl font-bold text-pink-600">200+</div>
                                        <div className="text-sm text-gray-600">Cats Rescued</div>
                                    </div>
                                    <div className="text-center p-4 bg-gradient-to-b from-blue-50 to-indigo-50 rounded-xl">
                                        <div className="animate-purr">
                                            <GiHearts className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                                        </div>
                                        <div className="text-2xl font-bold text-blue-600">150+</div>
                                        <div className="text-sm text-gray-600">Happy Families</div>
                                    </div>
                                    <div className="text-center p-4 bg-gradient-to-b from-orange-50 to-yellow-50 rounded-xl">
                                        <div className="animate-paw-wave">
                                            <GiPawPrint className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                                        </div>
                                        <div className="text-2xl font-bold text-orange-600">5+</div>
                                        <div className="text-sm text-gray-600">Years Experience</div>
                                    </div>
                                </div>

                                {/* Call to Action */}
                                <div className="mt-8 text-center">
                                    <a
                                        href="/contact"
                                        className="cat-button-primary inline-flex items-center text-lg px-8 py-4"
                                    >
                                        <GiHearts className="mr-3 w-5 h-5 animate-purr" />
                                        Get in Touch
                                        <GiPawPrint className="ml-3 w-5 h-5 animate-paw-wave" />
                                    </a>
                                    <p className="mt-3 text-sm text-gray-500">
                                        Let&apos;s chat about finding your purrfect companion! 🐱
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}