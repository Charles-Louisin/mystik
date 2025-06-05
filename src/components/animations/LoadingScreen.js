"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedLoader from "./AnimatedLoader";

const LoadingScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Écouter les changements de route
    const handleRouteChangeStart = () => {
      setIsLoading(true);
    };
    
    const handleRouteChangeComplete = () => {
      // Ajouter un petit délai pour rendre la transition plus fluide
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    };
    
    // Ajouter les écouteurs d'événements
    window.addEventListener("beforeunload", handleRouteChangeStart);
    
    // Simuler un chargement initial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => {
      // Nettoyer les écouteurs d'événements
      window.removeEventListener("beforeunload", handleRouteChangeStart);
      clearTimeout(timer);
    };
  }, []);
  
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center"
        >
          <AnimatedLoader size="lg" fullScreen={false} text="Chargement" />
          
          <motion.div
            className="mt-8 text-xl font-bold text-primary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Mystik
          </motion.div>
          
          <motion.div
            className="mt-2 text-gray-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Préparation de votre expérience...
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen; 