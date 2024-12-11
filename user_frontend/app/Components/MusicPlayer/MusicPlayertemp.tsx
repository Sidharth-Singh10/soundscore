import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import LikeSection from "./likesection";

// SVG Icons as Components
const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="black">
      <path d="M8 5v14l11-7z"/>
    </svg>
  );
  
  const PauseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="black">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>
  );
  
  const ForwardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="black">
      <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
    </svg>
  );
  
  const BackwardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="black">
      <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
    </svg>
  );

const formatTime = (timeInSeconds: number) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const MusicPlayertemp = () => {
  const audioSrc = "https://d290w4aumy7t5u.cloudfront.net/beats/undefined/0.5089498111076518/Attack on Titan Eye water Instrumental.mp3";
  const [trackProgress, setTrackProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  // Refs
  const audioRef = useRef(new Audio(audioSrc));
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const audio = audioRef.current;

    const setAudioData = () => {
      setDuration(audio.duration);
    };

    const startTimer = () => {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setTrackProgress(audio.currentTime);
      }, 1000);
    };

    audio.addEventListener('loadedmetadata', setAudioData);

    if (isPlaying) {
      audio.play();
      startTimer();
    } else {
      audio.pause();
      clearInterval(intervalRef.current);
    }

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  const handleSeek = (e: { nativeEvent: { offsetX: number; }; target: { offsetWidth: number; }; }) => {
    const seekTime = (e.nativeEvent.offsetX / e.target.offsetWidth) * duration;
    audioRef.current.currentTime = seekTime;
    setTrackProgress(seekTime);
  };

  const handleSkip = (direction: string) => {
    const currentTime = audioRef.current.currentTime;
    const skipAmount = direction === 'forward' ? 10 : -10;
    audioRef.current.currentTime = Math.max(0, Math.min(currentTime + skipAmount, duration));
    setTrackProgress(audioRef.current.currentTime);
  };

  const currentPercentage = duration 
    ? `${(trackProgress / duration) * 100}%` 
    : "0%";

  return (
    <div className="h-full w-full">
      <div className="rounded-3xl bg-white h-full w-full flex flex-col items-center shadow-[0px_20px_125px_10px_rgba(39,_70,_132,_1)] pt-8 px-4 gap-4">
        <div 
          className="rounded-3xl bg-black h-[40%] w-full shadow-[0px_20px_125px_10px_rgba(39,_70,_132,_0.7)]"
        >
          <img 
            src="/slowmotion.jpg" 
            alt="Album Cover" 
            className="h-full w-full rounded-3xl object-cover"
          />
        </div>

        <div className="flex flex-col items-center">
          <div className="text-black text-xl font-semibold">Hola Amigo</div>
          <div className="text-[#7EA3DB]">Kr$na</div>
        </div>

        <div className="w-full flex flex-col relative top-[-5%] justify-center">
          {/* Enhanced Progress Bar with Framer Motion */}
          <div className="w-full flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-600">
              {formatTime(trackProgress)}
            </span>
            <motion.div 
              className="flex-grow h-2 bg-gray-200 rounded-full cursor-pointer"
              onClick={handleSeek}
            >
              <motion.div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: currentPercentage }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
            <span className="text-sm text-gray-600">
              {formatTime(duration)}
            </span>
          </div>

          {/* Music Controls */}
          <div className="audio-controls w-full flex justify-center gap-4">
            <motion.button 
              type="button" 
              className="prev"
              aria-label="Previous"
              onClick={() => handleSkip('backward')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <BackwardIcon />
            </motion.button>

            {isPlaying ? (
              <motion.button
                type="button"
                className="pause"
                onClick={() => setIsPlaying(false)}
                aria-label="Pause"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <PauseIcon />
              </motion.button>
            ) : (
              <motion.button
                type="button"
                className="play rounded-full"
                onClick={() => setIsPlaying(true)}
                aria-label="Play"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <PlayIcon />
              </motion.button>
            )}

            <motion.button 
              type="button" 
              className="next"
              aria-label="Next"
              onClick={() => handleSkip('forward')}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ForwardIcon />
            </motion.button>
          </div>
          <LikeSection count={5}  />
        </div>
      </div>
    </div>
  );
};

export default MusicPlayertemp;