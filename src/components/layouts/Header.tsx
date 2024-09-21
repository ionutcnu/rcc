// components/Header.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import LanguageSwitcher from '@components/elements/LanguageSwitcher';
import MobileMenu from '@components/elements/MobileMenu';

import { useTranslation } from 'react-i18next';

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isSticky, setIsSticky] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        const handleScroll = () => {
            setIsSticky(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);

        // Cleanup function
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <motion.header
            className="p-2 w-full top-0 z-50 bg-gray-200 text-black fixed transition-all duration-300"
            animate={{ height: isSticky ? 55 : 65 }}
        >
            <div className="container mx-auto flex justify-between items-center">
                {/* Logo */}
                <div className="text-2xl font-bold flex items-center">
                    <img
                        src="/logo.svg"
                        alt="RCC Logo"
                        className="inline-block mr-3 h-10 w-10"
                    />
                    <Link href="/">RCC</Link>
                </div>

                {/* Navigation and Language Switcher */}
                <div className="flex items-center space-x-6">
                    <nav className="hidden md:flex space-x-6">
                        <Link href="/" className="hover:text-gray-400">
                            {t('header.home')}
                        </Link>
                        <Link href="/cats" className="hover:text-gray-400">
                            {t('header.cats')}
                        </Link>
                        <Link href="/contact" className="hover:text-gray-400">
                            {t('header.contact')}
                        </Link>
                    </nav>

                    {/* Language Switcher */}
                    <LanguageSwitcher />

                    {/* Hamburger Menu (Visible on mobile) */}
                    <div className="md:hidden">
                        <button onClick={() => setMenuOpen(!menuOpen)}>
                            {!menuOpen && (
                                <Bars3Icon className="h-6 w-6 text-blue-500 hover:text-blue-700" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
        </motion.header>
    );
}
