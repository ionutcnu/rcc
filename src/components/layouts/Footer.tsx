"use client";
import { FaFacebookF, FaTwitter, FaInstagram, FaTiktok } from "react-icons/fa";
import { GiCat, GiPartyPopper, GiPawPrint } from "react-icons/gi";
import { IoLogoOctocat } from "react-icons/io5";
import { BiSolidCat } from "react-icons/bi";
import { TbCat } from "react-icons/tb";

export default function Footer() {
    return (
        <footer className="bg-[#F4F6FA] text-[#2E2E2E] p-8 border-t-2 border-[#5C6AC4] relative">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">


                {/* Top-left corner, more space from top */}
                <div className="absolute hidden md:block top-24 right-[55%] opacity-50">
                    <IoLogoOctocat className="w-14 h-14 transform rotate-12 text-red-600" />
                </div>

                {/* Decorative Paw Print (somewhere in the middle-top) */}
                <div className="absolute top-10 right-[35%] opacity-50">
                    <GiPawPrint className="w-16 h-16 transform rotate-12 text-red-600" />
                </div>

                {/* Bottom-left, near edge horizontally and a bit up */}
                <div className="absolute hidden md:block bottom-15 left-[22%] opacity-50">
                    <TbCat className="w-20 h-20 transform -rotate-6 text-red-600" />
                </div>

                {/* Bottom-right (larger cat) */}
                <div className="absolute hidden md:block bottom-9 right-[9%] opacity-60">
                    <GiCat className="w-40 h-40 transform rotate-4 text-red-600" />
                </div>

                {/* Brand Section */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <GiCat className="w-8 h-8 text-red-600" />
                        <h3 className="text-2xl font-bold font-paw tracking-wide text-[#FF6B6B]">
                            Red Cat Cuasar
                        </h3>
                    </div>
                    <div className="space-y-1 text-sm">
                        <p className="flex items-center gap-2">
                            <GiPawPrint className="text-red-600" />
                            <span>Pitesti</span>
                        </p>
                        <p className="flex items-center gap-2">
                            <GiPawPrint className="text-red-600" />
                            <a
                                href="mailto:poppsy81@yahoo.com"
                                className="transition-colors hover:text-[#3F4EB3]"
                            >
                                poppsy81@yahoo.com
                            </a>
                        </p>
                    </div>
                </div>

                {/* CAT Section */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <GiCat className="text-red-600" />
                        CAT
                    </h3>
                    <nav className="space-y-2">
                        <a
                            href="/contract"
                            className="block transition-colors hover:text-[#3F4EB3] group"
                        >
              <span className="flex items-center gap-1">
                <GiPawPrint className="text-red-600 group-hover:animate-bounce" />
                Contract
              </span>
                        </a>
                        <a
                            href="/process"
                            className="block transition-colors hover:text-[#3F4EB3] group"
                        >
              <span className="flex items-center gap-1">
                <GiPawPrint className="text-red-600 group-hover:animate-bounce" />
                Adoption Process
              </span>
                        </a>
                        <a
                            href="/conditions"
                            className="block transition-colors hover:text-[#3F4EB3] group"
                        >
              <span className="flex items-center gap-1">
                <GiPawPrint className="text-red-600 group-hover:animate-bounce" />
                Living Conditions
              </span>
                        </a>
                        <a
                            href="/guide"
                            className="block transition-colors hover:text-[#3F4EB3] group"
                        >
              <span className="flex items-center gap-1">
                <GiPawPrint className="text-red-600 group-hover:animate-bounce" />
                Post-adoption Guide
              </span>
                        </a>
                    </nav>
                </div>

                {/* ORGANIZATION Section */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <GiPartyPopper className="text-red-600" />
                        ORGANIZATION
                    </h3>
                    <nav className="space-y-2">
                        <a
                            href="/club"
                            className="block transition-colors hover:text-[#3F4EB3] group"
                        >
              <span className="flex items-center gap-1">
                <GiPawPrint className="text-red-600" />
                Club
              </span>
                        </a>
                        <a
                            href="/history"
                            className="block transition-colors hover:text-[#3F4EB3]"
                        >
                            History
                        </a>
                    </nav>
                </div>

                {/* Social Media */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Follow Us</h3>
                    <div className="flex space-x-4">
                        <a
                            href="https://www.facebook.com/profile.php?id=100005346816308"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-[#E0E7FF] rounded-full hover:bg-[#C7D2FE] transition-colors"
                        >
                            <FaFacebookF className="w-6 h-6 text-red-800" />
                        </a>
                        <a
                            href="https://twitter.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-[#E0E7FF] rounded-full hover:bg-[#C7D2FE] transition-colors"
                        >
                            <FaTwitter className="w-6 h-6 text-red-800" />
                        </a>
                        <a
                            href="https://instagram.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-[#E0E7FF] rounded-full hover:bg-[#C7D2FE] transition-colors"
                        >
                            <FaInstagram className="w-6 h-6 text-red-800" />
                        </a>
                        <a
                            href="https://www.tiktok.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-[#E0E7FF] rounded-full hover:bg-[#C7D2FE] transition-colors"
                        >
                            <FaTiktok className="w-6 h-6 text-red-800" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="container mx-auto mt-8 pt-6 border-t-2 border-[#5C6AC4]">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                    <p className="flex items-center gap-1">
                        <GiPawPrint className="text-red-600" />
                        © 2024 www.rcc.org
                    </p>
                    <div className="flex space-x-4">
                        <a href="/privacy" className="transition-colors hover:text-[#3F4EB3]">
                            Privacy Policy
                        </a>
                        <a href="/terms" className="transition-colors hover:text-[#3F4EB3]">
                            Terms of Service
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
