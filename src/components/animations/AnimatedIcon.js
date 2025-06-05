"use client";

import { motion } from "framer-motion";
import React from "react";

const AnimatedIcon = ({ icon: Icon, color = "primary", size = "md", animated = true, onClick }) => {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  };
  
  const colorClasses = {
    primary: "text-primary",
    secondary: "text-secondary",
    white: "text-white",
    gray: "text-gray-light",
  };
  
  const pulseVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      opacity: [0.9, 1, 0.9],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };
  
  const hoverVariants = {
    initial: { scale: 1, rotate: 0 },
    hover: { scale: 1.2, rotate: [0, -10, 10, -5, 5, 0], transition: { duration: 0.6 } },
  };
  
  return (
    <motion.div
      className={`${sizeClasses[size]} ${colorClasses[color]} inline-flex`}
      variants={animated ? pulseVariants : {}}
      animate={animated ? "pulse" : "initial"}
      whileHover="hover"
      variants={hoverVariants}
      onClick={onClick}
      style={{ display: "inline-flex", cursor: onClick ? "pointer" : "default" }}
    >
      <Icon />
    </motion.div>
  );
};

export default AnimatedIcon; 