'use client';

import { useState } from 'react';
import { auth } from '@/Utils/firebaseConfig';
import { useRouter } from 'next/navigation';

export default function ProfileDropdown() {
    const [menuOpen, setMenuOpen] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        await auth.signOut();
        router.push('/login'); // Redirect to login after logging out
    };

    return (
        <div className="relative inline-block text-left">
            {/* Profile Icon and Dropdown Trigger */}
            <div>
                <button
                    type="button"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center space-x-2 bg-gray-200 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    id="menu-button"
                    aria-expanded="true"
                    aria-haspopup="true"
                >
                    <span className="sr-only">Open user menu</span>
                    {/* User Icon */}
                    <svg
                        className="w-6 h-6 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5.121 19.073A10 10 0 1019.073 5.121 10 10 0 005.121 19.073zM15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        ></path>
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Your Account</span>
                </button>
            </div>

            {/* Dropdown Menu */}
            {menuOpen && (
                <div
                    className="absolute right-0 mt-2 w-56 origin-top-right rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="menu-button"
                    tabIndex={-1}
                >
                    <div className="py-1" role="none">
                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            role="menuitem"
                            tabIndex={-1}
                        >
                            Log out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
