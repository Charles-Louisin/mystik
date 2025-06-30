'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Détection iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Événement pour les appareils Android/autres
    window.addEventListener('beforeinstallprompt', (e) => {
      // Empêcher Chrome 67+ de montrer automatiquement la boîte de dialogue
      e.preventDefault();
      // Stocker l'événement pour l'utiliser plus tard
      setDeferredPrompt(e);
      setIsInstallable(true);
    });

    // Vérifier si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', () => {});
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    // Montrer la boîte de dialogue d'installation
    deferredPrompt.prompt();
    
    // Attendre que l'utilisateur réponde à la boîte de dialogue
    const { outcome } = await deferredPrompt.userChoice;
    
    // On n'a plus besoin de l'événement
    setDeferredPrompt(null);
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
  };

  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <motion.button
        onClick={handleInstallClick}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-purple-700 text-white px-4 py-2 rounded-full shadow-lg"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
          <path d="M20 16v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-1" />
        </svg>
        Installer l'app
      </motion.button>

      {showIOSInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <motion.div 
            className="bg-gray-900 p-6 rounded-xl max-w-sm w-full border border-purple-500"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="text-xl font-bold text-white mb-4">Installer sur iOS</h3>
            <ol className="text-gray-200 space-y-3 mb-6">
              <li>1. Appuyez sur <span className="inline-block bg-gray-800 p-1 rounded">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="8 17 12 21 16 17" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20 4h-7a4 4 0 1 0-8 0H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                </svg>
              </span> en bas de votre navigateur</li>
              <li>2. Faites défiler et appuyez sur <strong>"Sur l'écran d'accueil"</strong></li>
              <li>3. Appuyez sur <strong>"Ajouter"</strong> en haut à droite</li>
            </ol>
            <button 
              onClick={() => setShowIOSInstructions(false)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
            >
              Compris
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default InstallPWA; 