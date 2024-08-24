"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isSticky, setIsSticky] = useState(false);
    const [language, setLanguage] = useState("EN");

    const menuVariants = {
        hidden: { opacity: 0, x: -100, transition: { duration: 0.5 } },
        visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    };

    const handleLanguageSwitch = (lang: string) => {
        setLanguage(lang);
    };

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsSticky(true);
            } else {
                setIsSticky(false);
            }
        };
        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    return (
        <motion.header
            className={`p-2 w-full  top-0 z-50 ${isSticky ? 'bg-gray-200 text-black' : 'bg-gray-200 text-black'} fixed transition-all ease-in-out duration-300`}
            animate={{ height: isSticky ? 55 : 65 }} // Changes height on scroll
        >
            <div className="container mx-auto flex justify-between items-center">
                {/* Logo */}
                <div className="text-2xl font-bold">
                    <img src="/logo.svg" alt="RCC Logo" className={`inline-block mr-3 ${isSticky ? 'h-10 w-10' : 'h-10 w-10'}`} />
                    <Link href="/">RCC</Link>
                </div>

                {/* Links */}
                <div className="flex items-center space-x-6">
                    <nav className="hidden md:flex space-x-6">
                        <Link href="/about" className="hover:text-gray-400">About</Link>
                        <Link href="/services" className="hover:text-gray-400">Services</Link>
                        <Link href="/contact" className="hover:text-gray-400">Contact</Link>
                    </nav>

                    {/* Language Switcher */}
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handleLanguageSwitch("DE")}
                            className={`hover:text-gray-400 ${language === "DE" ? "font-bold" : ""}`}
                        >
                            DE
                        </button>
                        <span>|</span>
                        <button
                            onClick={() => handleLanguageSwitch("EN")}
                            className={`hover:text-gray-400 ${language === "EN" ? "font-bold" : ""}`}
                        >
                            EN
                        </button>
                    </div>

                    {/* Hamburger Menu (Visible on mobile) */}
                    <div className="md:hidden">
                        <button onClick={() => setMenuOpen(!menuOpen)}>
                            {menuOpen ? (
                                <XMarkIcon className="h-6 w-6 text-red-500 hover:text-red-700" />
                            ) : (
                                <Bars3Icon className="h-6 w-6 text-blue-500 hover:text-blue-700" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <motion.nav
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={menuVariants}
                    className="md:hidden mt-4 flex flex-col items-end space-y-4"
                >
                    <Link href="/about" className="block  text-lg hover:text-gray-400">About</Link>
                    <Link href="/services" className="block text-lg hover:text-gray-400">Services</Link>
                    <Link href="/contact" className="block text-lg hover:text-gray-400">Contact</Link>
                </motion.nav>
            )}
        </motion.header>
    );
}
