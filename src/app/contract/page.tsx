"use client"

import { useState, useEffect, useCallback } from "react"
import Header from "@/components/layouts/Header"
import Footer from "@/components/layouts/Footer"
import { GiCat, GiPawPrint } from "react-icons/gi"

function useResponsivePdfUrl() {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null)
    const baseParams = "toolbar=0&navpanes=0&scrollbar=0"
    const desktopParams = `${baseParams}&zoom=300,0,0&view=FitH`
    const mobileParams = `${baseParams}&view=FitV`

    const updatePdfUrl = useCallback(() => {
        const isDesktop = window.matchMedia("(min-width: 768px)").matches
        // Add a timestamp to prevent caching issues
        const timestamp = new Date().getTime()
        setPdfUrl(`/Documents/contract.pdf?v=${timestamp}#${isDesktop ? desktopParams : mobileParams}`)
    }, [desktopParams, mobileParams])

    useEffect(() => {
        // Small delay to ensure the component is fully mounted
        const timer = setTimeout(() => {
            updatePdfUrl()
        }, 100)

        window.addEventListener("resize", updatePdfUrl)
        return () => {
            window.removeEventListener("resize", updatePdfUrl)
            clearTimeout(timer)
        }
    }, [updatePdfUrl])

    return pdfUrl
}

const Sidebar = () => (
    <div className="hidden lg:block space-y-6">
        <div className="cat-card group hover:scale-105 transition-all duration-500" style={{opacity: 1, transform: 'translateY(0)'}}>
            <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-t-3xl"></div>
            <div className="p-8 bg-white/90 backdrop-blur-sm rounded-b-3xl">
                <div className="flex items-center mb-6">
                    <div className="text-4xl mr-4 animate-purr group-hover:animate-cat-bounce">🛡️</div>
                    <h2 className="text-2xl font-bold text-green-600 font-patrick">
                        Health Guarantee
                    </h2>
                </div>
                
                <div className="text-gray-700 space-y-4">
                    <ul className="space-y-3">
                        <li className="flex items-start p-2 rounded-lg hover:bg-green-50 transition-all duration-300 group/item">
                            <span className="text-lg mr-3 mt-0.5 group-hover/item:animate-paw-wave">🐾</span>
                            <span className="leading-relaxed">Healthy cat free from parasites</span>
                        </li>
                        <li className="flex items-start p-2 rounded-lg hover:bg-green-50 transition-all duration-300 group/item">
                            <span className="text-lg mr-3 mt-0.5 group-hover/item:animate-paw-wave">💉</span>
                            <div className="leading-relaxed">
                                <span>Vaccinations included:</span>
                                <ul className="ml-4 mt-2 space-y-1">
                                    <li className="flex items-center"><span className="mr-2 text-green-500">•</span>Panleukopenia</li>
                                    <li className="flex items-center"><span className="mr-2 text-green-500">•</span>Rhinotracheitis</li>
                                    <li className="flex items-center"><span className="mr-2 text-green-500">•</span>Calicivirus</li>
                                    <li className="flex items-center"><span className="mr-2 text-green-500">•</span>Rabies</li>
                                </ul>
                            </div>
                        </li>
                        <li className="flex items-start p-2 rounded-lg hover:bg-green-50 transition-all duration-300 group/item">
                            <span className="text-lg mr-3 mt-0.5 group-hover/item:animate-paw-wave">🧬</span>
                            <span className="leading-relaxed">PKD-negative test results from parents/grandparents</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <div className="cat-card group hover:scale-105 transition-all duration-500" style={{opacity: 1, transform: 'translateY(0)'}}>
            <div className="h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-t-3xl"></div>
            <div className="p-8 bg-white/90 backdrop-blur-sm rounded-b-3xl">
                <div className="flex items-center mb-6">
                    <div className="text-4xl mr-4 animate-purr group-hover:animate-cat-bounce">📬</div>
                    <h3 className="text-xl font-bold text-blue-600 font-patrick">
                        Breeder Contact
                    </h3>
                </div>
                
                <div className="space-y-4 text-gray-700">
                    <p className="font-semibold text-lg text-gray-800">Artapila Violeta</p>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 transition-all duration-300 group/item">
                            <span className="animate-whisker-twitch text-xl">📞</span>
                            <a href="tel:+40721238803" className="text-blue-600 hover:text-blue-800 hover:scale-105 transition-all duration-300">
                                +40 721 238 803
                            </a>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 transition-all duration-300 group/item">
                            <span className="animate-whisker-twitch text-xl">📧</span>
                            <a href="mailto:poppsy81@yahoo.com" className="text-blue-600 hover:text-blue-800 hover:scale-105 transition-all duration-300">
                                poppsy81@yahoo.com
                            </a>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 transition-all duration-300 group/item">
                            <span className="animate-whisker-twitch text-xl">🏠</span>
                            <span className="leading-relaxed">str. Marasesti, bl.7, Pitesti</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
)

const MobileInfo = () => (
    <div className="lg:hidden mt-6 space-y-4">
        <div className="cat-card group hover:scale-105 transition-all duration-500" style={{opacity: 1, transform: 'translateY(0)'}}>
            <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-t-3xl"></div>
            <div className="p-6 bg-white/90 backdrop-blur-sm rounded-b-3xl">
                <div className="flex items-center mb-4">
                    <div className="text-3xl mr-3 animate-purr">🛡️</div>
                    <h3 className="text-lg font-bold text-green-600 font-patrick">
                        Health Details
                    </h3>
                </div>
                <ul className="text-sm space-y-2 text-gray-700">
                    <li className="flex items-center"><span className="mr-2 animate-paw-wave">🐾</span>Full vaccination coverage</li>
                    <li className="flex items-center"><span className="mr-2 animate-paw-wave">🐾</span>Health screening included</li>
                    <li className="flex items-center"><span className="mr-2 animate-paw-wave">🐾</span>PKD-negative lineage</li>
                </ul>
            </div>
        </div>

        <div className="cat-card group hover:scale-105 transition-all duration-500" style={{opacity: 1, transform: 'translateY(0)'}}>
            <div className="h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-t-3xl"></div>
            <div className="p-6 bg-white/90 backdrop-blur-sm rounded-b-3xl">
                <div className="flex items-center mb-4">
                    <div className="text-3xl mr-3 animate-purr">📱</div>
                    <h3 className="text-lg font-bold text-blue-600 font-patrick">
                        Quick Contact
                    </h3>
                </div>
                <div className="text-sm space-y-2 text-gray-700">
                    <p className="flex items-center"><span className="mr-2 animate-whisker-twitch">📞</span>+40 721 238 803</p>
                    <p className="flex items-center"><span className="mr-2 animate-whisker-twitch">📧</span>poppsy81@yahoo.com</p>
                </div>
            </div>
        </div>
    </div>
)

const PdfViewer = ({ pdfUrl }: { pdfUrl: string | null }) => {
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)
    const [useFallback, setUseFallback] = useState(false)

    const handleIframeError = () => {
        setUseFallback(true)
        setIsLoading(true)
    }

    const handleFallbackError = () => {
        setHasError(true)
        setIsLoading(false)
    }

    return (
        <div className="lg:col-span-2">
            <div className="cat-card group transition-all duration-500 h-[85vh] min-h-[500px] overflow-hidden" style={{opacity: 1, transform: 'translateY(0)'}}>
                <div className="h-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-t-3xl"></div>
                <div className="h-full bg-white/90 backdrop-blur-sm rounded-b-3xl relative">
                    {/* Always show loading indicator when pdfUrl is null */}
                    {(isLoading || pdfUrl === null) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-10 rounded-b-3xl">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                                <p className="text-gray-600 font-medium">Loading contract document...</p>
                                <div className="mt-4 flex justify-center items-center gap-2">
                                    <span className="animate-cat-bounce text-2xl">📄</span>
                                    <span className="animate-paw-wave text-2xl">🐾</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {hasError ? (
                        <div className="flex flex-col items-center justify-center h-full p-6">
                            <div className="text-red-500 text-6xl mb-4 animate-cat-bounce">⚠️</div>
                            <h3 className="text-xl font-bold text-red-600 mb-2">Document Not Found</h3>
                            <p className="text-gray-600 text-center mb-4">
                                The contract document could not be loaded. Please make sure it exists in the public/Documents folder.
                            </p>
                        </div>
                    ) : useFallback && pdfUrl ? (
                        <object
                            data={pdfUrl}
                            type="application/pdf"
                            className="w-full h-full rounded-b-3xl"
                            onLoad={() => setIsLoading(false)}
                            onError={handleFallbackError}
                        >
                            <div className="flex flex-col items-center justify-center h-full p-6">
                                <p className="text-gray-600 text-center mb-4">Your browser cannot display the PDF directly.</p>
                            </div>
                        </object>
                    ) : pdfUrl ? (
                        <iframe
                            src={pdfUrl}
                            className="w-full h-full rounded-b-3xl"
                            title="Cat Sale Agreement"
                            loading="eager"
                            onLoad={() => setIsLoading(false)}
                            onError={handleIframeError}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    )
}

const FaqSection = () => (
    <section className="lg:col-span-3 mt-8">
        <div className="cat-card group hover:scale-105 transition-all duration-500" style={{opacity: 1, transform: 'translateY(0)'}}>
            <div className="h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-t-3xl"></div>
            <div className="p-8 bg-white/90 backdrop-blur-sm rounded-b-3xl">
                <div className="flex items-center mb-8">
                    <div className="text-4xl mr-4 animate-purr group-hover:animate-cat-bounce">❓</div>
                    <h3 className="text-3xl font-bold text-purple-600 font-patrick">
                        Frequently Asked Questions
                    </h3>
                </div>
                
                <div className="grid lg:grid-cols-2 gap-8 text-gray-800">
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-purple-50 hover:bg-purple-100 transition-all duration-300 group/faq">
                            <h4 className="text-lg font-semibold mb-3 text-gray-900 flex items-center">
                                <span className="mr-2 group-hover/faq:animate-cat-bounce">🚗</span>
                                How is the cat transported?
                            </h4>
                            <p className="text-gray-600 leading-relaxed">
                                The cat is transported in a climate-controlled vehicle, ensuring comfort and safety throughout the
                                journey.
                            </p>
                        </div>
                        <div className="p-6 rounded-2xl bg-purple-50 hover:bg-purple-100 transition-all duration-300 group/faq">
                            <h4 className="text-lg font-semibold mb-3 text-gray-900 flex items-center">
                                <span className="mr-2 group-hover/faq:animate-cat-bounce">🛡️</span>
                                Is the transportation insured?
                            </h4>
                            <p className="text-gray-600 leading-relaxed">
                                Yes, full insurance coverage is provided during transport to guarantee the cat&apos;s well-being.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-purple-50 hover:bg-purple-100 transition-all duration-300 group/faq">
                            <h4 className="text-lg font-semibold mb-3 text-gray-900 flex items-center">
                                <span className="mr-2 group-hover/faq:animate-cat-bounce">🔒</span>
                                What safety measures are in place?
                            </h4>
                            <p className="text-gray-600 leading-relaxed">
                                Our transport vehicles are equipped with secure cages, padding, and temperature regulation systems to
                                ensure maximum safety.
                            </p>
                        </div>
                        <div className="p-6 rounded-2xl bg-purple-50 hover:bg-purple-100 transition-all duration-300 group/faq">
                            <h4 className="text-lg font-semibold mb-3 text-gray-900 flex items-center">
                                <span className="mr-2 group-hover/faq:animate-cat-bounce">📋</span>
                                Health documentation provided?
                            </h4>
                            <p className="text-gray-600 leading-relaxed">
                                Full medical records, vaccination certificates, and pedigree documentation accompany every adoption.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
)

export default function ContractPage() {
    const [isVisible, setIsVisible] = useState(false)
    const pdfUrl = useResponsivePdfUrl()

    useEffect(() => {
        setIsVisible(true)
    }, [])

    return (
        <div className="min-h-screen cat-bg-pattern relative overflow-hidden">
            {/* Floating Cat Elements */}
            <div className="cat-float top-20 left-8 cat-float-delayed">
                <GiCat className="w-14 h-14 text-purple-300" />
            </div>
            <div className="cat-float top-32 right-16 cat-float-slow">
                <GiPawPrint className="w-10 h-10 text-orange-300" />
            </div>
            <div className="cat-float bottom-32 left-1/5">
                <GiCat className="w-16 h-16 text-blue-300" />
            </div>
            <div className="cat-float top-2/3 right-1/4 cat-float-delayed">
                <GiPawPrint className="w-12 h-12 text-pink-300" />
            </div>

            {/* Main Content */}
            <div className={`relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <Header />
                
                {/* Hero Section */}
                <div className="text-center py-12 px-4">
                    <h1 className="text-5xl md:text-6xl font-extrabold mb-6 font-patrick">
                        <span className="cat-text-gradient-warm">Adoption</span>
                        <br />
                        <span className="cat-text-gradient-cool">Contract</span>
                    </h1>
                    <div className="flex justify-center items-center gap-4 mb-6">
                        <div className="animate-paw-wave text-4xl">📋</div>
                        <div className="animate-cat-bounce text-4xl">🐱</div>
                        <div className="animate-paw-wave text-4xl">✅</div>
                    </div>
                    <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
                        Review our comprehensive adoption contract to understand the terms and conditions 
                        for your new feline companion&apos;s care and well-being.
                    </p>
                </div>

                <main className="flex-1 max-w-7xl mx-auto p-4 w-full">
                    <div className="grid lg:grid-cols-3 gap-8">
                        <Sidebar />
                        <PdfViewer pdfUrl={pdfUrl} />
                        <FaqSection />
                    </div>
                    <MobileInfo />
                </main>
                
                <Footer />
            </div>
        </div>
    )
}