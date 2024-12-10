import React from 'react';
import { motion } from 'framer-motion';

const MultiCircleLoader: React.FC = () => {
  const circleColors = {
    red: '#cc0000',
    orange: '#ff6600', 
    yellow: '#ffff33',
    green: '#33ff33'
  };

  const circleRadii = [3, 8, 13, 18];
  const dashArrays = [
    { array: '4 11 4 0', offset: 19 },
    { array: '10 30 10 0', offset: 50 },
    { array: '17 48 17 0', offset: 82 },
    { array: '23 69 23 0', offset: 114 }
  ];

  return (
    <div className="relative w-[200px] h-[200px]">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="200px" 
        height="200px" 
        viewBox="0 0 200 200" 
        className="absolute top-0 left-0"
      >
        {circleRadii.map((radius, index) => {
          const color = Object.values(circleColors)[index];
          const { array, offset } = dashArrays[index];
          const duration = 3 - (index * 0.25);

          return (
            <motion.circle
              key={color}
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeDasharray={array}
              animate={{
                strokeDashoffset: [0, offset],
                transition: {
                  duration: duration,
                  repeat: Infinity,
                  ease: "linear"
                }
              }}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default MultiCircleLoader;