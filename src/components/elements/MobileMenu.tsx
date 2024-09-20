// components/MobileMenu.tsx

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

type MobileMenuProps = {
    onClose: () => void;
};

const MobileMenu: React.FC<MobileMenuProps> = ({ onClose }) => {
    const { t } = useTranslation();

    const menuVariants = {
        hidden: { opacity: 0, x: -100 },
        visible: { opacity: 1, x: 0 },
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={menuVariants}
            className="md:hidden fixed top-0 left-0 w-full bg-black bg-opacity-80 z-20 flex flex-col items-center p-4"
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white text-3xl"
            >
                ✕
            </button>
            <nav className="mt-4 w-full text-center">
                <Link
                    href="/"
                    className="block text-2xl text-white hover:text-gray-400 py-4"
                    onClick={onClose}
                >
                    {t('home')}
                </Link>
                <Link
                    href="/cats"
                    className="block text-2xl text-white hover:text-gray-400 py-4"
                    onClick={onClose}
                >
                    {t('cats')}
                </Link>
                <Link
                    href="/contact"
                    className="block text-2xl text-white hover:text-gray-400 py-4"
                    onClick={onClose}
                >
                    {t('contact')}
                </Link>
            </nav>
        </motion.div>
    );
};

export default MobileMenu;
