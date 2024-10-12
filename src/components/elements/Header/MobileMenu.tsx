// components/MobileMenu.js
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/Utils/firebaseConfig';
import GoogleTranslate from '@/Utils/LanguageSwitcher';

export default function MobileMenu() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(!!auth.currentUser);
    const router = useRouter();

    const menuVariants = {
        hidden: { opacity: 0, x: -100, transition: { duration: 0.5 } },
        visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    };

    useEffect(() => {
        // Authentication state listener
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setIsAuthenticated(!!user);
        });
        return () => unsubscribe();
    }, []);

    const toggleMenu = () => setMenuOpen(!menuOpen);

    return (
        <>
            {/* Hamburger Button */}
            <div className="md:hidden">
                <button onClick={toggleMenu}>
                    {menuOpen ? (
                        <svg className="h-6 w-6 text-blue-500 hover:text-blue-700" viewBox="0 0 24 24">
                            {/* X icon */}
                            <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    ) : (
                        <svg className="h-6 w-6 text-blue-500 hover:text-blue-700" viewBox="0 0 24 24">
                            {/* Hamburger icon */}
                            <path
                                d="M4 6h16M4 12h16M4 18h16"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    )}
                </button>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={menuVariants}
                    className="md:hidden fixed inset-0 bg-black bg-opacity-80 z-40 flex flex-col items-center p-4"
                >
                    <button
                        onClick={toggleMenu}
                        className="absolute top-4 right-4 text-white text-3xl"
                    >
                        ✕
                    </button>
                    <nav className="mt-12 w-full text-center space-y-4">
                        <Link href="/" className="block text-2xl text-white hover:text-gray-400" onClick={toggleMenu}>
                            Home
                        </Link>
                        <Link href="/cats" className="block text-2xl text-white hover:text-gray-400" onClick={toggleMenu}>
                            Cats
                        </Link>
                        <Link href="/contact" className="block text-2xl text-white hover:text-gray-400" onClick={toggleMenu}>
                            Contact
                        </Link>
                        {isAuthenticated ? (
                            <>
                                <Link
                                    href="/profile"
                                    className="block text-2xl text-white hover:text-gray-400"
                                    onClick={toggleMenu}
                                >
                                    Profile
                                </Link>
                                <button
                                    onClick={() => {
                                        auth.signOut().then(() => {
                                            setIsAuthenticated(false);
                                            toggleMenu();
                                            router.push('/');
                                        });
                                    }}
                                    className="block text-2xl text-white hover:text-gray-400 w-full text-left px-4"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="block text-2xl text-white hover:text-gray-400"
                                    onClick={toggleMenu}
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="block text-2xl text-white hover:text-gray-400"
                                    onClick={toggleMenu}
                                >
                                    Register
                                </Link>
                            </>
                        )}
                        <div className="mt-4">
                            <GoogleTranslate />
                        </div>
                    </nav>
                </motion.div>
            )}
        </>
    );
}
