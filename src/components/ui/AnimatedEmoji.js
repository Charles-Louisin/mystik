import { motion } from "framer-motion";

/**
 * Composant d'emoji animé qui affiche un emoji avec une animation d'entrée
 * @param {string} emoji - L'emoji à afficher
 * @param {number} delay - Délai avant le début de l'animation
 * @param {string} className - Classes CSS additionnelles
 */
const AnimatedEmoji = ({ emoji, delay = 0, className = "" }) => {
  return (
    <motion.span 
      className={`inline-block text-2xl ${className}`}
      initial={{ scale: 0, rotate: -10 }}
      animate={{ 
        scale: [0, 1.2, 1],
        rotate: [-10, 10, 0]
      }}
      transition={{ 
        delay: delay,
        duration: 0.5, 
        ease: "easeOut"
      }}
    >
      {emoji}
    </motion.span>
  );
};

export default AnimatedEmoji; 