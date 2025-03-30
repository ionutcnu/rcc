'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTree } from 'react-icons/fa';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cats } from '@/app/data/catsData';

// === TYPES ===
interface Cat {
    id: number;
    name: string;
    alias: string;
    mainImage: string;
    motherId?: number;
    fatherId?: number;
    children?: Cat[];
}

// === UTILS ===
function buildFamilyTree(cats: Cat[], rootCatId: number): Cat | undefined {
    const map = new Map<number, Cat>();
    cats.forEach(cat => map.set(cat.id, { ...cat, children: [] }));
    cats.forEach(cat => {
        const currentCat = map.get(cat.id)!;
        if (cat.motherId && map.has(cat.motherId)) {
            map.get(cat.motherId)!.children!.push(currentCat);
        }
        if (cat.fatherId && map.has(cat.fatherId)) {
            map.get(cat.fatherId)!.children!.push(currentCat);
        }
    });
    return map.get(rootCatId);
}

// === COMPONENT: Cat Node ===
const CatNode = ({ cat }: { cat: Cat }) => {
    return (
        <div
            onClick={() => window.location.href = `/cat-profile/${cat.alias}`}
            className="flex flex-col items-center cursor-pointer group min-w-[7rem] max-w-[8rem]"
        >
            <img
                src={cat.mainImage}
                alt={cat.name}
                className="w-28 h-28 object-cover rounded-full shadow-md group-hover:scale-105 transition-transform"
            />
            <span className="mt-3 text-center text-black text-xl font-bold tracking-tight group-hover:underline break-words leading-tight">
    {cat.name}
  </span>
        </div>
    );
};

// === COMPONENT: Recursive Tree ===
const FamilyTree = ({ data, isRoot = true }: { data: Cat; isRoot?: boolean }) => {
    const [isExpanded, setIsExpanded] = useState(isRoot);
    const toggleExpand = () => setIsExpanded(!isExpanded);
    const childrenRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (isExpanded && childrenRef.current) {
            const timeout = setTimeout(() => {
                childrenRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300); // match the animation duration

            return () => clearTimeout(timeout);
        }
    }, [isExpanded]);

    return (
        <div className={`flex flex-col items-center ${isRoot ? '' : 'mt-8'}`}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
            >
                <CatNode cat={data} />

                {data.children && data.children.length > 0 && (
                    <button
                        onClick={toggleExpand}
                        className="mt-2 h-8 w-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:text-black hover:border-black transition"
                    >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                )}
            </motion.div>

            <AnimatePresence>
                {isExpanded && data.children && (
                    <motion.div
                        ref={childrenRef}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex gap-12 mt-6 pt-6 border-t border-gray-300"
                    >
                        {data.children.map((child, index) => {
                            const relation = child.motherId === data.id ? 'Mother' : child.fatherId === data.id ? 'Father' : '';
                            return (
                                <div key={index} className="flex flex-col items-center px-3">
                                    <div className="mb-2 text-sm text-gray-500 tracking-wide uppercase">{relation}</div>
                                    <div className="h-6 w-px bg-gray-300 mb-2" />
                                    <FamilyTree data={child} isRoot={false} />
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// === COMPONENT: Popup Wrapper ===
const ParentInfoPopup: React.FC<{ currentCatId: number }> = ({ currentCatId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const currentCat = cats.find((c) => c.id === currentCatId);

    const familyData = currentCat
        ? (function buildFamilyTree(cats: Cat[], rootId: number): Cat | undefined {
            const map = new Map<number, Cat & { children: Cat[] }>();

            cats.forEach((cat) => {
                map.set(cat.id, { ...cat, children: [] });
            });

            cats.forEach((cat) => {
                const current = map.get(cat.id)!;
                if (cat.motherId && map.has(cat.motherId)) {
                    map.get(cat.motherId)!.children.push(current);
                }
                if (cat.fatherId && map.has(cat.fatherId)) {
                    map.get(cat.fatherId)!.children.push(current);
                }
            });

            return map.get(rootId);
        })(cats, currentCatId)
        : null;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-3 px-5 py-3 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-xl font-semibold text-base shadow-sm transition"
            >
                <FaTree className="w-5 h-5" />
                <span>View Family Tree</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="relative bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto"
                        >
                            {/* Sticky Close Button */}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="sticky top-4 left-full -translate-x-full z-30 w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 hover:text-black hover:border-black transition-shadow shadow-sm hover:shadow-md"
                                aria-label="Close modal"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10 3.636 5.05a1 1 0 011.414-1.414L10 8.586z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>

                            {/* Modal Scrollable Content */}
                            <div className="p-8">
                                <h2 className="text-2xl font-semibold text-center w-full text-gray-800 mb-6">
                                    {currentCat?.name}'s Genealogy
                                </h2>

                                <div className="overflow-x-auto w-full">
                                    <div className="min-w-fit flex justify-center">
                                        {familyData ? (
                                            <FamilyTree data={familyData} />
                                        ) : (
                                            <p className="text-center text-gray-500">No family tree available.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-10 flex justify-center">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-md text-sm font-medium"
                                    >
                                        Close Diagram
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ParentInfoPopup;