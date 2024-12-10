"use client"; 
import Appbar from "../Components/Appbar";
import Banner from "../Components/Banner/Banner";
import Upload from "../Components/Upload/Upload";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { motion } from 'framer-motion'
export default function Home() {
  return (
     <main className="h-screen ">
       <div className="w-full fixed z-20">
         <Appbar />
       </div>
       <div className="h-full w-full fixed z-10">
         <Banner />
       </div>
       <motion.div 
         initial={{ y: '100%' }}
         animate={{ y: 0 }}
         transition={{ 
           type: "spring", 
           stiffness: 300, 
           damping: 30,
           duration: 0.8
         }}
         className="h-screen w-screen absolute flex items-center p-4 bg-[#1B1D1E] rounded-3xl z-30 top-[80%]"
       >
         <div className="relative z-20 h-full w-full flex flex-col items-center p-4">
           <Upload />
         </div>
         <div className="absolute inset-0 z-10">
           <BackgroundBeams />
         </div>
       </motion.div>
     </main>
  );
 }
