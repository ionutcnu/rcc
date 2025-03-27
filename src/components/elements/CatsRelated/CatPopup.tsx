// components/CatPopup.tsx
"use client";
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface CatPopupProps {
    message: string;
    visible: boolean;
    onClose: () => void;
}

const CatPopup = ({ message, visible, onClose }: CatPopupProps) => {
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(onClose, 4000);
            return () => clearTimeout(timer);
        }
    }, [visible, onClose]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="fixed top-4 right-4 flex items-center gap-3 bg-[#5C6AC4] text-white shadow-lg py-4 px-6 rounded-lg z-50"
                >
                    <CheckCircle size={24} />
                    <p className="font-semibold">{message}</p>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CatPopup;
