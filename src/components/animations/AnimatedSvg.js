"use client";

import { motion } from "framer-motion";
import React from "react";

// SVGs animés pour différentes parties de l'application
const svgOptions = {
  // Message en forme d'enveloppe qui s'envole
  flyingMessage: (
    <motion.svg 
      width="100" 
      height="100" 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        y: [0, -10, 0, -5, 0],
        rotate: [0, -5, 5, -3, 0] 
      }}
      transition={{ 
        duration: 3, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
    >
      <motion.path 
        d="M85,85 H15 V30 L50,55 L85,30 V85 Z" 
        fill="#8a2be2" 
        stroke="white" 
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />
      <motion.path 
        d="M15,30 H85 V30 L50,55 L15,30 Z" 
        fill="#0078d7"
        stroke="white" 
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
      />
    </motion.svg>
  ),
  
  // Icône de vague montrant un message en cours de transmission
  messageWave: (
    <motion.svg 
      width="100" 
      height="100" 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.circle 
        cx="50" 
        cy="50" 
        r="40" 
        stroke="#8a2be2" 
        strokeWidth="2" 
        fill="none"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: [0, 1, 1.2, 0],
          opacity: [0, 0.7, 0.3, 0]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut",
          times: [0, 0.3, 0.6, 1]
        }}
      />
      <motion.circle 
        cx="50" 
        cy="50" 
        r="30" 
        stroke="#0078d7" 
        strokeWidth="2" 
        fill="none"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: [0, 1, 1.2, 0],
          opacity: [0, 0.7, 0.3, 0]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 0.5,
          times: [0, 0.3, 0.6, 1]
        }}
      />
      <motion.circle 
        cx="50" 
        cy="50" 
        r="20" 
        stroke="#00bfff" 
        strokeWidth="2" 
        fill="none"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: [0, 1, 1.2, 0],
          opacity: [0, 0.7, 0.3, 0]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 1,
          times: [0, 0.3, 0.6, 1]
        }}
      />
      <motion.circle 
        cx="50" 
        cy="50" 
        r="10" 
        fill="#8a2be2"
        initial={{ scale: 0.8 }}
        animate={{ scale: [0.8, 1, 0.8] }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          ease: "easeInOut"
        }}
      />
    </motion.svg>
  ),
  
  // Masque de mystère
  mysteryMask: (
    <motion.svg 
      width="100" 
      height="100" 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.path 
        d="M30,30 Q50,20 70,30 Q80,40 80,55 Q80,70 65,80 Q50,85 35,80 Q20,70 20,55 Q20,40 30,30 Z" 
        fill="#8a2be2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />
      <motion.circle 
        cx="40" 
        cy="45" 
        r="5" 
        fill="white"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      />
      <motion.circle 
        cx="60" 
        cy="45" 
        r="5" 
        fill="white"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      />
      <motion.path 
        d="M40,65 Q50,75 60,65" 
        stroke="white" 
        strokeWidth="2" 
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.9 }}
      />
      <motion.path 
        d="M20,35 Q25,25 35,25 Q45,25 50,35" 
        stroke="black" 
        strokeWidth="2" 
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.8 }}
        transition={{ duration: 0.5, delay: 1.1 }}
      />
      <motion.path 
        d="M50,35 Q55,25 65,25 Q75,25 80,35" 
        stroke="black" 
        strokeWidth="2" 
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.8 }}
        transition={{ duration: 0.5, delay: 1.3 }}
      />
    </motion.svg>
  ),
  
  // Serrure qui s'ouvre et se ferme
  lock: (
    <motion.svg 
      width="100" 
      height="100" 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.rect 
        x="30" 
        y="45" 
        width="40" 
        height="35" 
        rx="5" 
        fill="#8a2be2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path 
        d="M40,45 V30 Q40,20 50,20 Q60,20 60,30 V45" 
        stroke="#0078d7" 
        strokeWidth="4" 
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />
      <motion.circle 
        cx="50" 
        cy="60" 
        r="8" 
        fill="#00bfff"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
      />
      <motion.rect 
        x="48" 
        y="55" 
        width="4" 
        height="10" 
        rx="2" 
        fill="white"
        initial={{ rotateZ: 0 }}
        animate={{ rotateZ: 360 }}
        transition={{ duration: 1.5, delay: 1.5 }}
        transformOrigin="50px 60px"
      />
    </motion.svg>
  ),
  
  // Icône d'ampoule pour les indices
  clue: (
    <motion.svg 
      width="100" 
      height="100" 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.circle 
        cx="50" 
        cy="40" 
        r="25" 
        fill="#f4c542"
        initial={{ opacity: 0.5 }}
        animate={{ 
          opacity: [0.5, 1, 0.5],
          scale: [1, 1.1, 1] 
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />
      <motion.path 
        d="M40,65 H60 Q60,55 65,50 Q70,45 70,35 Q70,20 50,20 Q30,20 30,35 Q30,45 35,50 Q40,55 40,65 Z" 
        fill="#f4c542"
        initial={{ opacity: 0.7 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.rect 
        x="40" 
        y="65" 
        width="20" 
        height="5" 
        rx="2" 
        fill="#c29d35"
      />
      <motion.rect 
        x="42" 
        y="70" 
        width="16" 
        height="5" 
        rx="2" 
        fill="#c29d35"
      />
      <motion.rect 
        x="44" 
        y="75" 
        width="12" 
        height="5" 
        rx="2" 
        fill="#c29d35"
      />
      <motion.path 
        d="M45,40 L55,40 M45,50 L55,50 M50,30 L50,60" 
        stroke="white" 
        strokeWidth="2" 
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      />
    </motion.svg>
  )
};

const AnimatedSvg = ({ name, width = 100, height = 100, className = "" }) => {
  // Clone le SVG sélectionné et ajuste sa taille
  const selectedSvg = svgOptions[name];
  
  if (!selectedSvg) {
    return <div>SVG non trouvé</div>;
  }
  
  return (
    <div className={`inline-block ${className}`} style={{ width, height }}>
      {React.cloneElement(selectedSvg, { width, height })}
    </div>
  );
};

export default AnimatedSvg;