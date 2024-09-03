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
            animate={{ height: isSticky ? 55 : 65 }}
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
                        <Link href="/" className="hover:text-gray-400" >Home</Link>
                        <Link href="/cats" className="hover:text-gray-400" >Cats</Link>
                        <Link href="/contact" className="hover:text-gray-400 ">Contact</Link>
                    </nav>

                    {/* Language Switcher */}
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handleLanguageSwitch("RO")}
                            className={`hover:text-gray-400  ${language === "DE" ? "font-bold" : ""}`}
                        >
                            RO
                        </button>
                        <span>|</span>
                        <button
                            onClick={() => handleLanguageSwitch("EN")}
                            className={`hover:text-gray-400  ${language === "EN" ? "font-bold" : ""}`}
                        >
                            EN
                        </button>
                    </div>

                    {/* Hamburger Menu (Visible on mobile) */}
                    <div className="md:hidden">
                        <button onClick={() => setMenuOpen(!menuOpen)}>
                            {!menuOpen &&
                           (
                              <Bars3Icon className="h-6 w-6 text-blue-500 hover:text-blue-700" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {menuOpen && (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={menuVariants}
                    className="md:hidden fixed top-0 left-0 w-full bg-black bg-opacity-80 z-20 flex flex-col items-center p-4"
                >
                    <button onClick={() => setMenuOpen(false)} className="absolute top-4 right-4 text-white text-3xl">
                        ✕
                    </button>
                    <nav className="mt-4 w-full text-center">
                        <Link href="/" className="block text-2xl text-white hover:text-gray-400 py-4">Home</Link>
                        <Link href="/cats" className="block text-2xl text-white hover:text-gray-400 py-4">Cats</Link>
                        <Link href="/contact" className="block text-2xl text-white hover:text-gray-400 py-4">Contact</Link>
                    </nav>
                </motion.div>
            )}
        </motion.header>
    );
}
