"use client";
import Appbar from "@/app/Components/Appbar";
import React, { useState } from "react";
import NextTask from "./Components/NextTask";
import { motion } from "framer-motion";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { BackgroundLines } from "@/components/ui/background-lines";

const Page = () => {
  const [title, setTitle] = useState("NO Tasks Available");

  return (
    <main className="w-full h-screen border border-orange-900 bg-black">
      <div className="w-full   z-20 ">
        <Appbar />
      </div>
      <BackgroundLines>
        <div className="w-full relative border border-red-600 flex justify-center top-[10%]">
          <TextGenerateEffect words={title} />
        </div>

        <div className="relative top-[20%] p-4 w-full border border-green-900 h-[50%]">
          <motion.div
            className="flex flex-row h-full overflow-x-scroll no-scrollbar"
            drag="x"
            dragConstraints={{ left: -500, right: 0 }}
            dragElastic={0.7}
            whileTap={{ cursor: "grabbing" }}
          >
            <NextTask setTitle={setTitle} />
          </motion.div>
        </div>
      </BackgroundLines>
    </main>
  );
};

export default Page;
