"use client";
import { FaFacebookF, FaTwitter, FaInstagram, FaTiktok } from "react-icons/fa";
import { GiCat, GiPartyPopper, GiPawPrint } from "react-icons/gi";
import { IoLogoOctocat } from "react-icons/io5";
import { BiSolidCat } from "react-icons/bi";
import { TbCat } from "react-icons/tb";
import { useState } from "react";

export default function Footer() {
    const [hoveredSocial, setHoveredSocial] = useState<number | null>(null);

    return (
      <footer className="bg-gradient-to-br from-white via-red-50/30 to-red-100/40 text-gray-700 relative overflow-hidden border-t border-red-100">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-4 left-[10%] opacity-15 animate-float">
                  <GiCat className="w-8 h-8 text-red-400 transform rotate-12" />
              </div>
              <div className="absolute top-6 right-[15%] opacity-10 animate-float-delayed">
                  <IoLogoOctocat className="w-10 h-10 text-red-300 transform -rotate-12" />
              </div>
              <div className="absolute bottom-4 left-[20%] opacity-15 animate-bounce-slow">
                  <GiPawPrint className="w-6 h-6 text-red-400 transform rotate-45" />
              </div>
              <div className="absolute bottom-2 right-[25%] opacity-10 animate-pulse-slow">
                  <TbCat className="w-12 h-12 text-red-300 transform rotate-6" />
              </div>
              <div className="absolute hidden md:block bottom-6 right-[16%] opacity-60">
                  <GiCat className="w-40 h-40 transform rotate-4 text-red-600" />
              </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Brand Section */}
                  <div className="lg:col-span-1 space-y-4 text-center md:text-left">
                      <div className="group">
                          <div className="flex items-center gap-2 mb-3 justify-center md:justify-start">
                              <div className="p-1.5 bg-red-100 rounded-lg group-hover:bg-red-200 transition-all duration-300 group-hover:scale-110">
                                  <GiCat className="w-6 h-6 text-red-600 group-hover:animate-bounce" />
                              </div>
                              <h3 className="text-lg font-bold text-red-600 group-hover:text-red-700 transition-colors">
                                  Red Cat Cuasar
                              </h3>
                          </div>
                      </div>

                      <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors group justify-center md:justify-start">
                              <div className="p-1 bg-red-50 rounded group-hover:bg-red-100 transition-colors">
                                  <GiPawPrint className="w-3 h-3 text-red-500" />
                              </div>
                              <span>Pitești, Romania</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm hover:text-red-600 transition-colors group justify-center md:justify-start">
                              <div className="p-1 bg-red-50 rounded group-hover:bg-red-100 transition-colors">
                                  <GiPawPrint className="w-3 h-3 text-red-500" />
                              </div>
                              <a
                                href="mailto:poppsy81@yahoo.com"
                                className="hover:underline"
                              >
                                  poppsy81@yahoo.com
                              </a>
                          </div>
                      </div>
                  </div>

                  {/* CAT Section */}
                  <div className="space-y-4 text-center md:text-left">
                      <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 justify-center md:justify-start">
                          <div className="p-1 bg-red-100 rounded">
                              <GiCat className="w-4 h-4 text-red-600" />
                          </div>
                          Adoption
                      </h3>
                      <nav className="space-y-2">
                          {[
                              { name: "Contract", href: "/contract" },
                              { name: "Living Conditions", href: "/living-conditions" },
                              { name: "Post-adoption Guide", href: "/post-adoption-guide" }
                          ].map((item, index) => (
                            <a
                              key={index}
                              href={item.href}
                              className="group flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-all duration-200 hover:translate-x-1 justify-center md:justify-start"
                            >
                                <div className="p-0.5 bg-red-50 rounded group-hover:bg-red-100 transition-colors">
                                    <GiPawPrint className="w-2.5 h-2.5 text-red-500 group-hover:animate-bounce" />
                                </div>
                                <span className="hover:underline">{item.name}</span>
                            </a>
                          ))}
                      </nav>
                  </div>

                  {/* ORGANIZATION Section */}
                  <div className="space-y-4 text-center md:text-left">
                      <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 justify-center md:justify-start">
                          <div className="p-1 bg-red-100 rounded">
                              <GiPartyPopper className="w-4 h-4 text-red-600" />
                          </div>
                          Organization
                      </h3>
                      <nav className="space-y-2">
                          <a
                            href="/club"
                            className="group flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-all duration-200 hover:translate-x-1 justify-center md:justify-start"
                          >
                              <div className="p-0.5 bg-red-50 rounded group-hover:bg-red-100 transition-colors">
                                  <GiPawPrint className="w-2.5 h-2.5 text-red-500 group-hover:animate-bounce" />
                              </div>
                              <span className="hover:underline">Club</span>
                          </a>
                      </nav>
                  </div>

                  {/* Social Media */}
                  <div className="space-y-4 text-center md:text-left">
                      <h3 className="text-sm font-semibold text-gray-800">Follow Us</h3>
                      <div className="flex gap-2 justify-center md:justify-start">
                          {[
                              {
                                  icon: FaFacebookF,
                                  link: "https://www.facebook.com/profile.php?id=100005346816308",
                                  color: "hover:bg-blue-500",
                                  name: "Facebook"
                              },
                              {
                                  icon: FaTwitter,
                                  link: "https://twitter.com",
                                  color: "hover:bg-sky-500",
                                  name: "Twitter"
                              },
                              {
                                  icon: FaInstagram,
                                  link: "https://instagram.com",
                                  color: "hover:bg-pink-500",
                                  name: "Instagram"
                              },
                              {
                                  icon: FaTiktok,
                                  link: "https://www.tiktok.com/",
                                  color: "hover:bg-black",
                                  name: "TikTok"
                              }
                          ].map((social, index) => (
                            <a
                              key={index}
                              href={social.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onMouseEnter={() => setHoveredSocial(index)}
                              onMouseLeave={() => setHoveredSocial(null)}
                              className={`
                                        p-2 bg-white rounded-lg shadow-sm border border-red-100 
                                        hover:shadow-md transition-all duration-300 transform hover:scale-110 
                                        ${social.color} hover:text-white group
                                        ${hoveredSocial === index ? 'animate-pulse' : ''}
                                    `}
                              aria-label={social.name}
                            >
                                <social.icon className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                            </a>
                          ))}
                      </div>
                  </div>
              </div>

              {/* Bottom Section */}
              <div className="mt-6 pt-4 border-t border-red-100">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 text-gray-600">
                          <div className="p-0.5 bg-red-50 rounded">
                              <GiPawPrint className="w-3 h-3 text-red-500" />
                          </div>
                          <span>© 2024 Red Cat Cuasar. All rights reserved.</span>
                      </div>
                      <div className="flex gap-4 text-xs">
                          <a
                            href="/privacy"
                            className="text-gray-600 hover:text-red-600 transition-colors hover:underline"
                          >
                              Privacy Policy
                          </a>
                          <a
                            href="/terms"
                            className="text-gray-600 hover:text-red-600 transition-colors hover:underline"
                          >
                              Terms of Service
                          </a>
                      </div>
                  </div>
              </div>
          </div>

          {/* Custom CSS for animations */}
          <style jsx>{`
              @keyframes float {
                  0%, 100% { transform: translateY(0px) rotate(12deg); }
                  50% { transform: translateY(-6px) rotate(12deg); }
              }

              @keyframes float-delayed {
                  0%, 100% { transform: translateY(0px) rotate(-12deg); }
                  50% { transform: translateY(-8px) rotate(-12deg); }
              }

              @keyframes bounce-slow {
                  0%, 100% { transform: translateY(0px) rotate(45deg); }
                  50% { transform: translateY(-4px) rotate(45deg); }
              }

              @keyframes pulse-slow {
                  0%, 100% { opacity: 0.1; }
                  50% { opacity: 0.2; }
              }

              .animate-float {
                  animation: float 4s ease-in-out infinite;
              }

              .animate-float-delayed {
                  animation: float-delayed 5s ease-in-out infinite;
                  animation-delay: 1s;
              }

              .animate-bounce-slow {
                  animation: bounce-slow 3s ease-in-out infinite;
                  animation-delay: 2s;
              }

              .animate-pulse-slow {
                  animation: pulse-slow 4s ease-in-out infinite;
                  animation-delay: 0.5s;
              }
          `}</style>
      </footer>
    );
}