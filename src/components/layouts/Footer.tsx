"use client";
import { FaFacebookF, FaTwitter, FaInstagram, FaTiktok } from "react-icons/fa";
import { GiCat, GiPartyPopper, GiPawPrint } from "react-icons/gi";
import { IoLogoOctocat } from "react-icons/io5";
import { BiSolidCat } from "react-icons/bi";
import { TbCat } from "react-icons/tb";

export default function Footer() {
    return (
        <footer className="bg-[#F4F6FA] text-[#2E2E2E] p-4 md:p-8 border-t-2 border-[#5C6AC4] relative overflow-hidden">
            {/* Decorative elements hidden on mobile */}
            <div className="absolute hidden md:block top-24 right-[55%] opacity-50">
                <IoLogoOctocat className="w-14 h-14 transform rotate-12 text-red-600" />
            </div>
            <div className="absolute hidden md:block top-10 right-[35%] opacity-50">
                <GiPawPrint className="w-16 h-16 transform rotate-12 text-red-600" />
            </div>
            <div className="absolute hidden md:block bottom-15 left-[22%] opacity-50">
                <TbCat className="w-20 h-20 transform -rotate-6 text-red-600" />
            </div>
            <div className="absolute hidden md:block bottom-9 right-[9%] opacity-60">
                <GiCat className="w-40 h-40 transform rotate-4 text-red-600" />
            </div>

            <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
                {/* Brand Section */}
                <div className="text-center md:text-left space-y-3">
                    <div className="flex justify-center md:justify-start items-center gap-2">
                        <GiCat className="w-8 h-8 text-red-600" />
                        <h3 className="text-2xl font-bold font-paw tracking-wide text-[#FF6B6B]">
                            Red Cat Cuasar
                        </h3>
                    </div>
                    <div className="space-y-1 text-sm">
                        <p className="flex items-center gap-2 justify-center md:justify-start">
                            <GiPawPrint className="text-red-600" />
                            <span>Pitesti</span>
                        </p>
                        <p className="flex items-center gap-2 justify-center md:justify-start">
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
                <div className="text-center md:text-left space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2 justify-center md:justify-start">
                        <GiCat className="text-red-600" />
                        CAT
                    </h3>
                    <nav className="space-y-2">
                        {["Contract", "Adoption Process", "Living Conditions", "Post-adoption Guide"].map((item, index) => (
                            <a
                                key={index}
                                href={`/${item.toLowerCase().replace(' ', '-')}`}
                                className="block transition-colors hover:text-[#3F4EB3] group"
                            >
                                <span className="flex items-center gap-1 justify-center md:justify-start">
                                    <GiPawPrint className="text-red-600 group-hover:animate-bounce" />
                                    {item}
                                </span>
                            </a>
                        ))}
                    </nav>
                </div>

                {/* ORGANIZATION Section */}
                <div className="text-center md:text-left space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2 justify-center md:justify-start">
                        <GiPartyPopper className="text-red-600" />
                        ORGANIZATION
                    </h3>
                    <nav className="space-y-2">
                        {["Club", "History"].map((item, index) => (
                            <a
                                key={index}
                                href={`/${item.toLowerCase()}`}
                                className="block transition-colors hover:text-[#3F4EB3] group"
                            >
                                <span className="flex items-center gap-1 justify-center md:justify-start">
                                    <GiPawPrint className="text-red-600" />
                                    {item}
                                </span>
                            </a>
                        ))}
                    </nav>
                </div>

                {/* Social Media */}
                <div className="text-center md:text-left space-y-4">
                    <h3 className="text-lg font-semibold">Follow Us</h3>
                    <div className="flex justify-center md:justify-start space-x-4">
                        {[
                            { icon: FaFacebookF, link: "https://www.facebook.com/profile.php?id=100005346816308" },
                            { icon: FaTwitter, link: "https://twitter.com" },
                            { icon: FaInstagram, link: "https://instagram.com" },
                            { icon: FaTiktok, link: "https://www.tiktok.com/" }
                        ].map((social, index) => (
                            <a
                                key={index}
                                href={social.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-[#E0E7FF] rounded-full hover:bg-[#C7D2FE] transition-colors"
                            >
                                <social.icon className="w-5 h-5 md:w-6 md:h-6 text-red-800" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="container mx-auto mt-6 md:mt-8 pt-4 md:pt-6 border-t-2 border-[#5C6AC4]">
                <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-sm">
                    <p className="flex items-center gap-1 justify-center">
                        <GiPawPrint className="text-red-600" />
                        © 2024 www.rcc.org
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 md:gap-4">
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