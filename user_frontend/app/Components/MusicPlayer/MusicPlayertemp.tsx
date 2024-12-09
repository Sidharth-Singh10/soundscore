"use client"
const musicMetadata = require('music-metadata');
import { IAudioMetadata } from 'music-metadata';
import { IPicture } from 'music-metadata';
import React, { useEffect, useRef, useState } from 'react'
import MusicControls from './MusicControls';
import { uint8ArrayToBase64 } from 'uint8array-extras';
const MusicPlayertemp = () => {

    var audioSrc = "https://soundscorebucket.s3.ap-south-1.amazonaws.com/beats/1/0.4551015283429436/Kayou+Jujutsu+Kaisen.mp3"
    const [trackProgress, setTrackProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Refs
    const audioRef = useRef(new Audio(audioSrc));
    const intervalRef = useRef<ReturnType<typeof setInterval>>();
    const isReady = useRef(false);

    const { duration } = audioRef.current;
    const currentPercentage = duration
        ? `${(trackProgress / duration) * 100}%`
        : "0%";


    const startTimer = () => {
        clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {

            setTrackProgress(audioRef.current.currentTime);

        }, 1000);
    };

    useEffect(() => {
        if (isPlaying) {
            audioRef.current.play();
            startTimer();
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying]);





    return (
        <div className='h-full w-full '>

            <div className='rounded-3xl bg-white h-full w-full
            flex flex-col items-center
            shadow-[0px_20px_125px_10px_rgba(39,_70,_132,_1)]
            pt-8
            px-4
            gap-4
            '>

                <div id="image" className='rounded-3xl bg-black h-[40%] w-full
                shadow-[0px_20px_125px_10px_rgba(39,_70,_132,_0.7)]
                '>
                    <img src="/slowmotion.jpg" alt="hello" className='h-full w-full rounded-3xl' />

                    {/* <img src= `data:${picture.format};base64,${uint8ArrayToBase64(metadata?.common.picture.)}` alt="/slowmotion.jpg" className='h-full w-full rounded-3xl' /> */}
                    {/* <Image src="/slowmotion.jpg" alt="hello" width={100%} height={100}/> */}

                </div>

                <div id="info flex flex-col items-center gap-2">

                    <div id="name" className='text-black text-xl font-semibold ' >
                        Hola Amigo
                    </div>

                    <div id="artist" className='flex justify-center text-[#7EA3DB]'>
                        Kr$na
                    </div>
                </div>

                <div id="controls" className='w-full flex flex-col justify-center '>

                    <div className='flex justify-center items-center'>
                        <progress className="progress progress-primary w-56" value={trackProgress} max="100"></progress>

                    </div>

                    <MusicControls
                        isPlaying={isPlaying}
                        onPlayPauseClick={setIsPlaying}
                    />
                </div>

                {/* <div className='w-full border border-black flex items-center '>

                    <div className='btn btn-ghost '>
                        <img src="/like.png" alt="" />
                        <div className=' text-3xl'>
                            {count}
                        </div>
                    </div>

                </div> */}


            </div>


        </div>
    )
}

export default MusicPlayertemp