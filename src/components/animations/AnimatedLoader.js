"use client";

import { motion } from "framer-motion";
import React from "react";

const AnimatedLoader = ({ size = "md", text = "Chargement", fullScreen = false }) => {
  // Tailles disponibles
  const sizeVariants = {
    sm: { size: 30, thickness: 3, textSize: "text-sm" },
    md: { size: 60, thickness: 4, textSize: "text-base" },
    lg: { size: 90, thickness: 5, textSize: "text-lg" },
  };
  
  const currentSize = sizeVariants[size];
  
  // Animation du cercle de chargement
  const spinTransition = {
    loop: Infinity,
    ease: "linear",
    duration: 1,
  };
  
  // Animation du texte de chargement
  const textVariants = {
    animate: {
      opacity: [1, 0.5, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };
  
  // Animation des points de chargement
  const dotsVariants = {
    animate: {
      opacity: [0, 1, 0],
      y: [0, -3, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut",
        staggerChildren: 0.2,
      },
    },
  };
  
  const dotVariant = {
    animate: {
      opacity: [0, 1, 0],
      y: [0, -5, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };
  
  const mystikColors = [
    "#8a2be2", // Violet principal
    "#00bfff", // Bleu clair
    "#0078d7", // Bleu
  ];
  
  const containerClass = fullScreen
    ? "fixed inset-0 flex flex-col items-center justify-center bg-background/90 z-50"
    : "flex flex-col items-center justify-center";
  
  return (
    <div className={containerClass}>
      <div className="relative" style={{ width: currentSize.size, height: currentSize.size }}>
        {/* Cercle de fond */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            borderWidth: currentSize.thickness,
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderStyle: "solid",
          }}
        />
        
        {/* Premier cercle tournant */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            borderWidth: currentSize.thickness,
            borderTopColor: mystikColors[0],
            borderRightColor: "transparent",
            borderBottomColor: "transparent",
            borderLeftColor: "transparent",
            borderStyle: "solid",
          }}
          animate={{ rotate: 360 }}
          transition={spinTransition}
        />
        
        {/* Deuxième cercle tournant (sens inverse) */}
        <motion.div
          className="absolute inset-1 rounded-full"
          style={{
            borderWidth: currentSize.thickness,
            borderTopColor: "transparent",
            borderRightColor: mystikColors[1],
            borderBottomColor: "transparent",
            borderLeftColor: "transparent",
            borderStyle: "solid",
          }}
          animate={{ rotate: -360 }}
          transition={{
            ...spinTransition,
            duration: 1.5,
          }}
        />
        
        {/* Troisième cercle tournant */}
        <motion.div
          className="absolute inset-2 rounded-full"
          style={{
            borderWidth: currentSize.thickness,
            borderTopColor: "transparent",
            borderRightColor: "transparent",
            borderBottomColor: mystikColors[2],
            borderLeftColor: "transparent",
            borderStyle: "solid",
          }}
          animate={{ rotate: 360 }}
          transition={{
            ...spinTransition,
            duration: 2,
          }}
        />
      </div>
      
      {text && (
        <motion.div 
          className={`mt-4 flex items-center ${currentSize.textSize} text-gray-light`}
          variants={textVariants}
          animate="animate"
        >
          <span className="mr-1">{text}</span>
          <motion.div className="flex space-x-1" variants={dotsVariants} animate="animate">
            <motion.span variants={dotVariant} animate="animate" custom={0}>.</motion.span>
            <motion.span variants={dotVariant} animate="animate" custom={1}>.</motion.span>
            <motion.span variants={dotVariant} animate="animate" custom={2}>.</motion.span>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default AnimatedLoader; 