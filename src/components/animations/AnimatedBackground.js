"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const AnimatedBackground = ({ children }) => {
  const [shapes, setShapes] = useState([]);
  
  useEffect(() => {
    // Génère des formes aléatoires pour l'arrière-plan
    const generateShapes = () => {
      const newShapes = [];
      const shapeTypes = ["circle", "square", "triangle"];
      const colors = ["#8a2be2", "#0078d7", "#00bfff", "#4b0082"];
      
      for (let i = 0; i < 15; i++) {
        newShapes.push({
          id: i,
          type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
          size: Math.random() * 60 + 10,
          x: Math.random() * 100,
          y: Math.random() * 100,
          opacity: Math.random() * 0.2 + 0.05,
          rotation: Math.random() * 360,
          duration: Math.random() * 20 + 10,
          delay: Math.random() * 5,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
      
      setShapes(newShapes);
    };
    
    generateShapes();
  }, []);
  
  const renderShape = (shape) => {
    switch (shape.type) {
      case "circle":
        return (
          <motion.div
            key={shape.id}
            className="absolute rounded-full"
            style={{
              width: shape.size,
              height: shape.size,
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              backgroundColor: shape.color,
              opacity: shape.opacity,
            }}
            animate={{
              x: [0, 30, -20, 10, 0],
              y: [0, -30, 20, -10, 0],
              rotate: [0, shape.rotation, 0],
            }}
            transition={{
              duration: shape.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: shape.delay,
            }}
          />
        );
      case "square":
        return (
          <motion.div
            key={shape.id}
            className="absolute"
            style={{
              width: shape.size,
              height: shape.size,
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              backgroundColor: shape.color,
              opacity: shape.opacity,
              borderRadius: "4px",
            }}
            animate={{
              x: [0, -40, 20, -10, 0],
              y: [0, 20, -40, 10, 0],
              rotate: [0, shape.rotation, 0],
            }}
            transition={{
              duration: shape.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: shape.delay,
            }}
          />
        );
      case "triangle":
        return (
          <motion.div
            key={shape.id}
            className="absolute"
            style={{
              width: 0,
              height: 0,
              left: `${shape.x}%`,
              top: `${shape.y}%`,
              borderLeft: `${shape.size / 2}px solid transparent`,
              borderRight: `${shape.size / 2}px solid transparent`,
              borderBottom: `${shape.size}px solid ${shape.color}`,
              opacity: shape.opacity,
            }}
            animate={{
              x: [0, 40, -30, 20, 0],
              y: [0, -20, 40, -10, 0],
              rotate: [0, shape.rotation, 0],
            }}
            transition={{
              duration: shape.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: shape.delay,
            }}
          />
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden">
        {shapes.map(renderShape)}
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default AnimatedBackground; 