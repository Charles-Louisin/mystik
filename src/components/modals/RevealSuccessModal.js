import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaUser, FaSms, FaBell, FaKey, FaCheck, FaTimes as FaTimesIcon, FaLightbulb, FaQuestion, FaUnlock, FaCheckCircle } from 'react-icons/fa';
import confetti from 'canvas-confetti';
import axios from 'axios';
import toast from 'react-hot-toast';

const RevealSuccessModal = ({ 
  isOpen, 
  onClose, 
  senderInfo, 
  messageId, 
  usedKey = false, 
  onSendMessage,
  onNotifySender,
  onSuccessClose
}) => {
  const [showForm, setShowForm] = useState(false);
  const [guessName, setGuessName] = useState('');
  const [guessResult, setGuessResult] = useState(null);
  const [nameRevealed, setNameRevealed] = useState(false);
  const [guessType, setGuessType] = useState('nickname'); // 'nickname' ou 'user'
  const [guessResponseMessage, setGuessResponseMessage] = useState('');
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [userIdentityRevealed, setUserIdentityRevealed] = useState(false);
  
  const [showRiddle, setShowRiddle] = useState(false);
  const [riddleAnswer, setRiddleAnswer] = useState('');
  const [riddleResult, setRiddleResult] = useState(null);
  const [obtainedHints, setObtainedHints] = useState([]);
  const [isCheckingRiddle, setIsCheckingRiddle] = useState(false);
  const [unlockHintLoading, setUnlockHintLoading] = useState(false);
  const [userKeys, setUserKeys] = useState(0);
  const [hintStats, setHintStats] = useState({ total: 0, used: 0, remaining: 0 });
  const [isLoadingHints, setIsLoadingHints] = useState(false);
  
  // Récupérer le nombre de clés de l'utilisateur et les indices déjà découverts
  useEffect(() => {
    if (isOpen && messageId) {
      console.log("Modal ouvert avec messageId:", messageId);
      console.log("Informations du sender:", senderInfo);
      
      // Débogage supplémentaire pour l'identité révélée
      if (senderInfo) {
        console.log("État de révélation:", {
          nameDiscovered: senderInfo.nameDiscovered,
          userDiscovered: senderInfo.userDiscovered,
          realUser: senderInfo.realUser,
          realUserName: senderInfo.realUserName
        });
        
        // Définir l'état nameRevealed si le nom a déjà été découvert
        if (senderInfo.nameDiscovered) {
          setNameRevealed(true);
        }
        
        // Définir l'état userIdentityRevealed UNIQUEMENT si l'utilisateur a déjà été découvert
        // Ne pas le définir si seulement la devinette a été résolue
        if (senderInfo.userDiscovered) {
          setUserIdentityRevealed(true);
          console.log("Identité utilisateur révélée - État défini à true");
        }
      }
      
      // Réinitialiser les états à chaque ouverture du modal
      setGuessName('');
      setRiddleAnswer('');
      setGuessResult(null);
      setRiddleResult(null);
      setGuessType('nickname');
      setGuessResponseMessage('');
      
      // Vérifier si une devinette est disponible et l'afficher
      if (senderInfo && senderInfo.riddle && senderInfo.riddle.question && !senderInfo.riddleSolved) {
        console.log("Devinette disponible:", senderInfo.riddle.question);
        setShowRiddle(true);
        setShowForm(false);
      } else {
        setShowRiddle(false);
        
        // Si le nom est découvert mais pas l'utilisateur réel, et qu'il y a un utilisateur réel à découvrir,
        // afficher directement le formulaire de devinette avec le type 'user'
        if (senderInfo && senderInfo.nameDiscovered && !senderInfo.userDiscovered && senderInfo.realUser) {
          setShowForm(true);
          setGuessType('user');
          setNameRevealed(false);
          console.log("Affichage du formulaire pour deviner l'utilisateur réel");
        } else {
          // Sinon, afficher le formulaire standard
          setShowForm(true);
        }
      }
      
      // Initialiser les indices découverts à partir des données du sender
      if (senderInfo && senderInfo.discoveredHints && Array.isArray(senderInfo.discoveredHints)) {
        console.log("Initialisation des indices à partir des données:", senderInfo.discoveredHints);
        setObtainedHints(senderInfo.discoveredHints);
      } else {
        // Essayer de récupérer les indices depuis le localStorage
        try {
          const savedHints = localStorage.getItem(`hints_${messageId}`);
          if (savedHints) {
            const parsedHints = JSON.parse(savedHints);
            console.log("Indices récupérés depuis le localStorage:", parsedHints);
            setObtainedHints(parsedHints);
          } else {
            // Réinitialiser les indices si pas de données
            setObtainedHints([]);
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des indices depuis le localStorage:", error);
          setObtainedHints([]);
        }
      }
      
      fetchUserKeys();
      fetchDiscoveredHints();
    }
  }, [isOpen, messageId, senderInfo]);
  
  // Effet supplémentaire pour s'assurer que les indices sont chargés à chaque ouverture du modal
  useEffect(() => {
    if (isOpen && messageId) {
      console.log("Modal ouvert - Vérification des indices en localStorage");
      
      // Essayer de récupérer les indices depuis le localStorage
      try {
        const savedHints = localStorage.getItem(`hints_${messageId}`);
        if (savedHints) {
          const parsedHints = JSON.parse(savedHints);
          console.log("Indices récupérés depuis le localStorage (effet supplémentaire):", parsedHints);
          
          // Si les indices du localStorage sont plus nombreux que ceux déjà chargés, les utiliser
          if (parsedHints.length > 0 && (!obtainedHints || parsedHints.length > obtainedHints.length)) {
            console.log("Mise à jour des indices avec ceux du localStorage");
            setObtainedHints(parsedHints);
            setShowForm(true);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des indices depuis le localStorage (effet supplémentaire):", error);
      }
    }
  }, [isOpen, messageId]);
  
  // Récupérer le nombre de clés que l'utilisateur possède
  const fetchUserKeys = async () => {
    try {
      const token = localStorage.getItem("token");
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin);
      
      const { data } = await axios.get(
        `${apiBaseUrl}/api/users/me/keys`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      setUserKeys(data.revealKeys || 0);
    } catch (error) {
      console.error("Erreur lors de la récupération des clés:", error);
    }
  };
  
  // Récupérer les indices déjà découverts pour ce message
  const fetchDiscoveredHints = async () => {
    if (!messageId) {
      console.error("Impossible de récupérer les indices: messageId est undefined");
      return;
    }
    
    try {
      setIsLoadingHints(true);
      const token = localStorage.getItem("token");
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin);
      
      // Récupérer les indices depuis le serveur
      const { data } = await axios.get(
        `${apiBaseUrl}/api/messages/${messageId}/hints`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      console.log("Indices récupérés depuis le serveur:", data.hints);
      
      // Récupérer également les indices stockés localement
      let localHints = [];
      try {
        const savedHints = localStorage.getItem(`hints_${messageId}`);
        if (savedHints) {
          localHints = JSON.parse(savedHints);
          console.log("Indices récupérés depuis le localStorage:", localHints);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des indices depuis le localStorage:", error);
      }
      
      // Fusionner les indices du serveur et du localStorage
      let mergedHints = [];
      
      // Commencer avec les indices du serveur
      if (data.hints && Array.isArray(data.hints)) {
        mergedHints = [...data.hints];
      }
      
      // Ajouter les indices du localStorage qui ne sont pas déjà présents
      if (localHints.length > 0) {
        localHints.forEach(localHint => {
          // Vérifier si cet indice existe déjà dans les indices fusionnés
          const exists = mergedHints.some(
            hint => hint.type === localHint.type && hint.value === localHint.value
          );
          
          if (!exists) {
            mergedHints.push(localHint);
          }
        });
      }
      
      console.log("Indices fusionnés:", mergedHints);
      
      // Mettre à jour l'état avec les indices fusionnés
      if (mergedHints.length > 0) {
        setObtainedHints(mergedHints);
        
        // Si des indices sont disponibles, montrer le formulaire
        setShowForm(true);
        
        // Sauvegarder les indices fusionnés dans le localStorage
        localStorage.setItem(`hints_${messageId}`, JSON.stringify(mergedHints));
      }
      
      // Mettre à jour les statistiques d'indices
      if (data.hintStats) {
        setHintStats(data.hintStats);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des indices:", error);
      
      // En cas d'erreur, essayer de récupérer les indices depuis le localStorage
      try {
        const savedHints = localStorage.getItem(`hints_${messageId}`);
        if (savedHints) {
          const parsedHints = JSON.parse(savedHints);
          console.log("Indices récupérés depuis le localStorage (fallback):", parsedHints);
          setObtainedHints(parsedHints);
          
          // Si des indices sont disponibles, montrer le formulaire
          if (parsedHints.length > 0) {
            setShowForm(true);
          }
        }
      } catch (localError) {
        console.error("Erreur lors de la récupération des indices depuis le localStorage (fallback):", localError);
      }
    } finally {
      setIsLoadingHints(false);
    }
  };
  
  // Lancer le confetti lors de l'ouverture
  useEffect(() => {
    if (isOpen && (nameRevealed || userIdentityRevealed)) {
      launchConfetti();
    }
  }, [isOpen, nameRevealed, userIdentityRevealed]);
  
  // Fonction pour lancer le confetti
  const launchConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const colors = ['#bb86fc', '#03dac6', '#cf6679', '#ffeb3b'];

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    (function frame() {
      confetti({
        particleCount: 2,
        angle: randomInRange(0, 360),
        spread: randomInRange(50, 100),
        origin: { x: randomInRange(0.1, 0.9), y: randomInRange(0.1, 0.9) },
        colors: colors,
        zIndex: 1000,
        disableForReducedMotion: true
      });
      
      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    }());
  };
  
  // Animation des emojis flottants
  const floatingEmojis = ['🎉', '🎊', '🥳', '🎈', '🎆', '🎇', '✨', '👏', '🙌'];
  
  const revealFirstLetter = () => {
    setShowForm(true);
  };
  
  // Afficher la devinette
  const showRiddleForm = () => {
    setShowRiddle(true);
    setShowForm(false);
  };
  
  // Vérifier la réponse à la devinette
  const checkRiddleAnswer = async () => {
    if (!riddleAnswer.trim()) return;
    
    if (!messageId) {
      console.error("Impossible de vérifier la devinette: messageId est undefined");
      toast.error("Erreur d'identification du message");
      return;
    }
    
    setIsCheckingRiddle(true);
    try {
      const token = localStorage.getItem("token");
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin);
      
      const response = await axios.post(
        `${apiBaseUrl}/api/messages/${messageId}/check-riddle`,
        { 
          answer: riddleAnswer 
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      const { data } = response;
      console.log("Réponse de vérification de devinette:", data);
      
      // Si la réponse est correcte
      if (data && data.correct) {
        setRiddleResult(true);
        
        // Ajouter un indice spécial pour avoir réussi la devinette
        if (data.hint) {
          console.log("Nouvel indice reçu après devinette réussie:", data.hint);
          
          // Créer une copie complète pour s'assurer du re-rendu
          const newHints = [...obtainedHints];
          newHints.push({
            type: data.hint.type || 'riddle_success',
            value: data.hint.value,
            description: data.hint.description || 'Indice obtenu grâce à la devinette'
          });
          setObtainedHints(newHints);
          
          // Sauvegarder immédiatement dans le localStorage
          localStorage.setItem(`hints_${messageId}`, JSON.stringify(newHints));
          
          // Notification de succès
          toast.success("Bravo ! Vous avez obtenu un indice supplémentaire !");
        } else {
          const newHints = [...obtainedHints];
          newHints.push({
            type: 'riddle_success',
            value: 'Vous avez réussi la devinette !',
            description: 'Un nouvel indice pourrait être disponible avec une clé'
          });
          setObtainedHints(newHints);
          
          // Sauvegarder immédiatement dans le localStorage
          localStorage.setItem(`hints_${messageId}`, JSON.stringify(newHints));
          
          // Notification de succès
          toast.success("Devinette réussie !");
        }
        
        // Marquer la devinette comme résolue pour que le bouton "Découvrir" et le badge disparaissent
        if (senderInfo) {
          senderInfo.riddleSolved = true;
          // Ne pas définir userIdentityRevealed à true pour permettre de deviner l'utilisateur réel ensuite
          console.log("Devinette résolue - riddleSolved défini à true", senderInfo);
        }
        
        // Fermer la devinette et montrer le formulaire de devinette de nom
        setTimeout(() => {
          setShowRiddle(false);
          setShowForm(true);
          
          // Ne pas rafraîchir les indices depuis le serveur pour éviter que l'indice ne disparaisse
          // fetchDiscoveredHints();
        }, 1000);
        
        // Mettre à jour les statistiques d'indices si nécessaire
        if (data.hintStats) {
          setHintStats(data.hintStats);
        }
      } else {
        setRiddleResult(false);
        toast.error("Mauvaise réponse. Essayez à nouveau !");
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de la devinette:", error);
      setRiddleResult(false);
      toast.error("Erreur lors de la vérification de la devinette");
    } finally {
      setIsCheckingRiddle(false);
    }
  };
  
  // Utiliser une clé pour obtenir un indice
  const unlockHint = async () => {
    if (userKeys <= 0) {
      toast.error("Vous n'avez pas de clés disponibles");
      return;
    }
    
    if (!messageId) {
      console.error("Impossible de récupérer un indice: messageId est undefined");
      toast.error("Erreur d'identification du message");
      return;
    }
    
    // Vérifier que le message a un surnom valide
    if (!senderInfo || !senderInfo.nickname || senderInfo.nickname === "Anonyme") {
      toast.error("Ce message ne contient pas d'indice sur l'expéditeur");
      return;
    }
    
    console.log("Déverrouillage d'un indice pour le message:", messageId);
    setUnlockHintLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Vous devez être connecté pour utiliser cette fonctionnalité");
        setUnlockHintLoading(false);
        return;
      }
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin);
      
      // S'assurer que tous les indices ont un type valide
      const validHints = obtainedHints.filter(hint => hint && hint.type);
      
      // Récupérer les types d'indices déjà utilisés
      const usedHintTypes = validHints.map(hint => hint.type);
      
      console.log("Frontend - Indices déjà utilisés:", usedHintTypes);
      console.log("Frontend - ID du message:", messageId);
      
      // Vérification supplémentaire pour éviter l'erreur avec messageId undefined
      if (!messageId || typeof messageId !== 'string') {
        throw new Error(`ID de message invalide: ${messageId}`);
      }
      
      const url = `${apiBaseUrl}/api/messages/${messageId}/get-hint`;
      console.log("URL de l'appel API:", url);
      
      // Récupérer un nouvel indice aléatoire
      const response = await axios.post(
        url,
        { usedHintTypes },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      console.log("Réponse de l'API get-hint:", response.data);
      
      // Traiter la réponse
      const { data } = response;
      
      if (data && data.hint && data.hint.type && data.hint.value) {
        console.log("Nouvel indice obtenu:", data.hint);
        
        // Ajouter l'indice à la liste locale
        const newHint = {
          type: data.hint.type,
          value: data.hint.value,
          description: data.hint.description || 'Indice'
        };
        
        // Mettre à jour l'état avec une nouvelle référence pour garantir un re-rendu
        const updatedHints = [...obtainedHints, newHint];
        setObtainedHints(updatedHints);
        
        // Sauvegarder immédiatement dans le localStorage
        localStorage.setItem(`hints_${messageId}`, JSON.stringify(updatedHints));
        
        // Mettre à jour le nombre de clés
        setUserKeys(prev => prev - 1);
        
        // Sauvegarder les statistiques sur les indices
        if (data.hintStats) {
          setHintStats(data.hintStats);
        }
        
        // Afficher un toast de confirmation
        toast.success("Nouvel indice découvert !");
        
        // Montrer le formulaire de devinette si ce n'est pas déjà fait
        setShowForm(true);
      } else if (data && data.message === 'no_hints_available') {
        // Pas d'indices disponibles
        setHintStats(prev => ({
          ...prev,
          remaining: 0
        }));
        toast.error("Aucun indice supplémentaire disponible pour ce message");
      } else {
        // Si la réponse est valide mais incomplète
        console.error("Réponse d'API incomplète:", data);
        toast.error("La réponse du serveur est incomplète");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'indice:", error);
      
      if (error.response) {
        console.error("Détails de l'erreur:", error.response.status, error.response.data);
        
        // Messages d'erreur plus spécifiques en fonction du code de statut
        if (error.response.status === 400) {
          if (error.response.data && error.response.data.msg) {
            if (error.response.data.msg.includes("pas d'indices")) {
              toast.error("Ce message ne contient pas d'indices sur l'expéditeur");
            } else if (error.response.data.msg.includes("pas de clés")) {
              toast.error("Vous n'avez pas de clés disponibles");
            } else {
              toast.error(error.response.data.msg);
            }
          } else {
            toast.error("Impossible d'obtenir un indice pour ce message");
          }
        } else {
        toast.error(error.response.data.msg || `Erreur serveur (${error.response.status})`);
        }
      } else if (error.request) {
        console.error("Pas de réponse du serveur:", error.request);
        toast.error("Pas de réponse du serveur");
      } else {
        console.error("Erreur de configuration:", error.message);
        toast.error(`Erreur: ${error.message}`);
      }
    } finally {
      setUnlockHintLoading(false);
    }
  };
  
  const checkGuess = async () => {
    if (!guessName.trim()) {
      toast.error("Veuillez entrer un nom");
      return;
    }
    
    // Si on essaie de deviner l'utilisateur réel, afficher un message que c'est à venir
    if (guessType === 'user') {
      toast("Fonctionnalité à venir");
        return;
      }
      
      setIsCheckingUser(true);
    
    try {
      // Vérifier si la devinette est correcte
      if (guessType === 'nickname' && senderInfo && senderInfo.nickname) {
        const normalizedGuess = guessName.trim().toLowerCase();
        const normalizedActual = senderInfo.nickname.toLowerCase();
        
        if (normalizedGuess === normalizedActual) {
          // Devinette correcte
          setNameRevealed(true);
          setShowForm(false);
          launchConfetti();
          
          // Mettre à jour le statut de découverte
          await updateNameDiscovered();
          
          toast.success("Bravo ! Vous avez deviné correctement !");
        } else if (isPartiallyCorrect(normalizedGuess, normalizedActual)) {
          // Partiellement correct
          toast.info("Vous êtes proche ! Essayez encore.");
        } else {
          // Incorrect
          toast.error("Ce n'est pas le bon surnom. Essayez encore !");
        }
        }
      } catch (error) {
      console.error("Erreur lors de la vérification de la devinette:", error);
      toast.error("Une erreur s'est produite lors de la vérification");
      } finally {
        setIsCheckingUser(false);
    }
  };
  
  // Fonction pour vérifier si une réponse est partiellement correcte (sans révéler le nom complet)
  const isPartiallyCorrect = (guess, actual) => {
    // Si la réponse contient au moins 60% des caractères du vrai nom dans le bon ordre
    let matchingChars = 0;
    let actualIndex = 0;
    
    for (let i = 0; i < guess.length; i++) {
      // Chercher le caractère dans le reste du mot cible
      let found = false;
      for (let j = actualIndex; j < actual.length; j++) {
        if (guess[i] === actual[j]) {
          matchingChars++;
          actualIndex = j + 1;
          found = true;
          break;
        }
      }
      if (!found) break;
    }
    
    return matchingChars / actual.length >= 0.6;
  };
  
  // Fonction pour mettre à jour le message quand le nom est découvert
  const updateNameDiscovered = async () => {
    if (!messageId) {
      console.error("Impossible de mettre à jour le statut de découverte: messageId est undefined");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin);
      
      await axios.patch(
        `${apiBaseUrl}/api/messages/${messageId}/name-discovered`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      console.log("Nom découvert mis à jour avec succès");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut de découverte:", error);
    }
  };
  
  // Fonction pour mettre à jour le message quand l'utilisateur réel est découvert
  const updateUserDiscovered = async () => {
    // Fonctionnalité temporairement désactivée
    toast("Fonctionnalité à venir");
    return;
    
    /*
    if (!messageId) {
      console.error("Impossible de mettre à jour le statut de découverte de l'utilisateur: messageId est undefined");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin);
      
      const response = await axios.patch(
        `${apiBaseUrl}/api/messages/${messageId}/user-discovered`,
        { username: guessName },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      console.log("Utilisateur découvert mis à jour avec succès:", response.data);
      
      // Mettre à jour les informations locales de l'expéditeur
      if (response.data && response.data.sender) {
        if (senderInfo) {
          // Mettre à jour toutes les propriétés importantes
          senderInfo.userDiscovered = true;
          senderInfo.realUserName = response.data.sender.realUserName || guessName;
          senderInfo.uniqueLink = response.data.sender.uniqueLink;
          senderInfo.realUserId = response.data.sender.realUserId || response.data.sender._id;
          senderInfo.riddleSolved = true; // Marquer la devinette comme résolue
          
          // Mettre à jour d'autres propriétés si elles sont présentes dans la réponse
          if (response.data.sender.displayName) {
            senderInfo.displayName = response.data.sender.displayName;
          }
          
          // Appeler la fonction de rafraîchissement pour propager les changements
          if (onSuccessClose) {
            // Délai pour permettre l'animation avant le rafraîchissement
            setTimeout(() => {
              onSuccessClose();
            }, 1000);
          }
        }
        
        // Notification de succès
        toast.success("Identité complète révélée avec succès !");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut de découverte de l'utilisateur:", error);
      toast.error("Erreur lors de la mise à jour de l'identité");
    }
    */
  };
  
  // Fonction pour gérer la fermeture du modal et s'assurer que les changements sont propagés
  const handleClose = () => {
    console.log("Tentative de fermeture du modal");
    
    // Conserver les indices découverts dans le localStorage pour les récupérer à la prochaine ouverture
    if (messageId && obtainedHints.length > 0) {
      try {
        // Stocker les indices avec une clé unique par message
        localStorage.setItem(`hints_${messageId}`, JSON.stringify(obtainedHints));
        console.log("Indices sauvegardés dans le localStorage pour le message:", messageId);
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des indices dans le localStorage:", error);
      }
    }
    
    // Toujours appeler onClose pour fermer le modal
    if (onClose) {
      onClose();
    }
    
    // Si le nom ou l'utilisateur a été découvert ou la devinette a été résolue,
    // on appelle onSuccessClose pour rafraîchir les messages
    // Cette opération est effectuée après la fermeture du modal pour éviter les problèmes d'état
    if ((nameRevealed || userIdentityRevealed || (senderInfo && senderInfo.riddleSolved)) && onSuccessClose) {
      // Appeler la fonction de rafraîchissement des messages sans recharger toute la page
      setTimeout(() => {
        onSuccessClose();
      }, 100);
    }
  };
  
  if (!isOpen) return null;
  
  // Log de débogage pour comprendre l'état du modal
  console.log("RevealSuccessModal - État complet:", {
    isOpen,
    userIdentityRevealed,
    nameRevealed,
    senderInfo: {
      riddleSolved: senderInfo?.riddleSolved,
      userDiscovered: senderInfo?.userDiscovered,
      nameDiscovered: senderInfo?.nameDiscovered,
      realUserName: senderInfo?.realUserName,
      nickname: senderInfo?.nickname
    }
  });
  
  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Fermer le modal quand on clique sur l'arrière-plan
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-900 rounded-lg p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Empêcher la propagation du clic
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
          aria-label="Fermer"
        >
          <FaTimes />
        </button>
        
        {/* Animations d'emojis flottants en arrière-plan */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {(nameRevealed || userIdentityRevealed) && floatingEmojis.map((emoji, index) => (
            <motion.div
              key={index}
              initial={{ 
                opacity: 0,
                x: Math.random() * 400 - 200, 
                y: Math.random() * 400 - 200
              }}
              animate={{ 
                opacity: [0, 1, 0],
                x: Math.random() * 400 - 200,
                y: Math.random() * 400 - 200,
                scale: [0.5, 1.5, 0.5]
              }}
              transition={{ 
                duration: 5,
                repeat: Infinity,
                repeatType: "loop",
                delay: index * 0.5
              }}
              className="absolute text-2xl"
            >
              {emoji}
            </motion.div>
          ))}
        </div>
        
        {/* Affichage conditionnel en fonction de l'état de révélation */}
        {console.log("État actuel:", { userIdentityRevealed, nameRevealed, riddleSolved: senderInfo?.riddleSolved })}
        {userIdentityRevealed ? (
          // Affichage pour la découverte complète de l'identité de l'utilisateur
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="mx-auto w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mb-6"
            >
              <FaUser className="text-3xl text-green-400" />
            </motion.div>
            
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold mb-4"
            >
              Identité complète révélée !
            </motion.h2>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              Vous avez découvert l'identité complète de l'utilisateur qui vous a envoyé ce message.
              C'est bien <span className="font-bold text-green-400">{senderInfo.realUserName || guessName || (senderInfo.realUser ? senderInfo.nickname : "Anonyme")}</span> !
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-gray-800 p-4 rounded-lg mb-6"
            >
              <h3 className="text-sm text-green-400 mb-2">Informations débloquées :</h3>
              
              {senderInfo.emoji && (
                <div className="mb-2">
                  <span className="text-xs text-gray-light">Emoji:</span>
                  <p className="text-2xl">{senderInfo.emoji}</p>
                </div>
              )}
              
              <div className="mb-2">
                <span className="text-xs text-gray-light">Surnom:</span>
                <p className="text-sm">{senderInfo.nickname}</p>
              </div>
              
              <div className="mb-2">
                <span className="text-xs text-gray-light">Nom d'utilisateur:</span>
                <p className="text-sm">{senderInfo.realUserName || guessName || (senderInfo.realUser ? senderInfo.nickname : "Anonyme")}</p>
              </div>
              
              {senderInfo.hint && (
                <div className="mb-2">
                  <span className="text-xs text-gray-light">Indice:</span>
                  <p className="text-sm">{senderInfo.hint}</p>
                </div>
              )}
            </motion.div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="btn-secondary flex items-center justify-center"
                onClick={onSendMessage}
              >
                <FaSms className="mr-2" />
                Répondre
              </motion.button>
              
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="btn-outline flex items-center justify-center"
                onClick={onNotifySender}
              >
                <FaBell className="mr-2" />
                Notifier
              </motion.button>
            </div>
          </motion.div>
        ) : nameRevealed ? (
          // Affichage pour la découverte du surnom uniquement
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="mx-auto w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6"
            >
              <FaUser className="text-3xl text-primary" />
            </motion.div>
            
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold mb-4"
            >
              Surnom découvert !
            </motion.h2>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              Vous avez découvert le surnom de la personne qui vous a envoyé ce message.
              C'est bien <span className="font-bold text-primary">{senderInfo.nickname}</span> !
            </motion.p>
            
            {/* Affichage spécial si l'utilisateur peut encore découvrir l'identité réelle */}
            {senderInfo && senderInfo.realUser && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-4 rounded-lg mb-6 border bg-green-900/30 border-green-500"
              >
                <h3 className="text-sm font-semibold mb-2 flex items-center">
                  <FaCheckCircle className="text-green-400 mr-2" />
                  <span className="text-green-300">Surnom découvert</span>
                </h3>
                
                <div className="mb-3">
                  <p className="text-sm mb-1">
                    Surnom :
                  </p>
                  <p className="text-lg font-medium text-green-300">
                    {senderInfo.nickname || "(Surnom non disponible)"}
                  </p>
                </div>
              </motion.div>
            )}
            
            {/* Affichage des indices débloqués */}
            {(senderInfo.hint || senderInfo.emoji || senderInfo.riddle) && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="bg-gray-800 p-4 rounded-lg mb-6"
              >
                <h3 className="text-sm text-primary mb-2">Informations débloquées :</h3>
                
                {senderInfo.emoji && (
                  <div className="mb-2">
                    <span className="text-xs text-gray-light">Emoji:</span>
                    <p className="text-2xl">{senderInfo.emoji}</p>
                  </div>
                )}
                
                {senderInfo.hint && (
                  <div className="mb-2">
                    <span className="text-xs text-gray-light">Indice:</span>
                    <p className="text-sm">{senderInfo.hint}</p>
                  </div>
                )}
                
                {senderInfo.riddle && (
                  <div>
                    <span className="text-xs text-gray-light">Devinette:</span>
                    <p className="text-sm">{senderInfo.riddle.question}</p>
                    <p className="text-sm text-primary">Réponse: {senderInfo.riddle.answer}</p>
                  </div>
                )}
              </motion.div>
            )}
            
            <div className="mt-6">
              {/* Bouton pour deviner l'utilisateur réel - fonctionnalité temporairement désactivée */}
              {senderInfo && senderInfo.realUser && !senderInfo.userDiscovered && (
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => {
                    // Afficher un message indiquant que la fonctionnalité est à venir
                    toast("Fonctionnalité à venir");
                    // Commenté pour désactiver temporairement la fonctionnalité
                    // setShowForm(true);
                    // setGuessType('user');
                    // setNameRevealed(false);
                  }}
                  className="btn-primary w-full mb-3"
                >
                  <FaUser className="mr-2" />
                  Deviner l'utilisateur réel
                </motion.button>
              )}
              
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={handleClose}
                className="btn-outline w-full"
              >
                Fermer
              </motion.button>
            </div>
          </motion.div>
        ) : showRiddle ? (
          // Section pour jouer à la devinette
          <>
            <h3 className="text-xl font-bold text-center mb-6">
              Répondez à la devinette
            </h3>
            
            <div className="bg-gray-800/50 p-4 rounded-lg mb-6">
              <div className="flex items-center mb-3">
                <FaQuestion className="text-primary mr-2" />
                <h4 className="text-primary font-medium">Devinette</h4>
              </div>
              <p className="text-white mb-6">{senderInfo?.riddle?.question || "Devinette non disponible"}</p>
              
              {riddleResult === false && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 mb-4 text-center p-3 bg-red-500/10 rounded-lg"
                >
                  <p>Mauvaise réponse ! Essayez à nouveau.</p>
                </motion.div>
              )}
              
              {riddleResult === true && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-green-500 mb-4 text-center p-3 bg-green-500/10 rounded-lg"
                >
                  <p>Bravo ! Vous avez trouvé la bonne réponse !</p>
                </motion.div>
              )}
              
              <div className="mb-4">
                <label className="block text-gray-light mb-2">
                  Votre réponse :
                </label>
                <input
                  type="text"
                  value={riddleAnswer}
                  onChange={(e) => setRiddleAnswer(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                  placeholder="Entrez votre réponse..."
                  disabled={riddleResult === true}
                />
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={checkRiddleAnswer}
                  disabled={!riddleAnswer.trim() || isCheckingRiddle || riddleResult === true}
                  className="btn-primary flex-1 flex items-center justify-center"
                >
                  {isCheckingRiddle ? (
                    <>
                      <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                      Vérification...
                    </>
                  ) : (
                    <>Valider</>
                  )}
                </button>
                
                <button 
                  onClick={() => {
                    setShowRiddle(false);
                    setShowForm(true);
                  }}
                  className="btn-outline flex-1"
                >
                  Retour
                </button>
              </div>
            </div>
          </>
        ) : showForm ? (
          <>
            <h3 className="text-xl font-bold text-center mb-6">Devinez qui c'est</h3>
            
            {/* Section d'indices obtenus */}
            {isLoadingHints ? (
              <div className="bg-gray-800/60 p-4 rounded-lg mb-6 flex items-center justify-center">
                <div className="animate-spin h-5 w-5 mr-2 border-2 border-primary border-t-transparent rounded-full"></div>
                <p>Chargement des indices...</p>
              </div>
            ) : obtainedHints.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/60 p-4 rounded-lg mb-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <FaLightbulb className="text-yellow-400 mr-2" />
                    <h4 className="text-sm font-medium text-yellow-400">Indices découverts ({obtainedHints.length})</h4>
                  </div>
                  {hintStats.total > 0 && (
                    <div className="text-xs text-gray-light">
                      <span>{hintStats.remaining} indice{hintStats.remaining !== 1 ? 's' : ''} restant{hintStats.remaining !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
                
                {/* Indices organisés par catégories avec déduplication */}
                <div className="space-y-4 mt-4">
                  {/* Indices liés aux lettres */}
                  {obtainedHints.some(hint => hint.type && hint.type.startsWith('letter_')) && (
                    <div className="bg-gray-750 p-3 rounded-lg border-l-4 border-yellow-400">
                      <h5 className="text-xs uppercase text-yellow-400 mb-2 font-semibold">Lettres du surnom</h5>
                      <div className="flex flex-wrap gap-2">
                        {obtainedHints
                          .filter(hint => hint.type && hint.type.startsWith('letter_'))
                          .sort((a, b) => {
                            // Tri spécial pour gérer letter_first et letter_last
                            if (a.type === 'letter_first') return -1;
                            if (b.type === 'letter_first') return 1;
                            if (a.type === 'letter_last') return 1;
                            if (b.type === 'letter_last') return -1;
                            
                            // Pour les autres indices letter_X, trier par position
                            const numA = parseInt(a.type.split('_')[1]);
                            const numB = parseInt(b.type.split('_')[1]);
                            return numA - numB;
                          })
                          .map((hint, index) => (
                            <div key={index} className="bg-gray-700 px-3 py-2 rounded-lg shadow-md transform hover:scale-105 transition-transform">
                              <p className="text-xs text-gray-light mb-1">
                                {hint.type === 'letter_first' ? 'Première lettre' : 
                                 hint.type === 'letter_last' ? 'Dernière lettre' : 
                                 `Position ${parseInt(hint.type.split('_')[1]) + 1}`}
                              </p>
                              <p className="text-xl font-bold text-center text-primary">{hint.value || "?"}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Indices de longueur */}
                  {obtainedHints.some(hint => hint.type && (hint.type.includes('length') || hint.type.startsWith('word_'))) && (
                    <div className="bg-gray-750 p-3 rounded-lg border-l-4 border-blue-400">
                      <h5 className="text-xs uppercase text-blue-400 mb-2 font-semibold">Longueur</h5>
                      <div className="flex flex-wrap gap-2">
                        {obtainedHints
                          .filter(hint => hint.type && (hint.type.includes('length') || hint.type.startsWith('word_')))
                          .map((hint, index) => (
                            <div key={index} className="bg-gray-700 px-3 py-2 rounded-lg shadow-md">
                              <p className="text-sm text-white">{hint.value}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Indices spéciaux (emoji, indice laissé par l'expéditeur, etc.) */}
                  {obtainedHints.some(hint => hint.type && ['emoji', 'hint', 'riddle_success', 'sender_hint'].includes(hint.type)) && (
                    <div className="bg-gray-750 p-3 rounded-lg border-l-4 border-purple-400">
                      <h5 className="text-xs uppercase text-purple-400 mb-2 font-semibold">Indices spéciaux</h5>
                      <div className="space-y-2">
                        {/* Utilisation d'un Set pour éviter les doublons basés sur la valeur de l'indice */}
                        {Array.from(new Set(obtainedHints
                          .filter(hint => hint.type && ['emoji', 'hint', 'riddle_success', 'sender_hint'].includes(hint.type))
                          .map(hint => JSON.stringify({value: hint.value, description: hint.description}))))
                          .map((uniqueHintStr, index) => {
                            const uniqueHint = JSON.parse(uniqueHintStr);
                            return (
                              <div key={index} className="bg-gray-700 px-3 py-2 rounded-lg shadow-md transform hover:scale-102 transition-transform">
                                <p className="text-xs text-gray-light mb-1">{uniqueHint.description}</p>
                                <p className="text-sm text-white font-medium">{uniqueHint.value}</p>
                            </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                  
                  {/* Autres indices qui ne rentrent pas dans les catégories ci-dessus */}
                  {obtainedHints.some(hint => 
                    hint.type && 
                    !hint.type.startsWith('letter_') && 
                    hint.type !== 'letter_first' &&
                    hint.type !== 'letter_last' &&
                    !hint.type.includes('length') && 
                    !hint.type.startsWith('word_') && 
                    !['emoji', 'hint', 'riddle_success', 'sender_hint'].includes(hint.type)
                  ) && (
                    <div className="bg-gray-750 p-3 rounded-lg border-l-4 border-orange-400">
                      <h5 className="text-xs uppercase text-orange-400 mb-2 font-semibold">Autres indices</h5>
                      <div className="space-y-2">
                        {/* Utilisation d'un Set pour éviter les doublons basés sur la valeur de l'indice */}
                        {Array.from(new Set(obtainedHints
                          .filter(hint => 
                            hint.type && 
                            !hint.type.startsWith('letter_') && 
                            hint.type !== 'letter_first' &&
                            hint.type !== 'letter_last' &&
                            !hint.type.includes('length') && 
                            !hint.type.startsWith('word_') && 
                            !['emoji', 'hint', 'riddle_success', 'sender_hint'].includes(hint.type)
                          )
                          .map(hint => JSON.stringify({value: hint.value, description: hint.description}))))
                          .map((uniqueHintStr, index) => {
                            const uniqueHint = JSON.parse(uniqueHintStr);
                            return (
                              <div key={index} className="bg-gray-700 px-3 py-2 rounded-lg shadow-md transform hover:scale-102 transition-transform">
                                <p className="text-xs text-gray-light mb-1">{uniqueHint.description}</p>
                                <p className="text-sm text-white font-medium">{uniqueHint.value}</p>
                            </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-gray-800/60 p-4 rounded-lg mb-6 text-center">
                <FaLightbulb className="text-yellow-400 mx-auto mb-2" />
                <p className="text-sm text-gray-light mb-2">
                  Aucun indice découvert pour le moment
                </p>
                <p className="text-xs text-gray-light">
                  Utilisez une clé pour obtenir votre premier indice
                </p>
              </div>
            )}
            
            {/* Ajout d'un bouton pour accéder à la devinette si disponible */}
            {senderInfo && senderInfo.riddle && senderInfo.riddle.question && !showRiddle && (
              <div className="mb-4 p-3 bg-purple-900/30 rounded-lg border border-purple-500">
                <h3 className="text-sm font-semibold text-purple-300 mb-2 flex items-center">
                  <FaQuestion className="text-yellow-400 mr-2" />
                  Devinette disponible !
                </h3>
                <p className="text-sm mb-3">
                  L'expéditeur a laissé une devinette qui pourrait vous aider à découvrir son identité.
                </p>
                <button 
                  onClick={showRiddleForm}
                  className="btn-secondary-outline w-full"
                >
                  Répondre à la devinette
                </button>
              </div>
            )}
            
            <div className="mb-4">
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setGuessType('nickname')}
                  className={`flex-1 py-2 px-4 rounded-lg text-center ${
                    guessType === 'nickname' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-800 text-gray-300'
                  }`}
                >
                  Surnom
                </button>
                <button
                  onClick={() => toast("Fonctionnalité à venir")}
                  className={`flex-1 py-2 px-4 rounded-lg text-center bg-gray-800 text-gray-300 opacity-70`}
                >
                  Utilisateur
                </button>
              </div>
              
              {guessType === 'nickname' && obtainedHints.length > 0 && (
                <div className="mb-8 text-center">
                  <p className="text-gray-light mb-2">
                    Utilisez les indices ci-dessus pour deviner le surnom
                  </p>
                </div>
              )}
              
              {guessType === 'nickname' && obtainedHints.length === 0 && (
                <div className="mb-8 text-center">
                  <p className="text-gray-light mb-2">
                    Utilisez une clé pour obtenir un indice, ou tentez de deviner directement
                  </p>
                </div>
              )}
              
              {guessType === 'user' && (
                <div className="mb-8 text-center">
                  <p className="text-gray-light mb-2">
                    Devinez quel utilisateur inscrit vous a envoyé ce message
                  </p>
                  <p className="text-sm text-primary">
                    Saisissez un nom d'utilisateur pour vérifier
                  </p>
                </div>
              )}
              
              {guessResult === false && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 mb-4 text-center p-3 bg-red-500/10 rounded-lg"
                >
                  {guessType === 'user' && guessResponseMessage ? (
                    <p>{guessResponseMessage}</p>
                  ) : (
                    <p>Ce n'est pas le bon nom. Essayez à nouveau.</p>
                  )}
                </motion.div>
              )}
              
              <div className="mb-4">
                <label className="block text-gray-light mb-2">
                  {guessType === 'nickname' 
                    ? "Quel est le surnom de l'expéditeur ?" 
                    : "Quel utilisateur a envoyé ce message ?"}
                </label>
                <input
                  type="text"
                  value={guessName}
                  onChange={(e) => setGuessName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                  placeholder={guessType === 'nickname' 
                    ? "Entrez le surnom..." 
                    : "Entrez le nom d'utilisateur..."}
                />
              </div>
              
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={checkGuess}
                  disabled={!guessName.trim() || isCheckingUser}
                  className="btn-primary flex items-center justify-center"
                >
                  {isCheckingUser ? (
                    <>
                      <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                      Vérification...
                    </>
                  ) : (
                    <>Valider</>
                  )}
                </button>
                
                <button 
                  onClick={unlockHint}
                  disabled={unlockHintLoading || userKeys <= 0}
                  className="btn-secondary-outline flex items-center justify-center"
                >
                  {unlockHintLoading ? (
                    <>
                      <span className="animate-spin h-4 w-4 mr-2 border-2 border-primary border-t-transparent rounded-full"></span>
                      Chargement...
                    </>
                  ) : userKeys <= 0 ? (
                    <>
                      <FaKey className="mr-2" />
                      Aucune clé disponible
                    </>
                  ) : (
                    <>
                      <FaUnlock className="mr-2" />
                      Utiliser une clé pour un indice ({userKeys} disponible{userKeys > 1 ? 's' : ''})
                    </>
                  )}
                </button>
                
                {/* Bouton pour retourner à l'écran principal */}
                <button 
                  onClick={() => {
                    setShowForm(false);
                    setGuessName('');
                    setGuessResult(null);
                  }}
                  className="btn-outline"
                >
                  Retour
                </button>
              </div>
            </div>
          </>
        ) : (
          // Écran d'accueil par défaut
          <div className="text-center py-4">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="mx-auto w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6"
            >
              <FaQuestion className="text-3xl text-primary" />
            </motion.div>
            
            <h2 className="text-xl font-bold mb-6">Devinez qui c'est</h2>
            
            <p className="text-gray-light mb-8">
              Essayez de découvrir l'identité de la personne qui vous a envoyé ce message.
            </p>
            
            <div className="space-y-4">
              {senderInfo && senderInfo.riddle && senderInfo.riddle.question && (
                <button
                  onClick={showRiddleForm}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  <FaQuestion className="mr-2" />
                  Répondre à la devinette
                </button>
              )}
              
              <button
                onClick={() => setShowForm(true)}
                className="btn-secondary w-full flex items-center justify-center"
              >
                <FaUser className="mr-2" />
                Deviner directement
              </button>
              
              <button
                onClick={unlockHint}
                disabled={unlockHintLoading || userKeys <= 0}
                className="btn-outline w-full flex items-center justify-center"
              >
                {unlockHintLoading ? (
                  <>
                    <span className="animate-spin h-4 w-4 mr-2 border-2 border-primary border-t-transparent rounded-full"></span>
                    Chargement...
                  </>
                ) : userKeys <= 0 ? (
                  <>
                    <FaKey className="mr-2" />
                    Aucune clé disponible
                  </>
                ) : (
                  <>
                    <FaUnlock className="mr-2" />
                    Utiliser une clé ({userKeys} disponible{userKeys > 1 ? 's' : ''})
                  </>
                )}
              </button>
              
              {/* Ajouter un bouton pour fermer le modal */}
              <button
                onClick={handleClose}
                className="btn-outline w-full mt-4 flex items-center justify-center"
              >
                <FaTimes className="mr-2" />
                Fermer
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default RevealSuccessModal; 