"use client"
const musicMetadata = require('music-metadata');
import { IAudioMetadata } from 'music-metadata';
import { IPicture } from 'music-metadata';
import React, { useEffect, useRef, useState } from 'react'
import MusicControls from './MusicControls';
import { Buffer } from 'buffer';

const MusicPlayer = ({ 
    audioSrc, 
    onSelect 
}: {
    audioSrc: string,
    onSelect: () => void,
}) => {
    const [metadata, setMetadata] = useState<IAudioMetadata | null>(null);
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

    useEffect(() => {
        const fetchAndParseMetadata = async () => {
            try {
                const response = await fetch(audioSrc);
                const blob = await response.blob();

                musicMetadata.parseBlob(blob).then((metadata: IAudioMetadata) => {
                    setMetadata(metadata);
                });
            } catch (error) {
                console.error('Error fetching, converting, or parsing metadata:', error);
            }
        };
        fetchAndParseMetadata();
    }, [audioSrc]);

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

    const renderImage = () => {
        if (metadata && metadata.common.picture && metadata.common.picture.length > 0) {
            const picture = metadata.common.picture[0];
            
            try {
                const base64String = Buffer.from(picture.data).toString('base64');
                
                if (base64String) {
                    return (
                        <img
                            src={`data:${picture.format};base64,${base64String}`}
                            alt={metadata.common.title || "Album Artwork"}
                            className='h-full w-full rounded-3xl object-cover' 
                        />
                    );
                }
            } catch (error) {
                console.error('Error converting image:', error);
            }
        }
        
        return (
            <img
                src="/slowmotion.jpg"
                alt="Default Artwork"
                className='h-full w-full rounded-3xl object-cover' 
            />
        );
    };

    const handleSelect = () => {
        // Stop any currently playing audio
        audioRef.current.pause();
        
        // Call the onSelect prop
        onSelect();
    };

    return (
        <div 
            className='h-full w-full cursor-pointer' 
            onClick={handleSelect}
        >
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
                </div>

                <div id="info" className='flex flex-col items-center gap-2'>
                    <div className='text-black text-xl font-semibold'>
                        {metadata?.common.title || "Kurisu"}
                    </div>

                    <div className='flex justify-center text-[#7EA3DB]'>
                        {metadata?.common.artist || "Kr$na"}
                    </div>
                </div>

                <div id="controls" className='w-full flex flex-col justify-center'>
                    <div className='flex justify-center items-center'>
                        <progress 
                            className="progress progress-primary w-56" 
                            value={trackProgress} 
                            max={duration || 100}
                        ></progress>
                    </div>

                    <MusicControls
                        isPlaying={isPlaying}
                        onPlayPauseClick={setIsPlaying}
                    />
                </div>
                
                <div className='w-full flex items-center'>
                    <div className='btn btn-ghost'>
                        <img src="/like.png" alt="" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MusicPlayer;