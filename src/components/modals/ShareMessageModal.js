import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaHeart, FaAngry, FaSurprise, FaSadTear, FaSmile, FaRegSadTear } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// Définition des styles et animations pour chaque émotion
const emotionStyles = {
  amour: {
    gradient: "from-pink-500 via-pink-600 to-pink-700",
    bgHeader: "bg-gradient-to-r from-pink-800 to-pink-900",
    textColor: "text-pink-50",
    shadowColor: "rgba(233, 30, 99, 0.4)",
    emoji: "❤️",
    animationMessage: {
      animate: { 
        boxShadow: ["0 0 10px rgba(233, 30, 99, 0.2)", "0 0 20px rgba(233, 30, 99, 0.4)", "0 0 10px rgba(233, 30, 99, 0.2)"],
      },
      transition: { 
        duration: 2,
        repeat: 0
      }
    }
  },
  colère: {
    gradient: "from-red-600 via-red-700 to-red-800",
    bgHeader: "bg-gradient-to-r from-red-800 to-red-900",
    textColor: "text-red-50 font-bold",
    shadowColor: "rgba(244, 67, 54, 0.4)",
    emoji: "😡",
    animationMessage: {
      animate: { 
        boxShadow: ["0 0 10px rgba(244, 67, 54, 0.2)", "0 0 20px rgba(244, 67, 54, 0.4)", "0 0 10px rgba(244, 67, 54, 0.2)"],
      },
      transition: { 
        duration: 2,
        repeat: 0
      }
    }
  },
  admiration: {
    gradient: "from-emerald-500 via-emerald-600 to-emerald-700",
    bgHeader: "bg-gradient-to-r from-emerald-800 to-emerald-900",
    textColor: "text-emerald-50",
    shadowColor: "rgba(139, 195, 74, 0.4)",
    emoji: "😮",
    animationMessage: {
      animate: { 
        boxShadow: ["0 0 10px rgba(139, 195, 74, 0.2)", "0 0 20px rgba(139, 195, 74, 0.4)", "0 0 10px rgba(139, 195, 74, 0.2)"],
      },
      transition: { 
        duration: 2,
        repeat: 0
      }
    }
  },
  regret: {
    gradient: "from-slate-500 via-slate-600 to-slate-700",
    bgHeader: "bg-gradient-to-r from-slate-800 to-slate-900",
    textColor: "text-slate-50 italic",
    shadowColor: "rgba(96, 125, 139, 0.4)",
    emoji: "😔",
    animationMessage: {
      animate: { 
        boxShadow: ["0 0 10px rgba(96, 125, 139, 0.2)", "0 0 20px rgba(96, 125, 139, 0.4)", "0 0 10px rgba(96, 125, 139, 0.2)"],
      },
      transition: { 
        duration: 2,
        repeat: 0
      }
    }
  },
  joie: {
    gradient: "from-amber-400 via-amber-500 to-amber-600",
    bgHeader: "bg-gradient-to-r from-amber-700 to-amber-800",
    textColor: "text-amber-50",
    shadowColor: "rgba(255, 235, 59, 0.4)",
    emoji: "😄",
    animationMessage: {
      animate: { 
        boxShadow: ["0 0 10px rgba(255, 235, 59, 0.2)", "0 0 20px rgba(255, 235, 59, 0.4)", "0 0 10px rgba(255, 235, 59, 0.2)"],
      },
      transition: { 
        duration: 2,
        repeat: 0
      }
    }
  },
  tristesse: {
    gradient: "from-blue-500 via-blue-600 to-blue-700",
    bgHeader: "bg-gradient-to-r from-blue-800 to-blue-900",
    textColor: "text-blue-50",
    shadowColor: "rgba(33, 150, 243, 0.4)",
    emoji: "😢",
    animationMessage: {
      animate: { 
        boxShadow: ["0 0 10px rgba(33, 150, 243, 0.2)", "0 0 20px rgba(33, 150, 243, 0.4)", "0 0 10px rgba(33, 150, 243, 0.2)"],
      },
      transition: { 
        duration: 2,
        repeat: 0
      }
    }
  },
  neutre: {
    gradient: "from-violet-500 via-purple-600 to-indigo-700",
    bgHeader: "bg-gradient-to-r from-violet-800 to-indigo-900",
    textColor: "text-gray-50",
    shadowColor: "rgba(79, 70, 229, 0.4)",
    emoji: "✨",
    animationMessage: {
      animate: { 
        boxShadow: ["0 0 10px rgba(79, 70, 229, 0.2)", "0 0 20px rgba(79, 70, 229, 0.4)", "0 0 10px rgba(79, 70, 229, 0.2)"],
      },
      transition: { 
        duration: 2,
        repeat: 0
      }
    }
  }
};

const ShareMessageModal = ({ isOpen, onClose, message }) => {
  const messageRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      
      // Arrêter l'animation après 2 secondes
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Sélectionner le style en fonction de l'émotion du message
  const emotion = message?.emotionalFilter || 'neutre';
  const style = emotionStyles[emotion] || emotionStyles.neutre;
  
  // Préparer l'icône d'émotion le cas échéant
  const EmotionIcon = style.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-gray-900 overflow-hidden w-full max-w-md m-4 rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header stylisé selon l'émotion avec dégradé */}
            <div className={`relative py-4 px-6 ${style.bgHeader}`}>
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-white/70 hover:text-white transition-colors"
              >
                <FaTimes />
              </button>
              <h2 className="text-xl font-bold text-center text-white flex items-center justify-center">
                {/* <motion.span 
                  className="inline-block mr-2 text-2xl"
                  animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.5 }}
                  >
                    {style.emoji}
                </motion.span> */}
                <span>Laisse-moi des messages <br/> anonymes !</span>
              </h2>
            </div>

            {/* Message content for sharing - Stylisé selon l'émotion avec taille augmentée */}
            <div className="p-6 bg-gray-900">
              <motion.div 
                ref={messageRef}
                className={`bg-gradient-to-br ${style.gradient} p-6 rounded-xl shadow-lg mb-4 min-h-[120px] flex items-center justify-center`}
                animate={isAnimating ? style.animationMessage.animate : {}}
                transition={style.animationMessage.transition}
                style={{ 
                  boxShadow: `0 8px 32px ${style.shadowColor}`,
                  border: `1px solid ${style.shadowColor.replace(')', ', 0.2)')}` 
                }}
              >
                <div className={`${style.textColor} text-sm sm:text-base md:text-lg font-medium text-center max-h-[300px] overflow-y-auto w-full px-2`}>
                  {message?.content || ""}
                </div>
              </motion.div>

              {/* Logo ou watermark */}
              <div className="flex justify-center items-center mt-4">
                <div className="text-xs text-gray-400 flex items-center">
                  <span className="mr-1 font-semibold">mystik</span>
                  <span className="opacity-50">•</span>
                  <span className="ml-1 text-gray-500 text-[10px]">message anonyme</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareMessageModal; 