import React, { useState } from 'react';
import { motion } from 'framer-motion';
interface LikeSectionProps {
    count: number;
  }

  const LikeSection: React.FC<LikeSectionProps> = ({ count }) => {
 

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`transition-colors duration-300 text-red-500 `}
        aria-label="Like Button"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill='currentColor' 
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </motion.button>
      <span className="text-gray-700">{0} Likes</span>
    </div>
  );
};

export default LikeSection;