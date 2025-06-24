"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaEnvelope, FaLock, FaUserSecret, FaTimes, FaInfoCircle, 
  FaGamepad, FaLightbulb, FaKey, FaQuestion, FaPuzzlePiece
} from "react-icons/fa";

import AnimatedLogo from "@/components/animations/AnimatedLogo";
import AnimatedIcon from "@/components/animations/AnimatedIcon";
import AnimatedButton from "@/components/animations/AnimatedButton";
import AnimatedEmoji from "@/components/ui/AnimatedEmoji";

export default function Home() {
  const [activeModal, setActiveModal] = useState(null);

  const openModal = (modalId) => {
    setActiveModal(modalId);
    document.body.style.overflow = "hidden"; // Empêche le défilement du body
  };

  const closeModal = () => {
    setActiveModal(null);
    document.body.style.overflow = ""; // Rétablit le défilement
  };

  // Contenu détaillé pour chaque modal
  const modalContent = {
    anonymat: {
      title: "Anonymat total",
      content: [
        <>
          <AnimatedEmoji emoji="🕵️" delay={0.1} /> <span className="font-bold text-xl text-primary">Protection de votre identité</span>
          <p className="mt-2">Mystik garantit un anonymat complet pour tous les expéditeurs de messages :</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Aucune information d'identification n'est associée à votre message</li>
            <li>Même nous ne savons pas qui a envoyé quel message</li>
            <li>Option d'utiliser des VPN ou le réseau Tor pour une sécurité renforcée</li>
          </ul>
        </>,
        <>
          <AnimatedEmoji emoji="🎭" delay={0.2} /> <span className="font-bold text-xl text-secondary">Masques personnalisés</span>
          <p className="mt-2">Personnalisez votre anonymat selon vos préférences :</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Créez un surnom unique pour chaque message</li>
            <li>Choisissez un masque virtuel qui vous représente</li>
            <li>Décidez quelles informations peuvent être révélées</li>
          </ul>
        </>,
        <>
          <AnimatedEmoji emoji="🔒" delay={0.3} /> <span className="font-bold text-xl text-primary">Contrôle total</span>
          <p className="mt-2">Vous gardez le contrôle sur votre anonymat :</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Définissez des conditions spécifiques pour révéler votre identité</li>
            <li>Possibilité de rester anonyme pour toujours</li>
            <li>Notifications quand quelqu'un découvre votre identité</li>
          </ul>
        </>
      ]
    },
    messages: {
      title: "Messages créatifs",
      content: [
        <>
          <AnimatedEmoji emoji="🎨" delay={0.1} /> <span className="font-bold text-xl text-primary">Personnalisation des messages</span>
          <p className="mt-2">Transformez vos messages anonymes en véritables œuvres d'art :</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Filtres émotionnels qui changent l'apparence et le ton de vos messages</li>
            <li>Ajoutez des emojis représentatifs pour exprimer votre humeur</li>
            <li>Créez un style visuel unique avec des animations et des effets</li>
          </ul>
        </>,
        <>
          <AnimatedEmoji emoji="🎤" delay={0.15} /> <span className="font-bold text-xl text-primary">Messages vocaux</span>
          <p className="mt-2">Exprimez-vous avec votre voix tout en restant anonyme :</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Enregistrez des messages vocaux directement depuis l'application</li>
            <li>Appliquez des filtres vocaux pour masquer votre voix (robot, grave, aigu, alien, anonyme)</li>
            <li>Prévisualisez votre message vocal avec le filtre avant l'envoi</li>
            <li>Conservez votre anonymat même en utilisant votre voix</li>
          </ul>
        </>,
        <>
          <AnimatedEmoji emoji="🧩" delay={0.2} /> <span className="font-bold text-xl text-secondary">Indices et devinettes</span>
          <p className="mt-2">Ajoutez une dimension ludique à vos messages :</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Laissez des indices subtils sur votre identité</li>
            <li>Créez des devinettes personnalisées avec questions et réponses</li>
            <li>Proposez des défis que le destinataire doit relever</li>
          </ul>
        </>,
        <>
          <AnimatedEmoji emoji="🤖" delay={0.25} /> <span className="font-bold text-xl text-secondary">Analyse IA des indices</span>
          <p className="mt-2">Bénéficiez de l'intelligence artificielle pour résoudre les mystères :</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Analyse automatique des indices collectés pour suggérer des pistes</li>
            <li>Détection des motifs et connexions entre différents messages</li>
            <li>Suggestions intelligentes pour deviner l'identité de l'expéditeur</li>
            <li>Aide contextuelle adaptée à votre progression dans le jeu</li>
          </ul>
        </>,
        <>
          <AnimatedEmoji emoji="⏰" delay={0.3} /> <span className="font-bold text-xl text-primary">Messages temporels</span>
          <p className="mt-2">Jouez avec le temps pour créer de l'intrigue :</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Programmez des messages à délivrer dans le futur</li>
            <li>Créez des messages qui s'auto-détruisent après lecture</li>
            <li>Messages du futur que le destinataire découvrira à une date précise</li>
          </ul>
        </>
      ]
    },
    revelations: {
      title: "Système de jeu et révélations",
      content: [
        <>
          <AnimatedEmoji emoji="🎮" delay={0.1} /> <span className="font-bold text-xl text-primary">Un jeu de devinettes captivant</span>
          <p className="mt-2">Mystik transforme la découverte d'identité en expérience ludique :</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Le destinataire peut essayer de deviner votre nom ou votre identité</li>
            <li>Système de vérification qui confirme si la réponse est correcte</li>
            <li>Animation festive avec confettis quand l'identité est découverte</li>
          </ul>
        </>,
        <>
          <AnimatedEmoji emoji="🔑" delay={0.2} /> <span className="font-bold text-xl text-secondary">Système d'indices progressifs</span>
          <p className="mt-2">Un système d'indices complet pour aider la découverte :</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li><strong>Collecte d'indices uniques :</strong> Utilisez des clés pour découvrir des indices sur l'expéditeur</li>
            <li><strong>Variété d'indices :</strong> Première ou dernière lettre du surnom, emoji représentatif, indice textuel, localisation approximative...</li>
            <li><strong>Gestion intelligente :</strong> Les indices déjà découverts ne réapparaissent pas</li>
            <li><strong>Progression visible :</strong> Suivez le nombre d'indices restants à découvrir</li>
          </ul>
        </>,
        <>
          <AnimatedEmoji emoji="🧠" delay={0.3} /> <span className="font-bold text-xl text-primary">Devinettes avec récompenses</span>
          <p className="mt-2">Résolvez des devinettes pour obtenir des avantages :</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li><strong>Système de devinettes :</strong> L'expéditeur peut laisser une question énigmatique</li>
            <li><strong>Récompenses :</strong> Débloquez des indices supplémentaires en résolvant la devinette</li>
            <li><strong>Validation instantanée :</strong> Vérification immédiate de votre réponse</li>
          </ul>
        </>,
        <>
          <AnimatedEmoji emoji="🎁" delay={0.4} /> <span className="font-bold text-xl text-secondary">Système de clés et récompenses</span>
          <p className="mt-2">Plusieurs façons d'obtenir des clés pour révéler des indices :</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Gagnez des clés en visionnant des publicités récompensées</li>
            <li>Invitez vos amis pour recevoir des clés bonus</li>
            <li>Partagez votre profil sur les réseaux sociaux</li>
            <li>Participez à des défis communautaires</li>
          </ul>
        </>,
        <>
          <AnimatedEmoji emoji="📱" delay={0.5} /> <span className="font-bold text-xl text-primary">Interface interactive</span>
          <p className="mt-2">Une expérience utilisateur fluide et engageante :</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Animations visuelles attrayantes lors de la découverte d'indices</li>
            <li>Feedback immédiat à chaque action</li>
            <li>Tableau de progression montrant les indices collectés</li>
            <li>Célébration visuelle lors de la découverte de l'identité</li>
          </ul>
        </>
      ]
    }
  };

  // Animation des titres avec effet de dégradé
  const titleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  // Animation pour l'apparition des cartes
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.3 + i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    }),
    hover: {
      y: -10,
      boxShadow: "0 20px 25px -5px rgba(138, 43, 226, 0.3), 0 10px 10px -5px rgba(138, 43, 226, 0.2)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center h-full max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            {/* Logo animé */}
            <div className="mb-8 relative w-48 h-48 mx-auto mt-7 md:mt-0">
              <AnimatedLogo width={200} height={200} />
            </div>

            <motion.h1 
              className="text-5xl md:text-6xl font-bold mb-4 gradient-text"
              variants={titleVariants}
              initial="hidden"
              animate="visible"
            >
              Mystik
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl text-gray-light mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Dis ce que tu penses. Reste dans l&apos;ombre.
            </motion.p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl"
          >
            {/* Créer un compte */}
            <motion.div 
              className="card p-8 flex flex-col items-center"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              custom={0}
            >
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                <AnimatedIcon icon={FaUserSecret} color="primary" size="lg" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Créer un compte</h2>
              <p className="text-center text-gray-light mb-6">
                Recevez des messages anonymes et partagez votre lien unique.
              </p>
              
              {/* <p className="text-sm text-gray-light mb-4">
                Votre lien de partage aura ce format: <br/>
                <span className="font-mono bg-gray-800 px-2 py-1 rounded">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/votre_nom
                </span>
              </p> */}

              <div className="w-full flex flex-col md:flex-row gap-3">
                <Link href="/register" className="w-full">
                  <AnimatedButton fullWidth>
                    Commencer
                  </AnimatedButton>
                </Link>
                <Link href="/login" className="w-full">
                  <AnimatedButton fullWidth variant="outline">
                    Se connecter
                  </AnimatedButton>
                </Link>
              </div>
            </motion.div>

            {/* Envoyer un message */}
            <motion.div 
              className="card p-8 flex flex-col items-center"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              custom={1}
            >
              <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mb-6">
                <AnimatedIcon icon={FaEnvelope} color="secondary" size="lg" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Envoyer un message</h2>
              <p className="text-center text-gray-light mb-6">
                Envoyez un message anonyme à quelqu&apos;un qui a partagé son lien.
              </p>
              <Link href="/send" className="w-full">
                <AnimatedButton fullWidth>
                  Écrire un message
                </AnimatedButton>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-20 text-center"
          >
            <motion.h2 
              className="text-3xl font-bold mb-6 gradient-text"
              variants={titleVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.7 }}
            >
              Pourquoi choisir Mystik ?
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-10">
              <motion.div 
                className="card p-6"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                custom={2}
              >
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <AnimatedIcon icon={FaLock} color="primary" size="md" />
                </div>
                <h3 className="text-xl font-bold mb-2">Anonymat total</h3>
                <p className="text-gray-light mb-4">
                  Envoyez des messages sans révéler votre identité.
                </p>
                <AnimatedButton 
                  onClick={() => openModal('anonymat')}
                  variant="ghost"
                  size="sm"
                  icon={FaInfoCircle}
                >
                  Voir plus
                </AnimatedButton>
              </motion.div>
              
              <motion.div 
                className="card p-6"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                custom={3}
              >
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <AnimatedIcon icon={FaEnvelope} color="primary" size="md" />
                </div>
                <h3 className="text-xl font-bold mb-2">Messages créatifs</h3>
                <p className="text-gray-light mb-4">
                  Ajoutez des indices, des filtres émotionnels et des devinettes.
                </p>
                <AnimatedButton 
                  onClick={() => openModal('messages')}
                  variant="ghost"
                  size="sm"
                  icon={FaInfoCircle}
                >
                  Voir plus
                </AnimatedButton>
              </motion.div>
              
              <motion.div 
                className="card p-6"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                custom={4}
              >
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <AnimatedIcon icon={FaGamepad} color="primary" size="md" />
                </div>
                <h3 className="text-xl font-bold mb-2">Système de jeu interactif</h3>
                <p className="text-gray-light mb-4">
                  Découvrez l'identité de l'expéditeur avec un jeu d'indices et de devinettes captivant.
                </p>
                <AnimatedButton 
                  onClick={() => openModal('revelations')}
                  variant="ghost"
                  size="sm"
                  icon={FaInfoCircle}
                >
                  Voir plus
                </AnimatedButton>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>
      
      <motion.footer 
        className="py-4 border-t border-gray-800 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-light">
            &copy; {new Date().getFullYear()} Mystik - Tous droits réservés <br/> By <i>Charles YIMBNE</i>
          </p>
        </div>
      </motion.footer>

      {/* Modals */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-card-bg p-6 rounded-2xl max-w-lg w-full my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold gradient-text">
                  {modalContent[activeModal].title}
                </h3>
                <motion.button 
                  onClick={closeModal}
                  className="text-gray-light hover:text-white p-2"
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.3 }}
                >
                  <FaTimes />
                </motion.button>
              </div>
              
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                {modalContent[activeModal].content.map((paragraph, index) => (
                  <motion.div 
                    key={index} 
                    className="bg-gray-900 rounded-lg p-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.3 }}
                  >
                    {paragraph}
                  </motion.div>
                ))}
              </div>
              
              <AnimatedButton
                onClick={closeModal}
                className="mt-6 w-full"
              >
                Fermer
              </AnimatedButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
