"use client"
const musicMetadata = require('music-metadata');
import { IAudioMetadata } from 'music-metadata';
import { IPicture } from 'music-metadata';
import React, { useEffect, useRef, useState } from 'react'
import MusicControls from './MusicControls';
import { uint8ArrayToBase64 } from 'uint8array-extras';
const MusicPlayer = ({ audioSrc, onSelect }: {
    audioSrc: string,
    onSelect:() =>void,
    
}) => {
    // var audioSrc = "https://soundscorebucket.s3.ap-south-1.amazonaws.com/beats/1/0.4551015283429436/Kayou+Jujutsu+Kaisen.mp3"

    const [metadata, setMetadata] = useState<IAudioMetadata | null>(null);
    useEffect(() => {
        const fetchAndParseMetadata = async () => {
            try {
                // Step 1: Fetch the file from S3
                const response = await fetch(audioSrc);

                // Step 2: Convert the response to a Blob
                const blob = await response.blob();
                console.log(blob);

                musicMetadata.parseBlob(blob).then((metadata: IAudioMetadata) => {
                    setMetadata(metadata);
                    // metadata has all the metadata found in the blob or file
                });
                // setMetadata(metadata);


                // Step 3: Parse the metadata from the Blob
                // const metadata = await musicMetadata.parseBlob(blob);

                // Step 4: Update state with the metadata
                // console.log(metadata.common)
            } catch (error) {
                // Handle errors here
                console.error('Error fetching, converting, or parsing metadata:', error);
            }
        };
        fetchAndParseMetadata();
    }, [audioSrc]);


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


    // const trackStyling = `
    // -webkit-gradient(linear, 0% 0%, 100% 0%, color-stop(${currentPercentage}, #fff), color-stop(${currentPercentage}, #777))
    // `;

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

    const handleclick = () => {
        console.log(metadata);
    }
    function uint8ArrayToBase64(buffer: Uint8Array): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);

    }
    const renderImage = () => {
        if (metadata && metadata.common.picture && metadata.common.picture.length > 0) {
            const picture = metadata.common.picture[0];
            const base64String = uint8ArrayToBase64(picture.data);
            console.log(picture)

            if (base64String) {
                return (
                    <img
                        src={`data:${picture.format};base64,${base64String}`}
                        alt="/slowmotion.jpg"
                        className='h-full w-full rounded-3xl' 
    
                    />
                );

            }
            else
            {
                return (
                    <img
                        src="/slowmotion.jpg"
                        alt="helllo"
                        className='h-full w-full rounded-3xl' 
    
                    />
                );
                
            }

        }
        return null;
    };

    return (
        <div className='h-full w-[20%] '>

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
                    {renderImage()}

                    {/* <img src= `data:${picture.format};base64,${uint8ArrayToBase64(metadata?.common.picture.)}` alt="/slowmotion.jpg" className='h-full w-full rounded-3xl' /> */}
                    {/* <Image src="/slowmotion.jpg" alt="hello" width={100%} height={100}/> */}

                </div>

                <div id="info flex flex-col items-center gap-2">

                    <div id="name" className='text-black text-xl font-semibold ' onClick={handleclick} >
                        {metadata?.common.title || "Kurisu"}
                    </div>

                    <div id="artist" className='flex justify-center text-[#7EA3DB]'>
                        {metadata?.common.artist || "Kr$na"}
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
                
                <div className='w-full  flex items-center '>

                    <div className='btn btn-ghost '>
                    <img src="/like.png" alt="" />
                    <div className=' text-3xl'>
                        
                    </div>
                    </div>
                    
                </div>


            </div>


        </div>
    )
}

export default MusicPlayer