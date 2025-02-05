'use client';
import { useState, useEffect, useCallback } from 'react';
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";

function useResponsivePdfUrl() {
    const [pdfUrl, setPdfUrl] = useState('');
    const baseParams = 'toolbar=0&navpanes=0&scrollbar=0';
    const desktopParams = `${baseParams}&zoom=300,0,0&view=FitH`;
    const mobileParams = `${baseParams}&view=FitV`;

    const updatePdfUrl = useCallback(() => {
        const isDesktop = window.matchMedia('(min-width: 768px)').matches;
        setPdfUrl(`/Documents/contract.pdf#${isDesktop ? desktopParams : mobileParams}`);
    }, [desktopParams, mobileParams]);

    useEffect(() => {
        updatePdfUrl();
        window.addEventListener('resize', updatePdfUrl);
        return () => window.removeEventListener('resize', updatePdfUrl);
    }, [updatePdfUrl]);

    return pdfUrl;
}

const Sidebar = () => (
    <div className="hidden lg:block space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-red-100">
            <h2 className="text-xl font-bold text-red-600 mb-4">🐾 Health Guarantee</h2>
            <div className="text-gray-600 space-y-4">
                <ul className="space-y-3 list-disc pl-4">
                    <li>Healthy cat free from parasites</li>
                    <li>
                        Vaccinations included:
                        <ul className="list-[circle] pl-4 mt-1">
                            <li>Panleukopenia</li>
                            <li>Rhinotracheitis</li>
                            <li>Calicivirus</li>
                            <li>Rabies</li>
                        </ul>
                    </li>
                    <li>PKD-negative test results from parents/grandparents</li>
                </ul>
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-red-100">
            <h3 className="text-lg font-semibold mb-3 text-red-600">📬 Breeder Contact</h3>
            <div className="space-y-2 text-gray-600">
                <p className="font-medium">Artapila Violeta</p>
                <div className="space-y-1">
                    <p className="flex items-center gap-2">
                        <span>📞</span>
                        <a href="tel:+40721238803" className="hover:text-red-600">+40 721 238 803</a>
                    </p>
                    <p className="flex items-center gap-2">
                        <span>📧</span>
                        <a href="mailto:poppsy81@yahoo.com" className="hover:text-red-600">poppsy81@yahoo.com</a>
                    </p>
                    <p className="flex items-center gap-2">
                        <span>🏠</span>
                        str. Marasesti, bl.7, Pitesti
                    </p>
                </div>
            </div>
        </div>
    </div>
);

const MobileInfo = () => (
    <div className="lg:hidden mt-6 space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-md border border-red-100">
            <h3 className="text-lg font-semibold mb-2 text-red-600">🐾 Health Details</h3>
            <ul className="text-sm space-y-2 text-gray-600">
                <li>• Full vaccination coverage</li>
                <li>• Health screening included</li>
                <li>• PKD-negative lineage</li>
            </ul>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border border-red-100">
            <h3 className="text-lg font-semibold mb-2 text-red-600">📱 Quick Contact</h3>
            <div className="text-sm space-y-1 text-gray-600">
                <p>📞 +40 721 238 803</p>
                <p>📧 poppsy81@yahoo.com</p>
            </div>
        </div>
    </div>
);

const PdfViewer = ({ pdfUrl }: { pdfUrl: string }) => (
    <div className="lg:col-span-2">
        <div className="border-2 border-red-100 rounded-lg shadow-xl bg-white h-[85vh] min-h-[500px] overflow-hidden">
            <iframe
                src={pdfUrl}
                className="w-full h-full"
                title="Cat Sale Agreement"
                loading="eager"
            />
        </div>
    </div>
);

const FaqSection = () => (
    <section className="lg:col-span-3 mt-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-red-100">
            <h3 className="text-2xl font-bold text-red-600 mb-6">Frequently Asked Questions</h3>
            <div className="grid lg:grid-cols-2 gap-8 text-gray-800">
                <div className="space-y-6">
                    <div className="pb-6 border-b border-gray-200">
                        <h4 className="text-lg font-semibold mb-2 text-gray-900">How is the cat transported?</h4>
                        <p className="text-gray-600">
                            The cat is transported in a climate-controlled vehicle, ensuring comfort and safety throughout the journey.
                        </p>
                    </div>
                    <div className="pb-6 border-b border-gray-200">
                        <h4 className="text-lg font-semibold mb-2 text-gray-900">Is the transportation insured?</h4>
                        <p className="text-gray-600">
                            Yes, full insurance coverage is provided during transport to guarantee the cat&apos;s well-being.
                        </p>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="pb-6 border-b border-gray-200">
                        <h4 className="text-lg font-semibold mb-2 text-gray-900">What safety measures are in place?</h4>
                        <p className="text-gray-600">
                            Our transport vehicles are equipped with secure cages, padding, and temperature regulation systems to ensure maximum safety.
                        </p>
                    </div>
                    <div className="pb-6 border-b border-gray-200">
                        <h4 className="text-lg font-semibold mb-2 text-gray-900">Health documentation provided?</h4>
                        <p className="text-gray-600">
                            Full medical records, vaccination certificates, and pedigree documentation accompany every adoption.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

export default function ContractPage() {
    const pdfUrl = useResponsivePdfUrl();

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
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
    );
}