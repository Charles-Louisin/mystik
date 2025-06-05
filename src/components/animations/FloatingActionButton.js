"use client";

import { motion } from "framer-motion";
import React, { useState } from "react";

const FloatingActionButton = ({ 
  icon: Icon, 
  onClick, 
  color = "primary", 
  size = "md",
  position = "bottom-right",
  tooltip = "",
  actions = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Tailles disponibles
  const sizeClasses = {
    sm: "w-10 h-10 text-lg",
    md: "w-14 h-14 text-xl",
    lg: "w-16 h-16 text-2xl",
  };
  
  // Couleurs disponibles
  const colorClasses = {
    primary: "bg-primary text-white",
    secondary: "bg-secondary text-white",
    danger: "bg-error text-white",
  };
  
  // Positions disponibles
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
    "center-right": "top-1/2 -translate-y-1/2 right-6",
    "center-left": "top-1/2 -translate-y-1/2 left-6",
  };
  
  // Animation du bouton principal
  const mainButtonVariants = {
    rest: { scale: 1, rotate: 0 },
    hover: { scale: 1.1, rotate: 0 },
    tap: { scale: 0.9 },
    spin: { rotate: 135 },
  };
  
  // Animation de la lueur
  const glowVariants = {
    rest: { opacity: 0, scale: 0 },
    hover: { 
      opacity: 0.7, 
      scale: 1.5,
      transition: { duration: 0.3 } 
    },
  };
  
  // Animation des boutons d'actions
  const actionVariants = {
    closed: (i) => ({
      y: 0,
      opacity: 0,
      transition: {
        duration: 0.2,
        delay: i * 0.05,
      }
    }),
    open: (i) => ({
      y: -16 - i * 60,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        delay: i * 0.05,
      }
    })
  };
  
  // Animation du tooltip
  const tooltipVariants = {
    hidden: { 
      opacity: 0, 
      x: 20,
      scale: 0.8
    },
    visible: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: {
        delay: 0.2,
        duration: 0.2
      }
    }
  };
  
  const handleMainButtonClick = () => {
    if (actions.length > 0) {
      setIsOpen(!isOpen);
    } else if (onClick) {
      onClick();
    }
  };
  
  return (
    <div className={`fixed ${positionClasses[position]} z-40`}>
      {/* Boutons d'action */}
      {actions.map((action, index) => (
        <motion.button
          key={index}
          className={`absolute left-0 right-0 mx-auto ${sizeClasses[size]} ${colorClasses[action.color || color]} rounded-full shadow-lg flex items-center justify-center`}
          custom={actions.length - index}
          variants={actionVariants}
          initial="closed"
          animate={isOpen ? "open" : "closed"}
          onClick={() => {
            action.onClick();
            setIsOpen(false);
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {action.icon && <action.icon />}
          
          {/* Tooltip pour chaque action */}
          {action.tooltip && (
            <motion.div
              className="absolute right-full mr-3 bg-card-bg text-white px-3 py-1 rounded-lg shadow-lg text-sm whitespace-nowrap"
              initial="hidden"
              animate="visible"
              variants={tooltipVariants}
            >
              {action.tooltip}
              <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[8px] border-l-card-bg" />
            </motion.div>
          )}
        </motion.button>
      ))}
      
      {/* Bouton principal */}
      <motion.button
        className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full shadow-lg flex items-center justify-center relative z-30`}
        variants={mainButtonVariants}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        animate={isOpen ? "spin" : "rest"}
        onClick={handleMainButtonClick}
      >
        {/* Effet de lueur au survol */}
        <motion.div
          className={`absolute inset-0 rounded-full ${colorClasses[color]} blur-lg z-0`}
          variants={glowVariants}
          initial="rest"
          whileHover="hover"
        />
        
        <span className="relative z-10">
          <Icon />
        </span>
      </motion.button>
      
      {/* Tooltip pour le bouton principal */}
      {tooltip && !isOpen && (
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 right-full mr-3 bg-card-bg text-white px-3 py-1 rounded-lg shadow-lg text-sm whitespace-nowrap"
          initial={{ opacity: 0, x: 20 }}
          whileHover={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {tooltip}
          <div className="absolute top-1/2 -translate-y-1/2 -right-2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[8px] border-l-card-bg" />
        </motion.div>
      )}
      
      {/* Overlay pour fermer le menu */}
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default FloatingActionButton; 