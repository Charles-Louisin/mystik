"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import React from "react";

const AnimatedLogo = ({ width = 200, height = 200, animated = true }) => {
  // Animation du logo : rotation légère et pulsation
  const logoVariants = {
    initial: { scale: 1, rotate: 0 },
    animate: {
      scale: [1, 1.05, 1],
      rotate: [0, -2, 2, 0],
      transition: {
        scale: {
          repeat: Infinity,
          duration: 3,
          ease: "easeInOut"
        },
        rotate: {
          repeat: Infinity,
          duration: 5,
          ease: "easeInOut"
        }
      }
    }
  };
  
  // Animation de lueur
  const glowVariants = {
    initial: { boxShadow: "0 0 0 rgba(138, 43, 226, 0)" },
    animate: {
      boxShadow: ["0 0 20px rgba(138, 43, 226, 0.2)", "0 0 30px rgba(138, 43, 226, 0.6)", "0 0 20px rgba(138, 43, 226, 0.2)"],
      transition: {
        repeat: Infinity,
        duration: 3,
        ease: "easeInOut"
      }
    }
  };
  
  return (
    <motion.div
      className="relative"
      variants={animated ? logoVariants : {}}
      initial="initial"
      animate={animated ? "animate" : "initial"}
      style={{ width, height }}
    >
      <motion.div
        className="absolute inset-0 rounded-full z-0"
        variants={animated ? glowVariants : {}}
        initial="initial"
        animate={animated ? "animate" : "initial"}
      />
      <div className="relative z-10">
        <Image 
          src="/logo.svg" 
          alt="Mystik Logo" 
          width={width} 
          height={height}
          className="object-contain"
          priority
        />
      </div>
    </motion.div>
  );
};

export default AnimatedLogo; 