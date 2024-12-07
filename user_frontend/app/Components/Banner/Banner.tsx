"use client";
import Image from "next/image";
import React from "react";
import { Typewriter } from "react-simple-typewriter";

const Banner = () => {
  return (
    <div className="w-full h-full flex justify-center items-center">
      <img
        src="heroBg.jpg"
        className=" absolute -z-10 w-full h-full opacity-50 "
        alt=""
      />
      <div className=" w-full h-3/4 pt-32 relative flex flex-col gap-4  items-center ">
        {/* <div className='relative top-44 font-extrabold left-44 text-7xl'>
            <span className='bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent'>SoundScore: </span> <span className='text-white' > Get Your Music Scored</span>
            </div>

            <div className=' relative top-48 left-72 text-3xl'>
                hello
            </div> */}

        <div className=" font-extrabold  text-7xl">
          <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
            SoundScore:{" "}
          </span>{" "}
          <span className="text-white"> Get Your Music Scored</span>
        </div>

        <div className=" text-3xl text-slate-300 ">
          Upload your Beats/Music and get them rated from listeners all over the
          world
        </div>

        <button className="p-[3px] relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" />
          <div className="px-10 py-5  bg-black rounded-full  relative group transition duration-200 text-lg font-semibold text-white hover:bg-transparent">
            Upload Your Music
          </div>
        </button>
      </div>
    </div>
  );
};

export default Banner;
