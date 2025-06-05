"use client";

import { motion } from "framer-motion";
import React from "react";

const AnimatedButton = ({ 
  children, 
  onClick, 
  className = "", 
  type = "button",
  disabled = false,
  loading = false,
  variant = "primary",
  size = "md",
  fullWidth = false,
  icon: Icon = null,
  iconPosition = "left",
}) => {
  // Variantes pour les différents styles de boutons
  const buttonVariants = {
    primary: "btn-primary",
    secondary: "bg-secondary text-white border-none rounded-full px-4 py-2 font-semibold",
    outline: "border border-primary text-primary hover:bg-primary/10 rounded-full px-4 py-2 font-semibold",
    ghost: "text-primary hover:bg-primary/10 rounded-full px-4 py-2 font-semibold",
    danger: "bg-error text-white border-none rounded-full px-4 py-2 font-semibold",
  };
  
  // Variantes pour les différentes tailles
  const sizeVariants = {
    sm: "text-sm py-1 px-3",
    md: "text-base py-2 px-4",
    lg: "text-lg py-3 px-6",
    xl: "text-xl py-4 px-8",
  };
  
  // Animation au survol et au clic
  const buttonMotion = {
    rest: { scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95, transition: { duration: 0.1 } },
  };
  
  // Animation du loader
  const loaderVariants = {
    animate: {
      rotate: 360,
      transition: {
        repeat: Infinity,
        duration: 1,
        ease: "linear",
      },
    },
  };
  
  // Effet de lueur au survol
  const glowVariants = {
    rest: { 
      boxShadow: "0 0 0 rgba(138, 43, 226, 0)" 
    },
    hover: { 
      boxShadow: "0 0 20px rgba(138, 43, 226, 0.6)",
      transition: { duration: 0.3 } 
    },
  };
  
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${buttonVariants[variant]} 
        ${sizeVariants[size]}
        ${fullWidth ? "w-full" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
        relative overflow-hidden transition-all
      `}
      initial="rest"
      whileHover={!disabled && !loading ? ["hover", "glow"] : "rest"}
      whileTap={!disabled && !loading ? "tap" : "rest"}
      variants={{
        ...buttonMotion,
        ...glowVariants,
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <motion.div
            className="w-5 h-5 border-2 border-t-transparent border-white rounded-full mr-2"
            variants={loaderVariants}
            animate="animate"
          />
          <span>Chargement...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          {Icon && iconPosition === "left" && (
            <span className="mr-2"><Icon /></span>
          )}
          <span>{children}</span>
          {Icon && iconPosition === "right" && (
            <span className="ml-2"><Icon /></span>
          )}
        </div>
      )}
      
      {/* Effet d'ondulation au clic */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        initial={{ scale: 0, opacity: 0.5 }}
        whileTap={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.5 }}
        style={{ 
          background: "radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)"
        }}
      />
    </motion.button>
  );
};

export default AnimatedButton; 