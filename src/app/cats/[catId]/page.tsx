"use client";
import Image from "next/image";
import { useParams } from 'next/navigation';
import Header from "@/components/layouts/Header";



export default function CatProfile() {
    const params = useParams();

    return (
       <><Header/>

           <div className="bg-[#1C1C21] text-white min-h-screen">
               <div className="bg-[#A3947C] text-center py-20">
                   <h1 className="text-5xl font-bold"></h1>
                   <p className="text-xl mt-4">
                       She&apos;s grumpy and always demands food, but also likes to cuddle in the couch or bed.
                   </p>
               </div>

               <div className="container mx-auto py-16 px-8 flex flex-col lg:flex-row gap-16">
                   <div className="lg:w-1/2">
                       <Image
                           src="/Cats/fiona.jpg"
                           alt="Fiona"
                           className="rounded-lg shadow-lg"
                           width={500}
                           height={500}
                       />
                       <div className="flex mt-4 space-x-4">
                           <Image
                               src="/Cats/fiona1.jpg"
                               alt="Fiona"
                               className="rounded-lg shadow-lg"
                               width={100}
                               height={100}
                           />
                           <Image
                               src="/Cats/fiona2.jpg"
                               alt="Fiona"
                               className="rounded-lg shadow-lg"
                               width={100}
                               height={100}
                           />
                       </div>
                   </div>

                   <div className="lg:w-1/2 text-left">
                       <h2 className="text-3xl font-bold mb-4">Fiona Is Already Adopted</h2>
                       <h3 className="text-xl font-semibold mb-2">ABOUT:</h3>
                       <p className="text-gray-400 leading-relaxed mb-6">
                           Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                       </p>
                       <h3 className="text-xl font-semibold mb-2">COLOR:</h3>
                       <p className="text-gray-400 mb-4">Light orange</p>
                       <h3 className="text-xl font-semibold mb-2">GENDER:</h3>
                       <p className="text-gray-400 mb-4">Female</p>
                   </div>
               </div>
           </div></>

    );
}