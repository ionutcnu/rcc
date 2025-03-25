import Image from "next/image";

export default function MeetFelissa() {
    return (
        <section className="bg-[#F4F6FA] text-[#2E2E2E] py-12">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

                {/* Image Section */}
                <div className="flex justify-center">
                    <div className="relative w-full max-w-xl overflow-hidden rounded-lg shadow-lg">
                        <Image
                            src="/images/fellisa.jpg"     // Ensure file is in /public/images/fellisa.jpg
                            alt="Felissa holding a cat"
                            width={800}                   // pick appropriate width
                            height={600}                  // pick appropriate height
                            className="object-cover w-full h-auto"
                            // Or if you prefer a fill-based approach:
                            // fill
                            // style={{ objectFit: "cover" }}
                        />
                    </div>
                </div>

                {/* Text Section */}
                <div className="space-y-4 md:space-y-6">
                    <h2 className="text-3xl md:text-4xl font-bold">
                        Meet Felissa
                    </h2>
                    <h3 className="text-xl md:text-2xl font-semibold">
                        Felissa – Cat Enthusiast and Rescue Specialist
                    </h3>
                    <p>
                        Cats have been a part of my life for as long as I can remember...
                    </p>
                    <p>
                        Our mission is to rescue cats...
                    </p>
                    <p>
                        If you are interested in learning more...
                    </p>

                    <div>
                        <a
                            href="/contact"
                            className="inline-block bg-[#5C6AC4] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#3F4EB3] transition-colors"
                        >
                            Get in Touch
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
