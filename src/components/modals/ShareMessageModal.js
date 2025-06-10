import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaShare, FaCopy, FaHeart, FaAngry, FaSurprise, FaSadTear, FaSmile, FaRegSadTear } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// Définition des styles et animations pour chaque émotion
const emotionStyles = {
  amour: {
    gradient: "from-pink-600 to-pink-800",
    bgHeader: "bg-pink-900",
    bgFooter: "bg-pink-900/70",
    textColor: "text-pink-100",
    buttonColor: "bg-pink-700 hover:bg-pink-600",
    icon: FaHeart,
    shadowColor: "rgba(233, 30, 99, 0.3)",
    emoji: "❤️",
    animationMessage: {
      animate: { 
        scale: [1, 1.02, 1],
        boxShadow: ["0 0 0 rgba(233, 30, 99, 0)", "0 0 15px rgba(233, 30, 99, 0.5)", "0 0 0 rgba(233, 30, 99, 0)"],
      },
      transition: { 
        repeat: Infinity, 
        duration: 2,
        repeatType: "mirror"
      }
    }
  },
  colère: {
    gradient: "from-red-700 to-red-900",
    bgHeader: "bg-red-900",
    bgFooter: "bg-red-900/70",
    textColor: "text-red-100 font-bold uppercase",
    buttonColor: "bg-red-700 hover:bg-red-600",
    icon: FaAngry,
    shadowColor: "rgba(244, 67, 54, 0.3)",
    emoji: "😡",
    animationMessage: {
      animate: { 
        x: [0, -2, 0, 2, 0],
      },
      transition: { 
        repeat: Infinity, 
        duration: 0.3
      }
    }
  },
  admiration: {
    gradient: "from-green-600 to-green-800",
    bgHeader: "bg-green-900",
    bgFooter: "bg-green-900/70",
    textColor: "text-green-100",
    buttonColor: "bg-green-700 hover:bg-green-600",
    icon: FaSurprise,
    shadowColor: "rgba(139, 195, 74, 0.3)",
    emoji: "😮",
    animationMessage: {
      animate: { 
        scale: [1, 1.03, 1],
      },
      transition: { 
        repeat: Infinity, 
        duration: 2.5,
        repeatType: "mirror"
      }
    }
  },
  regret: {
    gradient: "from-slate-600 to-slate-800",
    bgHeader: "bg-slate-800",
    bgFooter: "bg-slate-800/70",
    textColor: "text-slate-200 italic",
    buttonColor: "bg-slate-700 hover:bg-slate-600",
    icon: FaSadTear,
    shadowColor: "rgba(96, 125, 139, 0.3)",
    emoji: "😔",
    animationMessage: {
      animate: { 
        y: [0, -2, 0],
        opacity: [1, 0.9, 1]
      },
      transition: { 
        repeat: Infinity, 
        duration: 3
      }
    }
  },
  joie: {
    gradient: "from-yellow-500 to-amber-700",
    bgHeader: "bg-amber-800",
    bgFooter: "bg-amber-800/70",
    textColor: "text-yellow-100",
    buttonColor: "bg-yellow-600 hover:bg-yellow-500",
    icon: FaSmile,
    shadowColor: "rgba(255, 235, 59, 0.3)",
    emoji: "😄",
    animationMessage: {
      animate: { 
        rotate: [-1, 0, 1, 0, -1],
        backgroundColor: ["rgba(234, 179, 8, 0.8)", "rgba(234, 179, 8, 0.9)", "rgba(234, 179, 8, 0.8)"]
      },
      transition: { 
        repeat: Infinity, 
        duration: 2
      }
    }
  },
  tristesse: {
    gradient: "from-blue-600 to-blue-900",
    bgHeader: "bg-blue-900",
    bgFooter: "bg-blue-900/70",
    textColor: "text-blue-100",
    buttonColor: "bg-blue-700 hover:bg-blue-600",
    icon: FaRegSadTear,
    shadowColor: "rgba(33, 150, 243, 0.3)",
    emoji: "😢",
    animationMessage: {
      animate: { 
        y: [0, 2, 0],
        opacity: [1, 0.9, 1]
      },
      transition: { 
        repeat: Infinity, 
        duration: 3,
        repeatType: "mirror"
      }
    }
  },
  neutre: {
    gradient: "from-indigo-600 via-purple-600 to-violet-700",
    bgHeader: "bg-indigo-900",
    bgFooter: "bg-indigo-900/70",
    textColor: "text-gray-100",
    buttonColor: "bg-indigo-700 hover:bg-indigo-600",
    icon: FaShare,
    shadowColor: "rgba(79, 70, 229, 0.3)",
    emoji: "✨",
    animationMessage: {
      animate: { 
        boxShadow: ["0 0 0 rgba(79, 70, 229, 0)", "0 0 10px rgba(79, 70, 229, 0.3)", "0 0 0 rgba(79, 70, 229, 0)"],
        scale: [1, 1.01, 1]
      },
      transition: { 
        repeat: Infinity, 
        duration: 3,
        repeatType: "mirror"
      }
    }
  }
};

const ShareMessageModal = ({ isOpen, onClose, message }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const messageRef = useRef(null);

  useEffect(() => {
    // Reset copy status when modal opens
    if (isOpen) {
      setCopySuccess(false);
    }
  }, [isOpen]);

  // Function to handle screenshot sharing
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Message anonyme de Mystik',
          text: message.content
        });
      } else {
        handleCopyToClipboard();
      }
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  // Function to copy message text to clipboard
  const handleCopyToClipboard = () => {
    if (message) {
      navigator.clipboard.writeText(message.content);
      setCopySuccess(true);
      toast.success('Message copié dans le presse-papier!');
      
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white overflow-hidden w-full max-w-md m-4 rounded-xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header stylisé selon l'émotion */}
            <div className={`relative py-4 px-6 border-b ${style.bgHeader} border-opacity-30`}>
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white"
              >
                <FaTimes />
              </button>
              <h2 className="text-xl font-bold text-center text-white">
                {EmotionIcon && (
                  <motion.span 
                    className="inline-block mr-2"
                    animate={style.animationMessage.animate}
                    transition={style.animationMessage.transition}
                  >
                    {style.emoji}
                  </motion.span>
                )}
                Partager ce message
              </h2>
            </div>

            {/* Message content for sharing - Stylisé selon l'émotion */}
            <div className="p-6 bg-gray-900">
              <motion.div 
                ref={messageRef}
                className={`bg-gradient-to-br ${style.gradient} p-6 rounded-xl shadow-lg mb-4`}
                {...style.animationMessage}
              >
                <div className={`${style.textColor} text-xl font-medium text-center`}>
                  {message?.content || ""}
                </div>
              </motion.div>
            </div>

            {/* Actions */}
            <div className={`p-4 flex justify-between ${style.bgFooter}`}>
              <motion.button
                onClick={handleCopyToClipboard}
                className={`flex items-center justify-center px-4 py-2 rounded-lg text-white ${style.buttonColor} transition-colors`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaCopy className="mr-2" />
                {copySuccess ? 'Copié !' : 'Copier'}
              </motion.button>
              
              <motion.button
                onClick={handleShare}
                className={`flex items-center justify-center px-4 py-2 rounded-lg text-white ${style.buttonColor} transition-colors`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaShare className="mr-2" />
                Partager
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareMessageModal; 