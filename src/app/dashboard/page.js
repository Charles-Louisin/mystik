"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FaShareAlt, FaCopy, FaBell, FaUserCircle, FaKey, FaSignOutAlt, FaQuestion, FaUser, FaCheckCircle, FaPlus, FaLink, FaStar, FaTrash, FaEdit, FaReply, FaLightbulb, FaVolumeUp, FaPause, FaPlay } from "react-icons/fa";
import toast from "react-hot-toast";
import axios from "axios";

import RevealSuccessModal from "@/components/modals/RevealSuccessModal";
import ShareMessageModal from "@/components/modals/ShareMessageModal";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("messages");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [revealMethod, setRevealMethod] = useState("key");
  const [riddleAnswer, setRiddleAnswer] = useState("");
  const [emotionalRadar, setEmotionalRadar] = useState(null);
  const [scheduledMessages, setScheduledMessages] = useState(0);
  const [activeSettingsTab, setActiveSettingsTab] = useState("profile");
  const [showMasksModal, setShowMasksModal] = useState(false);
  const [customMasks, setCustomMasks] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [revealedSenderInfo, setRevealedSenderInfo] = useState(null);
  const [usedKey, setUsedKey] = useState(false);
  const [partialInfoRevealed, setPartialInfoRevealed] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioPlayerRef = useRef(null);
  
  useEffect(() => {
    // Définir l'origine lorsque le composant est monté côté client
    setOrigin(window.location.origin);

    const token = localStorage.getItem("token");
    
    if (!token) {
      router.push("/login");
      return;
    }
    
    const fetchUserData = async () => {
      try {
        // Utiliser l'origine de la fenêtre au lieu d'une URL codée en dur
        const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
          ? 'http://localhost:5000' 
          : window.location.origin;
        
        const { data: userData } = await axios.get(`${apiBaseUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUser(userData.user);
        
        // Récupérer les messages
        const { data: messagesData } = await axios.get(`${apiBaseUrl}/api/messages/received`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Ajouter la logique pour traiter les messages audio
        const updatedMessages = messagesData.map(message => {
          if (message.hasVoiceMessage) {
            return {
              ...message,
              audioUrl: `${apiBaseUrl}/api/messages/${message._id}/voice-message`,
              isPlaying: false
            };
          }
          return message;
        });
        
        setMessages(updatedMessages);
        
        // Charger le radar émotionnel
        loadEmotionalRadar();
        
        // Charger les messages programmés
        loadScheduledMessages();
        
        // Charger les masques personnalisés
        loadCustomMasks();
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
        localStorage.removeItem("token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [router]);
  
  const handleCopyLink = () => {
    if (!user) return;
    
    const link = `${origin}/@${user.uniqueLink.replace('@', '')}`;
    navigator.clipboard.writeText(link);
    toast.success("Lien copié dans le presse-papier!");
  };
  
  const handleShare = async () => {
    if (!user) return;
    
    const shareData = {
      title: "Mystik - Envoyez-moi un message anonyme",
      text: "Dis-moi ce que tu penses, reste dans l'ombre avec Mystik!",
      url: `${origin}/@${user.uniqueLink.replace('@', '')}`
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        handleCopyLink();
      }
    } catch (error) {
      console.error("Erreur lors du partage:", error);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
    toast.success("Déconnexion réussie");
  };
  
  const markAsRead = async (messageId) => {
    try {
      const token = localStorage.getItem("token");
      
      // Utiliser l'origine de la fenêtre au lieu d'une URL codée en dur
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin;
      
      await axios.patch(`${apiBaseUrl}/api/messages/${messageId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Mettre à jour l'état local
      setMessages(messages.map(msg => 
        msg._id === messageId ? { ...msg, read: true } : msg
      ));
    } catch (error) {
      console.error("Erreur lors du marquage du message:", error);
    }
  };
  
  const getDateFormatted = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  
  const copyToClipboard = () => {
    if (user) {
      const shareLink = `${origin}/@${user.uniqueLink.replace('@', '')}`;
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Lien copié !");
      
      setTimeout(() => setCopied(false), 3000);
    }
  };
  
  // Fonction pour charger le radar émotionnel
  const loadEmotionalRadar = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin;
      
      const { data } = await axios.get(`${apiBaseUrl}/api/messages/emotional-radar`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEmotionalRadar(data);
    } catch (error) {
      console.error("Erreur lors du chargement du radar émotionnel:", error);
    }
  };
  
  // Fonction pour charger les messages programmés
  const loadScheduledMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin;
      
      const { data } = await axios.get(`${apiBaseUrl}/api/messages/scheduled`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setScheduledMessages(data.count);
    } catch (error) {
      console.error("Erreur lors du chargement des messages programmés:", error);
    }
  };
  
  // Fonction pour charger les masques personnalisés
  const loadCustomMasks = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin;
      
      const { data } = await axios.get(`${apiBaseUrl}/api/users/masks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCustomMasks(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des masques:", error);
    }
  };
  
  // Fonction pour gagner une clé de révélation
  const earnKey = async (method) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin;
      
      const { data } = await axios.post(
        `${apiBaseUrl}/api/messages/earn-key`, 
        { method }, // Uniquement la méthode
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (data.success) {
        toast.success(data.message);
        
        // Mettre à jour l'utilisateur avec le nouveau nombre de clés
        setUser(prevUser => ({
          ...prevUser,
          revealKeys: data.newKeyCount
        }));
        
        // Rafraîchir les données utilisateur
        refreshUserData();
      }
    } catch (error) {
      console.error("Erreur lors de la récupération d'une clé:", error);
      toast.error("Impossible d'obtenir une clé pour le moment");
    }
  };
  
  // Fonction pour rafraîchir les données utilisateur
  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin;
      
      const { data } = await axios.get(`${apiBaseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUser(data.user);
      console.log("Données utilisateur rafraîchies:", data.user);
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des données utilisateur:", error);
    }
  };
  
  // Fonction pour ouvrir le modal de révélation d'identité
  const openRevealModal = (message) => {
    setSelectedMessage(message);
    setShowRevealModal(false); // Fermer le modal de révélation standard
    
    // Récupérer les indices déjà découverts
    const fetchHints = async () => {
      try {
        const token = localStorage.getItem("token");
        const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
          ? 'http://localhost:5000' 
          : window.location.origin;
        
        const hintsResponse = await axios.get(
          `${apiBaseUrl}/api/messages/${message._id}/hints`,
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        // Enrichir les données du sender avec les indices découverts
        const senderWithHints = {
          ...message.sender,
          discoveredHints: hintsResponse.data.hints || [],
          hint: message.clues?.hint || null,
          emoji: message.clues?.emoji || null,
          riddle: message.clues?.riddle || null
        };
        
        // Ouvrir directement le modal de succès pour afficher les indices
        setRevealedSenderInfo(senderWithHints);
        setShowSuccessModal(true);
      } catch (error) {
        console.error("Erreur lors de la récupération des indices:", error);
        // En cas d'erreur, on affiche quand même le modal standard
        setShowRevealModal(true);
      }
    };
    
    fetchHints();
  };
  
  // Fonction pour fermer le modal de révélation
  const closeRevealModal = () => {
    setShowRevealModal(false);
    setSelectedMessage(null);
    setRiddleAnswer("");
  };
  
  // Fonction pour révéler l'identité d'un expéditeur
  const revealSender = async () => {
    if (!selectedMessage) return;
    
    try {
      const token = localStorage.getItem("token");
      
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin;
      
      let requestData = { method: revealMethod };
      
      if (revealMethod === 'riddle') {
        requestData.answer = riddleAnswer;
      }
      
      console.log("Révélation de l'identité avec les données:", requestData);
      
      const { data } = await axios.post(
        `${apiBaseUrl}/api/messages/${selectedMessage._id}/reveal`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      console.log("Réponse de l'API reveal:", data);
      
      // Mise à jour du message dans l'état
      const updatedMessages = messages.map(msg => 
        msg._id === selectedMessage._id 
          ? { 
              ...msg, 
              sender: { 
                ...msg.sender, 
                identityRevealed: true,
                nickname: data.sender.nickname, // Le vrai nickname pour la vérification
                displayNickname: data.sender.displayNickname || null, // Pour l'affichage
                nameDiscovered: data.sender.nameDiscovered || false,
                userDiscovered: data.sender.userDiscovered || false,
                realUserName: data.sender.realUserName || null,
                realUser: data.sender.realUser || false,
                ...data.sender
              }
            } 
          : msg
      );
      
      setMessages(updatedMessages);
      
      // Mise à jour du message sélectionné
      const updatedSelectedMessage = {
        ...selectedMessage,
        sender: {
          ...selectedMessage.sender,
          identityRevealed: true,
          nickname: data.sender.nickname,
          displayNickname: data.sender.displayNickname || null,
          nameDiscovered: data.sender.nameDiscovered || false,
          userDiscovered: data.sender.userDiscovered || false,
          realUserName: data.sender.realUserName || null,
          realUser: data.sender.realUser || false,
          ...data.sender
        }
      };
      
      setSelectedMessage(updatedSelectedMessage);
      
      // Mise à jour du nombre de clés si une clé a été utilisée
      if (revealMethod === 'key') {
        setUser(prevUser => ({
          ...prevUser,
          revealKeys: (prevUser.revealKeys || 0) - 1
        }));
        setUsedKey(true);
        
        // Rafraîchir les données utilisateur
        refreshUserData();
      } else {
        setUsedKey(false);
      }
      
      // Fermer le modal de révélation
      setShowRevealModal(false);
      
      // Afficher le modal de succès
      setRevealedSenderInfo(data.sender);
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error("Erreur lors de la révélation de l'identité:", error);
      toast.error("Erreur lors de la révélation de l'identité");
    }
  };
  
  // Fonction pour révéler des informations partielles
  const revealPartialInfo = async (type) => {
    if (!selectedMessage) return;
    
    try {
      const token = localStorage.getItem("token");
      
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin;
      
      const { data } = await axios.post(
        `${apiBaseUrl}/api/messages/${selectedMessage._id}/reveal-partial`,
        { type },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Mise à jour du nombre de clés
      setUser(prevUser => ({
        ...prevUser,
        revealKeys: (prevUser.revealKeys || 0) - 1
      }));

      // Rafraîchir les données utilisateur
      refreshUserData();

      // Au lieu d'afficher un toast, on prépare l'affichage du modal de succès
      setPartialInfoRevealed(data.partialInfo);
      
      // Préparer les données pour le modal de succès
      setRevealedSenderInfo({
        nickname: selectedMessage.sender.nickname,
        partialInfo: data.partialInfo
      });
      
      setUsedKey(true);
      closeRevealModal();
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Erreur lors de la révélation partielle:", error);
      toast.error(
        error.response?.data?.msg || 
        "Impossible de révéler cette information pour le moment"
      );
    }
  };
  
  // Fonction pour analyser un message avec l'IA
  const analyzeMessage = async (messageId) => {
    try {
      const token = localStorage.getItem("token");
      
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin;
      
      const { data } = await axios.post(
        `${apiBaseUrl}/api/messages/${messageId}/analyze`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Mise à jour du message dans l'état
      const updatedMessages = messages.map(msg => 
        msg._id === messageId 
          ? { ...msg, aiAnalysis: data.aiAnalysis } 
          : msg
      );
      
      setMessages(updatedMessages);
      
      toast.success("Message analysé avec succès!");
    } catch (error) {
      console.error("Erreur lors de l'analyse:", error);
      toast.error("Impossible d'analyser ce message pour le moment");
    }
  };
  
  // Fonction pour envoyer un message à l'expéditeur qui a été révélé
  const sendMessageToSender = () => {
    if (!revealedSenderInfo || !selectedMessage) {
      toast.error("Impossible d'envoyer un message à cet utilisateur");
      return;
    }
    
    // Essayer d'identifier l'utilisateur par différents moyens
    let recipientIdentifier = null;
    
    // Priorité 1: Utiliser le lien unique s'il existe
    if (revealedSenderInfo.uniqueLink) {
      recipientIdentifier = revealedSenderInfo.uniqueLink.replace('@', '');
    } 
    // Priorité 2: Utiliser l'ID de l'utilisateur réel s'il existe
    else if (revealedSenderInfo.realUserId) {
      recipientIdentifier = revealedSenderInfo.realUserId;
    }
    // Priorité 3: Utiliser le nom d'utilisateur réel
    else if (revealedSenderInfo.realUserName) {
      recipientIdentifier = revealedSenderInfo.realUserName;
    }
    // Priorité 4: Utiliser le nickname comme dernier recours
    else if (revealedSenderInfo.nickname && revealedSenderInfo.realUser) {
      recipientIdentifier = revealedSenderInfo.nickname;
    }
    
    if (!recipientIdentifier) {
      console.error("Données insuffisantes pour identifier l'utilisateur:", revealedSenderInfo);
      toast.error("Impossible d'identifier l'utilisateur pour envoyer un message");
      return;
    }
    
    // Rediriger vers la page d'envoi de message avec le destinataire pré-rempli
    router.push(`/send?to=${recipientIdentifier}`);
    setShowSuccessModal(false);
  };
  
  // Fonction pour notifier l'expéditeur qu'il a été dévoilé
  const notifySender = async () => {
    if (!revealedSenderInfo || !selectedMessage) {
      toast.error("Impossible de notifier cet utilisateur");
      return;
    }
    
    // Vérifier que l'utilisateur réel existe
    if (!selectedMessage.sender.realUser && !selectedMessage.sender.realUserName) {
      toast.error("Impossible de notifier cet utilisateur anonyme");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin;
      
      await axios.post(
        `${apiBaseUrl}/api/messages/${selectedMessage._id}/notify-sender`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      toast.success("L'expéditeur a été notifié que vous avez découvert son identité");
      setShowSuccessModal(false);
    } catch (error) {
      console.error("Erreur lors de la notification:", error);
      toast.error("Impossible de notifier l'expéditeur pour le moment");
    }
  };
  
  // Fonction pour rafraîchir les messages
  const refreshMessages = async () => {
    console.log("Rafraîchissement des messages...");
    try {
      const token = localStorage.getItem("token");
      
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin;
      
      // Récupérer les messages mis à jour directement depuis le serveur
      const { data: messagesData } = await axios.get(`${apiBaseUrl}/api/messages/received`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Messages récupérés depuis le serveur:", messagesData);
      
      // Vérifier si les messages contiennent des identités révélées
      messagesData.forEach(message => {
        if (message.sender && message.sender.userDiscovered) {
          console.log(`Message ${message._id} a une identité découverte: ${message.sender.realUserName}`);
        }
      });
      
      // Mettre à jour l'état des messages avec les données fraîches du serveur
      const updatedMessages = messagesData.map(message => {
        if (message.hasVoiceMessage) {
          return {
            ...message,
            audioUrl: `${apiBaseUrl}/api/messages/${message._id}/voice-message`,
            isPlaying: false
          };
        }
        return message;
      });
      
      setMessages(updatedMessages);
      
      // Si un message était sélectionné, mettre à jour son état également
      if (selectedMessage) {
        const updatedSelectedMessage = updatedMessages.find(m => m._id === selectedMessage._id);
        if (updatedSelectedMessage) {
          console.log("Mise à jour du message sélectionné:", updatedSelectedMessage);
          setSelectedMessage(updatedSelectedMessage);
        }
      }
      
      console.log("Messages mis à jour avec succès");
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des messages:", error);
      toast.error("Erreur lors de la mise à jour des messages");
    }
  };
  
  // Fonction pour gérer la fermeture du modal de succès de révélation
  const handleSuccessModalClose = async () => {
    // Fermer le modal
    setShowSuccessModal(false);
    
    // Réinitialiser les états
    setRevealedSenderInfo(null);
    setUsedKey(false);
    
    // Forcer un rafraîchissement complet des messages depuis le serveur
    try {
      const token = localStorage.getItem("token");
      
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin;
      
      console.log("Rafraîchissement forcé des messages après révélation...");
      
      // Récupérer les messages directement depuis le serveur
      const { data: messagesData } = await axios.get(`${apiBaseUrl}/api/messages/received`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Mettre à jour l'état des messages avec les données fraîches
      const updatedMessages = messagesData.map(message => {
        if (message.hasVoiceMessage) {
          return {
            ...message,
            audioUrl: `${apiBaseUrl}/api/messages/${message._id}/voice-message`,
            isPlaying: false
          };
        }
        return message;
      });
      
      setMessages(updatedMessages);
      
      console.log("Messages rafraîchis avec succès après révélation");
      
      // Afficher une notification de succès
      toast.success("Messages mis à jour");
      
      // Forcer un rechargement complet de la page pour s'assurer que tout est à jour
      window.location.reload();
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des messages:", error);
      toast.error("Erreur lors de la mise à jour des messages");
    }
  };
  
  // Fonction pour formater le temps en format mm:ss avec précision milliseconde
  const formatTime = (seconds) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "00:00";
    
    // Arrondir à 2 décimales pour éviter les fluctuations
    const roundedSeconds = Math.round(seconds * 100) / 100;
    
    const minutes = Math.floor(roundedSeconds / 60);
    const remainingSeconds = Math.floor(roundedSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Fonction pour lire ou mettre en pause un message audio
  const toggleAudioPlayback = async (messageId) => {
    // Si un autre audio est en cours de lecture, on l'arrête
    if (playingAudio && playingAudio !== messageId) {
      // Mettre à jour l'état des messages pour indiquer que l'audio précédent n'est plus en lecture
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === playingAudio 
            ? { ...msg, isPlaying: false } 
            : msg
        )
      );
      
      // Arrêter l'audio en cours
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        // Ne pas réinitialiser la position pour permettre de reprendre plus tard
        // audioPlayerRef.current.currentTime = 0;
      }
    }
    
    // Mettre à jour l'état du message actuel
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg._id === messageId 
          ? { ...msg, isPlaying: !msg.isPlaying } 
          : msg
      )
    );
    
    // Si on clique sur le même message qui joue déjà, on le met en pause
    if (playingAudio === messageId) {
      if (audioPlayerRef.current && !audioPlayerRef.current.paused) {
        audioPlayerRef.current.pause();
        setPlayingAudio(null);
      } else if (audioPlayerRef.current) {
        // Reprendre la lecture depuis la position actuelle
        audioPlayerRef.current.play()
          .then(() => {
        setPlayingAudio(messageId);
          })
          .catch(error => {
            console.error("Erreur lors de la reprise de la lecture:", error);
          });
      }
    } else {
      // Sinon, on commence à jouer le nouveau message
      const message = messages.find(msg => msg._id === messageId);
      if (message && message.hasVoiceMessage) {
        // Créer un nouvel élément audio
        const audio = new Audio();
        
        // Réinitialiser les propriétés d'affichage de temps et de progression
        setAudioDuration(0);
        setAudioProgress(0);
        
        // Charger l'audio avec authentification
        const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
          ? 'http://localhost:5000' 
          : window.location.origin;
        
        // Utiliser la fonction loadAudioWithAuth pour gérer l'authentification
        const loadAudioWithAuth = async (url) => {
          try {
            // Extraire l'URL de base sans le token ou les paramètres
            let cleanUrl = url;
            if (url.includes('?')) {
              cleanUrl = url.split('?')[0];
            }
            
            console.log("Chargement audio depuis URL:", cleanUrl);
            
            // Récupérer le token d'authentification
            const token = localStorage.getItem("token");
            const headers = {};
            
            if (token) {
              headers.Authorization = `Bearer ${token}`;
            }
            
            // Effectuer la requête avec les en-têtes appropriés
            console.log("En-têtes de requête:", headers);
            const response = await fetch(cleanUrl, { 
              headers,
              // Retirer credentials: 'include' qui cause l'erreur CORS
              mode: 'cors'
            });
            
            if (!response.ok) {
              console.error("Réponse HTTP non valide:", response.status, response.statusText);
              throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            // Vérifier le type de contenu
            const contentType = response.headers.get('content-type');
            console.log("Type de contenu reçu:", contentType);
            
            // Convertir en blob avec le bon type MIME
            const arrayBuffer = await response.arrayBuffer();
            console.log("Taille des données audio reçues:", arrayBuffer.byteLength, "octets");
            
            // Utiliser le type de contenu de la réponse ou un type par défaut
            const mimeType = contentType || 'audio/wav';
            const blob = new Blob([arrayBuffer], { type: mimeType });
            
            // Créer une URL objet
            const objectUrl = URL.createObjectURL(blob);
            console.log("URL objet créée:", objectUrl);
            
            return objectUrl;
          } catch (error) {
            console.error("Erreur lors du chargement audio avec authentification:", error);
            throw error;
          }
        };
        
        try {
          const audioUrl = `${apiBaseUrl}/api/messages/${messageId}/voice-message`;
          console.log("URL audio originale:", audioUrl);
          const authenticatedAudioSrc = await loadAudioWithAuth(audioUrl);
          audio.src = authenticatedAudioSrc;
          console.log("Audio chargé avec authentification");
        } catch (error) {
          console.error("Erreur lors du chargement audio avec authentification:", error);
          toast.error("Impossible de charger l'audio");
          return;
        }
        
        // Configurer les événements
        audio.onloadedmetadata = () => {
          if (!isNaN(audio.duration) && isFinite(audio.duration)) {
            setAudioDuration(audio.duration);
            console.log("Durée audio détectée:", audio.duration);
          }
        };
        
        // Mettre à jour la progression plus fréquemment pour une meilleure précision
        audio.ontimeupdate = () => {
          if (!isNaN(audio.currentTime) && !isNaN(audio.duration) && isFinite(audio.duration)) {
            // Calculer la progression avec une précision de 4 décimales
            const progress = parseFloat(((audio.currentTime / audio.duration) * 100).toFixed(4));
            setAudioProgress(progress);
          }
        };
        
        audio.onended = () => {
          setPlayingAudio(null);
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg._id === messageId 
                ? { ...msg, isPlaying: false } 
                : msg
            )
          );
          setAudioProgress(0);
        };
        
        audio.onerror = (e) => {
          console.error("Erreur de lecture audio:", e);
          console.error("Code d'erreur:", audio.error ? audio.error.code : "inconnu");
          console.error("Message d'erreur:", audio.error ? audio.error.message : "inconnu");
          
          // Afficher un message d'erreur plus informatif
          toast.error(`Erreur lors du chargement de l'audio: ${audio.error ? audio.error.message : "Impossible de charger l'audio"}`);
          
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg._id === messageId 
                ? { ...msg, isPlaying: false } 
                : msg
            )
          );
          
          setPlayingAudio(null);
        };
        
        // Définir la référence avant de démarrer la lecture
        audioPlayerRef.current = audio;
        
        // Ajouter un gestionnaire pour le chargement des données
        audio.addEventListener('canplaythrough', () => {
          console.log("Audio prêt à être lu sans interruption");
          
          // Mettre à jour la durée une fois de plus pour s'assurer qu'elle est correcte
          if (!isNaN(audio.duration) && isFinite(audio.duration)) {
            setAudioDuration(audio.duration);
          }
        });
        
        // Pour certains navigateurs, le chargement peut prendre du temps
        audio.addEventListener('loadeddata', () => {
          console.log("Audio chargé, tentative de lecture");
          
          // Mettre à jour la durée une fois de plus
          if (!isNaN(audio.duration) && isFinite(audio.duration)) {
            setAudioDuration(audio.duration);
          }
          
          // Démarrer la lecture
          audio.play()
            .then(() => {
              console.log("Lecture audio démarrée avec succès");
        setPlayingAudio(messageId);
            })
            .catch(error => {
              console.error("Erreur lors de la lecture audio:", error);
              toast.error("Impossible de lire l'audio. Vérifiez que le son de votre appareil est activé.");
              
              // Réinitialiser les états en cas d'erreur
              setMessages(prevMessages => 
                prevMessages.map(msg => 
                  msg._id === messageId 
                    ? { ...msg, isPlaying: false } 
                    : msg
                )
              );
              setPlayingAudio(null);
            });
        });
        
        // Forcer le chargement de l'audio
        audio.load();
      }
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-gray-800 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <Image 
              src="/logo.svg" 
              alt="Mystik Logo" 
              width={40} 
              height={40}
              className="object-contain mr-2"
            />
            <span className="text-xl font-bold gradient-text">Mystik</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLogout}
              className="flex items-center text-gray-light hover:text-white"
            >
              <FaSignOutAlt className="mr-2" />
              <span className="hidden md:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profil et statistiques */}
          <div className="md:col-span-1">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="card p-6"
            >
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  {user?.profileImage ? (
                    <Image 
                      src={user.profileImage} 
                      alt="Photo de profil" 
                      width={96} 
                      height={96}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <FaUserCircle className="text-6xl text-gray-600" />
                  )}
                </div>
                
                <h2 className="text-xl font-bold mb-1">Mon profil</h2>
                <div className="mb-4 text-center">
                  <span className="text-gray-light text-sm">
                    {user?.premium ? "Compte Premium" : "Compte Standard"}
                  </span>
                </div>
                
                <div className="w-full p-3 bg-gray-800 rounded-lg mb-4 flex items-center">
                  <span className="text-gray-light mr-2 text-sm truncate">
                    {origin}/@{user?.uniqueLink.replace('@', '')}
                  </span>
                  <button 
                    onClick={copyToClipboard}
                    className="ml-auto text-primary hover:text-primary-light transition"
                  >
                    <FaCopy />
                  </button>
                </div>
                
                <button 
                  onClick={handleShare}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  <FaShareAlt className="mr-2" />
                  Partager mon lien
                </button>
              </div>
              
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Statistiques</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold">{messages.length}</div>
                    <div className="text-gray-light text-sm">Messages</div>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold">{user?.revealKeys || 0}</div>
                    <div className="text-gray-light text-sm">Clés</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Profil émotionnel</h3>
                <div className="bg-gray-800 p-3 rounded-lg">
                  {user?.emotionalProfile?.traits ? (
                    <ul className="space-y-1">
                      {user.emotionalProfile.traits.map((trait, index) => (
                        <li key={index} className="text-sm">• {trait}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-light">
                      Pas encore assez de messages pour générer un profil
                    </p>
                  )}
                </div>
              </div>
              
              {/* Radar émotionnel */}
              {emotionalRadar && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Radar émotionnel</h3>
                  <div className="bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm">
                      {emotionalRadar.message}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Messages programmés */}
              {scheduledMessages > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Messages du futur</h3>
                  <div className="bg-gray-800 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold">{scheduledMessages}</div>
                    <div className="text-gray-light text-sm">Messages en attente</div>
                    <div className="mt-2">
                      <button 
                        onClick={() => router.push('/scheduled-messages')}
                        className="text-primary text-sm hover:underline"
                      >
                        Voir les détails
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
          
          {/* Messages et paramètres */}
          <div className="md:col-span-2">
            <div className="card overflow-hidden">
              <div className="flex border-b border-gray-800">
                <button
                  className={`flex-1 py-4 px-6 text-center transition ${
                    activeTab === "messages" ? "border-b-2 border-primary" : ""
                  }`}
                  onClick={() => setActiveTab("messages")}
                >
                  Messages
                  {messages.filter(m => !m.read).length > 0 && (
                    <span className="ml-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                      {messages.filter(m => !m.read).length}
                    </span>
                  )}
                </button>
                <button
                  className={`flex-1 py-4 px-6 text-center transition ${
                    activeTab === "settings" ? "border-b-2 border-primary" : ""
                  }`}
                  onClick={() => setActiveTab("settings")}
                >
                  Paramètres
                </button>
              </div>
              
              <div className="p-4">
                {activeTab === "messages" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Mes messages</h3>
                      {messages.length > 0 && (
                        <span className="text-gray-light text-sm">
                          {messages.length} message{messages.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    
                    {messages.length === 0 ? (
                      <div className="text-center py-12">
                        <FaBell className="text-4xl text-gray-700 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Pas encore de messages</h3>
                        <p className="text-gray-light text-sm mb-6">
                          Partagez votre lien avec vos amis pour recevoir des messages anonymes.
                        </p>
                        <button 
                          onClick={handleShare}
                          className="btn-primary"
                        >
                          Partager mon lien
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(message => (
                          <motion.div
                            key={message._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`card p-0 overflow-hidden ${!message.read ? 'border-2 border-primary' : 'border border-gray-800'}`}
                            onClick={() => !message.read && markAsRead(message._id)}
                            whileHover={
                              message.emotionalFilter === 'amour' ? { scale: 1.02, boxShadow: "0 0 15px rgba(233, 30, 99, 0.3)" } :
                              message.emotionalFilter === 'colère' ? { scale: 1.02, boxShadow: "0 0 15px rgba(244, 67, 54, 0.3)" } :
                              message.emotionalFilter === 'admiration' ? { scale: 1.02, boxShadow: "0 0 15px rgba(139, 195, 74, 0.3)" } :
                              message.emotionalFilter === 'regret' ? { scale: 1.01, boxShadow: "0 0 15px rgba(96, 125, 139, 0.3)" } :
                              message.emotionalFilter === 'joie' ? { scale: 1.03, boxShadow: "0 0 15px rgba(255, 235, 59, 0.3)" } :
                              message.emotionalFilter === 'tristesse' ? { scale: 1.01, boxShadow: "0 0 15px rgba(33, 150, 243, 0.3)" } :
                              { scale: 1.01, boxShadow: "0 0 10px rgba(255, 255, 255, 0.1)" }
                            }
                          >
                            {/* En-tête stylisé selon l'émotion */}
                            <div 
                              className={`p-4 flex justify-between items-start 
                                ${message.emotionalFilter && message.emotionalFilter !== 'neutre' ? 
                                  message.emotionalFilter === 'amour' ? 'bg-pink-900/40 border-b border-pink-700' : 
                                  message.emotionalFilter === 'colère' ? 'bg-red-900/40 border-b border-red-700' : 
                                  message.emotionalFilter === 'admiration' ? 'bg-green-900/40 border-b border-green-700' : 
                                  message.emotionalFilter === 'regret' ? 'bg-slate-800/80 border-b border-slate-600' : 
                                  message.emotionalFilter === 'joie' ? 'bg-yellow-900/30 border-b border-yellow-700' : 
                                  message.emotionalFilter === 'tristesse' ? 'bg-blue-900/40 border-b border-blue-700' : 
                                  'bg-transparent' : 'bg-transparent'
                                }`}
                            >
                              <div className="flex items-center">
                                <motion.div 
                                  className={`w-10 h-10 rounded-full flex items-center justify-center mr-3
                                    ${message.emotionalFilter === 'amour' ? 'bg-pink-700/50' : 
                                      message.emotionalFilter === 'colère' ? 'bg-red-700/50' : 
                                      message.emotionalFilter === 'admiration' ? 'bg-green-700/50' : 
                                      message.emotionalFilter === 'regret' ? 'bg-slate-600/50' : 
                                      message.emotionalFilter === 'joie' ? 'bg-yellow-600/50' : 
                                      message.emotionalFilter === 'tristesse' ? 'bg-blue-700/50' : 
                                      message.sender.identityRevealed ? 'bg-primary/20' : 'bg-gray-700/50'
                                    }`}
                                  animate={
                                    message.emotionalFilter === 'amour' ? { scale: [1, 1.2, 1], transition: { repeat: Infinity, repeatType: "mirror", duration: 1.5 } } :
                                    message.emotionalFilter === 'colère' ? { rotate: [-1, 1, -1], transition: { repeat: Infinity, duration: 0.3 } } :
                                    message.emotionalFilter === 'admiration' ? { scale: [1, 1.1, 1], transition: { repeat: Infinity, duration: 2 } } :
                                    message.emotionalFilter === 'regret' ? { y: [0, -2, 0], transition: { repeat: Infinity, duration: 2.5 } } :
                                    message.emotionalFilter === 'joie' ? { rotate: [-5, 0, 5, 0], transition: { repeat: Infinity, duration: 1 } } :
                                    message.emotionalFilter === 'tristesse' ? { y: [0, 2, 0], transition: { repeat: Infinity, duration: 3 } } :
                                    {}
                                  }
                                >
                                  {message.sender.identityRevealed && message.sender.emoji 
                                    ? message.sender.emoji 
                                    : message.emotionalFilter === 'amour' ? '❤️' :
                                      message.emotionalFilter === 'colère' ? '😡' :
                                      message.emotionalFilter === 'admiration' ? '😮' :
                                      message.emotionalFilter === 'regret' ? '😔' :
                                      message.emotionalFilter === 'joie' ? '😄' :
                                      message.emotionalFilter === 'tristesse' ? '😢' :
                                      '👤'}
                                </motion.div>
                                <div>
                                  <h4 className={`font-medium 
                                    ${message.emotionalFilter === 'amour' ? 'text-pink-200' : 
                                      message.emotionalFilter === 'colère' ? 'text-red-200' : 
                                      message.emotionalFilter === 'admiration' ? 'text-green-200' : 
                                      message.emotionalFilter === 'regret' ? 'text-slate-200' : 
                                      message.emotionalFilter === 'joie' ? 'text-yellow-200' : 
                                      message.emotionalFilter === 'tristesse' ? 'text-blue-200' : 
                                      'text-white'
                                    }`}>
                                    {/* Affichage du nom en fonction de l'état de découverte */}
                                    {message.sender.userDiscovered && message.sender.realUserName 
                                      ? message.sender.realUserName // Nom d'utilisateur si identité complète découverte
                                      : message.sender.nameDiscovered && message.sender.nickname
                                        ? message.sender.nickname // Surnom si surnom découvert
                                        : message.sender.identityRevealed
                                          ? "Identité partiellement révélée"
                                      : "Anonyme"}
                                  </h4>
                                  
                                  {/* Afficher un badge pour indiquer le statut de révélation */}
                                  {message.sender.identityRevealed && message.sender.nameDiscovered && 
                                   !message.sender.userDiscovered && message.sender.realUser && (
                                    <span className="text-xs bg-purple-900/80 text-purple-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                                      <FaUser className="inline-block mr-1 text-[10px]" />
                                      Identité réelle à découvrir
                                    </span>
                                  )}
                                  
                                  {message.sender.userDiscovered && message.sender.realUserName && (
                                    <span className="text-xs bg-green-800/60 text-green-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                                      <FaCheckCircle className="inline-block mr-1 text-[10px]" />
                                      Identité complète révélée
                                    </span>
                                  )}
                                  
                                  <span className="text-xs text-gray-light block mt-1">
                                    {getDateFormatted(message.createdAt)}
                                  </span>
                                </div>
                              </div>
                              
                              {!message.read && (
                                <motion.span 
                                  className="bg-primary px-2 py-1 text-xs rounded-full"
                                  animate={{ scale: [1, 1.1, 1] }}
                                  transition={{ repeat: Infinity, duration: 1.5 }}
                                >
                                  Nouveau
                                </motion.span>
                              )}
                            </div>
                            
                            {/* Contenu du message stylisé selon l'émotion */}
                            <div className="p-4">
                              <motion.div 
                                className={`p-4 rounded-lg mb-4
                                  ${message.emotionalFilter === 'amour' ? 'bg-pink-950/30 border-l-4 border-pink-600' : 
                                    message.emotionalFilter === 'colère' ? 'bg-red-950/30 border-l-4 border-red-600' : 
                                    message.emotionalFilter === 'admiration' ? 'bg-green-950/30 border-l-4 border-green-600' : 
                                    message.emotionalFilter === 'regret' ? 'bg-slate-800/70 border-l-4 border-slate-500' : 
                                    message.emotionalFilter === 'joie' ? 'bg-yellow-950/30 border-l-4 border-yellow-500' : 
                                    message.emotionalFilter === 'tristesse' ? 'bg-blue-950/30 border-l-4 border-blue-600' : 
                                    'bg-gray-800/60'
                                  }`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ 
                                  opacity: 1, 
                                  y: 0,
                                  ...( message.emotionalFilter === 'amour' ? { 
                                    boxShadow: ["0 0 0 rgba(233, 30, 99, 0)", "0 0 10px rgba(233, 30, 99, 0.3)", "0 0 0 rgba(233, 30, 99, 0)"],
                                    transition: { boxShadow: { repeat: Infinity, duration: 2 } }
                                  } : {}),
                                  ...( message.emotionalFilter === 'colère' ? { 
                                    x: [0, -1, 0, 1, 0],
                                    transition: { x: { repeat: Infinity, duration: 0.5, repeatType: "loop" } }
                                  } : {}),
                                  ...( message.emotionalFilter === 'joie' ? {
                                    backgroundColor: ["rgba(234, 179, 8, 0.1)", "rgba(234, 179, 8, 0.15)", "rgba(234, 179, 8, 0.1)"],
                                    transition: { backgroundColor: { repeat: Infinity, duration: 2, repeatType: "mirror" } }
                                  } : {})
                                }}
                                transition={{ duration: 0.5 }}
                              >
                                {message.emotionalFilter && message.emotionalFilter !== 'neutre' && (
                                  <motion.div 
                                    className="mb-2 flex items-center"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                  >
                                    <motion.span 
                                      className={`text-xs px-2 py-1 rounded-full inline-flex items-center mb-2
                                        ${message.emotionalFilter === 'amour' ? 'bg-pink-800/70 text-pink-200' : 
                                          message.emotionalFilter === 'colère' ? 'bg-red-800/70 text-red-200' : 
                                          message.emotionalFilter === 'admiration' ? 'bg-green-800/70 text-green-200' : 
                                          message.emotionalFilter === 'regret' ? 'bg-slate-700/70 text-slate-200' : 
                                          message.emotionalFilter === 'joie' ? 'bg-yellow-800/70 text-yellow-200' : 
                                          message.emotionalFilter === 'tristesse' ? 'bg-blue-800/70 text-blue-200' : 
                                          'bg-gray-700'
                                        }`}
                                      whileHover={{ scale: 1.05 }}
                                    >
                                      {message.emotionalFilter === 'amour' ? '❤️ Amour' :
                                        message.emotionalFilter === 'colère' ? '😡 Colère' :
                                        message.emotionalFilter === 'admiration' ? '😮 Admiration' :
                                        message.emotionalFilter === 'regret' ? '😔 Regret' :
                                        message.emotionalFilter === 'joie' ? '😄 Joie' :
                                        message.emotionalFilter === 'tristesse' ? '😢 Tristesse' :
                                        'Neutre'}
                                    </motion.span>
                                  </motion.div>
                                )}
                                <motion.p 
                                  className={`
                                    ${message.emotionalFilter === 'amour' ? 'text-pink-100 font-medium' : 
                                      message.emotionalFilter === 'colère' ? 'text-red-100 font-bold uppercase' : 
                                      message.emotionalFilter === 'admiration' ? 'text-green-100' : 
                                      message.emotionalFilter === 'regret' ? 'text-slate-300 italic' : 
                                      message.emotionalFilter === 'joie' ? 'text-yellow-100' : 
                                      message.emotionalFilter === 'tristesse' ? 'text-blue-100' : 
                                      'text-white'
                                    }`}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.3, duration: 0.5 }}
                                >
                                  {message.content}
                                </motion.p>
                              </motion.div>
                              
                              {/* Affichage du message vocal si disponible */}
                              {message.hasVoiceMessage && (
                                <div className="mt-2 mb-4">
                                  <div className="flex items-center bg-gray-800 p-2 rounded-lg">
                                    <button
                                      onClick={() => toggleAudioPlayback(message._id)}
                                      className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3 hover:bg-primary/30 transition"
                                    >
                                      {message.isPlaying ? (
                                        <FaPause className="text-primary" />
                                      ) : (
                                        <FaPlay className="text-primary" />
                                      )}
                                    </button>
                                    <div className="flex-1">
                                      <div className="text-xs text-gray-light mb-1 flex justify-between">
                                        <span>Message vocal</span>
                                        {message.voiceFilter && message.voiceFilter !== "normal" && (
                                          <span className="text-primary font-medium">
                                            Filtre: {message.voiceFilter === "aiguë" ? "Aigu" : 
                                                   message.voiceFilter === "grave" ? "Grave" : 
                                                   message.voiceFilter === "robot" ? "Robot" : 
                                                   message.voiceFilter === "echo" ? "Écho" : 
                                                   message.voiceFilter}
                                          </span>
                                        )}
                                      </div>
                                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full transition-all duration-100 ${
                                            message.voiceFilter === "aiguë" ? "bg-pink-500" :
                                            message.voiceFilter === "grave" ? "bg-blue-500" :
                                            message.voiceFilter === "robot" ? "bg-green-500" :
                                            message.voiceFilter === "echo" ? "bg-purple-500" :
                                            "bg-primary"
                                          }`}
                                          style={{ width: `${message.isPlaying ? audioProgress : 0}%` }}
                                        ></div>
                                      </div>
                                      <div className="mt-1 text-xs text-gray-400 flex justify-between">
                                        <span>
                                          {message.isPlaying && playingAudio === message._id && audioPlayerRef.current ? 
                                            formatTime(audioPlayerRef.current.currentTime) : "00:00"}
                                        </span>
                                        <span>
                                          {message.isPlaying && playingAudio === message._id && audioPlayerRef.current ? 
                                            formatTime(audioPlayerRef.current.duration || 0) : 
                                            message.isPlaying ? "Chargement..." : ""}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Analyse IA */}
                              {message.aiAnalysis && (
                                <div className="mt-3 mb-4 p-3 bg-gray-800 rounded-lg">
                                  <p className="text-xs text-primary mb-1">Analyse IA</p>
                                  <p className="text-sm mb-2">{message.aiAnalysis.summary}</p>
                                  {message.aiAnalysis.suggestionForReply && (
                                    <p className="text-xs text-gray-light">
                                      Suggestion: {message.aiAnalysis.suggestionForReply}
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              {(message.clues?.hint || message.clues?.riddle) && !message.sender.identityRevealed && (
                                <div className="mt-4 pt-4 border-t border-gray-800">
                                  <p className="text-sm text-gray-light mb-2">
                                    Ce message contient des indices cachés que vous pouvez découvrir
                                  </p>
                                  
                                  {message.clues?.hint && (
                                    <div className="bg-gray-800 rounded-lg p-2 text-center mb-2">
                                      <span className="text-xs text-primary">🔎 Indice disponible</span>
                                    </div>
                                  )}
                                  
                                  {message.clues?.riddle && (
                                    <div className="bg-gray-800 rounded-lg p-2 text-center">
                                      <span className="text-xs text-primary">🎮 Devinette disponible</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="mt-4 flex justify-end space-x-2">
                                {/* Bouton de partage */}
                                <button 
                                  className="btn-sm bg-green-700 hover:bg-green-600 transition flex items-center"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMessage(message);
                                    setShowShareModal(true);
                                  }}
                                >
                                  <FaShareAlt className="mr-2" size={12} />
                                  Partager
                                </button>
                                
                                {/* Bouton d'analyse IA */}
                                {!message.aiAnalysis && (
                                  <button 
                                    className="btn-sm bg-blue-700 hover:bg-blue-600 transition flex items-center"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      analyzeMessage(message._id);
                                    }}
                                  >
                                    <span className="mr-1">🤖</span>
                                    Analyser
                                  </button>
                                )}
                                
                                {/* Bouton de révélation */}
                                {(!message.sender.userDiscovered && (message.sender.realUser || !message.sender.nameDiscovered)) && (
                                  <button 
                                    className="btn-sm bg-purple-700 hover:bg-purple-600 transition flex items-center"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openRevealModal(message);
                                    }}
                                  >
                                    <FaKey className="mr-2" size={12} />
                                    Découvrir
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === "settings" && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Paramètres du compte</h3>
                    
                    {/* Onglets des paramètres */}
                    <div className="flex border-b border-gray-800 mb-6">
                      <button
                        className={`pb-2 px-4 text-center transition ${
                          activeSettingsTab === "profile" ? "border-b-2 border-primary" : ""
                        }`}
                        onClick={() => setActiveSettingsTab("profile")}
                      >
                        Profil
                      </button>
                      <button
                        className={`pb-2 px-4 text-center transition ${
                          activeSettingsTab === "keys" ? "border-b-2 border-primary" : ""
                        }`}
                        onClick={() => setActiveSettingsTab("keys")}
                      >
                        Clés
                      </button>
                      <button
                        className={`pb-2 px-4 text-center transition ${
                          activeSettingsTab === "masks" ? "border-b-2 border-primary" : ""
                        }`}
                        onClick={() => setActiveSettingsTab("masks")}
                      >
                        Masques
                      </button>
                      <button
                        className={`pb-2 px-4 text-center transition ${
                          activeSettingsTab === "preferences" ? "border-b-2 border-primary" : ""
                        }`}
                        onClick={() => setActiveSettingsTab("preferences")}
                      >
                        Préférences
                      </button>
                    </div>
                    
                    {/* Profil */}
                    {activeSettingsTab === "profile" && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-medium mb-2">Personnalisation</h4>
                          <p className="text-sm text-gray-light mb-4">
                            Personnalisez votre profil pour le rendre plus attractif
                          </p>
                          <button className="btn-secondary w-full">
                            Modifier mon profil
                          </button>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Profil émotionnel</h4>
                          <p className="text-sm text-gray-light mb-4">
                            Basé sur les messages que vous recevez
                          </p>
                          <div className="border border-gray-800 rounded-lg p-3">
                            {user?.emotionalProfile?.traits ? (
                              <ul className="space-y-1">
                                {user.emotionalProfile.traits.map((trait, index) => (
                                  <li key={index} className="text-sm">• {trait}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-light">
                                Pas encore assez de messages pour générer un profil
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Clés */}
                    {activeSettingsTab === "keys" && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-medium mb-2">Mes clés de révélation</h4>
                          <div className="flex items-center justify-between p-4 border border-gray-800 rounded-lg">
                            <div>
                              <div className="text-3xl font-bold">{user?.revealKeys || 0}</div>
                              <div className="text-sm text-gray-light">Clés disponibles</div>
                            </div>
                            <div className="text-5xl">🔑</div>
                          </div>
                          <p className="text-sm text-gray-light mt-2">
                            Les clés vous permettent de révéler l'identité des expéditeurs anonymes.
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Obtenir des clés</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button
                              onClick={() => earnKey('ad_view')}
                              className="p-3 border border-gray-800 rounded-lg hover:border-primary transition text-center"
                            >
                              <div className="text-2xl mb-2">👁️</div>
                              <div className="font-medium text-sm">Regarder une pub</div>
                              <div className="text-xs text-gray-light">+1 clé</div>
                            </button>
                            <button
                              onClick={() => earnKey('referral')}
                              className="p-3 border border-gray-800 rounded-lg hover:border-primary transition text-center"
                            >
                              <div className="text-2xl mb-2">👥</div>
                              <div className="font-medium text-sm">Inviter un ami</div>
                              <div className="text-xs text-gray-light">+3 clés</div>
                            </button>
                            <button
                              onClick={() => earnKey('share')}
                              className="p-3 border border-gray-800 rounded-lg hover:border-primary transition text-center"
                            >
                              <div className="text-2xl mb-2">🔗</div>
                              <div className="font-medium text-sm">Partager sur les réseaux</div>
                              <div className="text-xs text-gray-light">+2 clés</div>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Masques */}
                    {activeSettingsTab === "masks" && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-medium mb-2">Mes masques personnalisés</h4>
                          <p className="text-sm text-gray-light mb-4">
                            Utilisez des masques pour personnaliser vos messages anonymes
                          </p>
                          
                          {customMasks.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {customMasks.map((mask, index) => (
                                <div key={index} className="border border-gray-800 rounded-lg p-2 text-center">
                                  <div className="w-16 h-16 mx-auto mb-2">
                                    <Image
                                      src={mask.imageUrl}
                                      alt={mask.name}
                                      width={64}
                                      height={64}
                                      className="object-contain"
                                    />
                                  </div>
                                  <div className="text-sm font-medium">{mask.name}</div>
                                  <div className="flex mt-2 space-x-1">
                                    <button
                                      onClick={() => {/* Activer le masque */}}
                                      className="flex-1 text-xs p-1 bg-primary/20 hover:bg-primary/30 rounded"
                                    >
                                      Activer
                                    </button>
                                    <button
                                      onClick={() => {/* Supprimer le masque */}}
                                      className="flex-1 text-xs p-1 bg-red-500/20 hover:bg-red-500/30 rounded"
                                    >
                                      Supprimer
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 border border-gray-800 rounded-lg">
                              <p className="text-gray-light mb-4">Vous n'avez pas encore de masques</p>
                              <button
                                onClick={() => setShowMasksModal(true)}
                                className="btn-primary"
                              >
                                Ajouter un masque
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {customMasks.length > 0 && (
                          <button
                            onClick={() => setShowMasksModal(true)}
                            className="btn-primary w-full"
                          >
                            Ajouter un nouveau masque
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Préférences */}
                    {activeSettingsTab === "preferences" && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-medium mb-2">Notifications</h4>
                          <p className="text-sm text-gray-light mb-4">
                            Configurez comment vous souhaitez être averti des nouveaux messages
                          </p>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-2" defaultChecked />
                              <span>Notifications dans le navigateur</span>
                            </label>
                            <label className="flex items-center">
                              <input type="checkbox" className="mr-2" />
                              <span>Notifications par e-mail</span>
                            </label>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Radar émotionnel</h4>
                          <p className="text-sm text-gray-light mb-4">
                            Voir des statistiques anonymes sur les émotions dans votre région
                          </p>
                          <label className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="mr-2" 
                              checked={user?.localEmotionalRadar?.enabled}
                              onChange={() => {
                                // Toggle radar émotionnel
                              }}
                            />
                            <span>Activer le radar émotionnel local</span>
                          </label>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Compte</h4>
                          <div className="space-y-2">
                            <button className="btn-secondary w-full">
                              Changer de mot de passe
                            </button>
                            <button
                              onClick={handleLogout} 
                              className="btn-danger w-full"
                            >
                              Déconnexion
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Modal de révélation d'identité */}
      {showRevealModal && selectedMessage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 p-6 rounded-lg w-full max-w-md mx-4"
          >
            <h2 className="text-xl font-bold mb-4">Révéler l'identité</h2>
            
            <p className="text-gray-light mb-6">
              Choisissez comment vous souhaitez découvrir les informations cachées de ce message.
              Vous pourrez voir le surnom, les indices et d'autres détails laissés par l'expéditeur.
            </p>
            
            <div className="space-y-4 mb-6">
              {/* Option : Utiliser une clé */}
              <button
                onClick={() => setRevealMethod("key")}
                disabled={user?.revealKeys <= 0}
                className={`p-3 border rounded-lg w-full text-left flex items-center ${
                  revealMethod === "key" ? "border-primary" : "border-gray-800"
                } ${user?.revealKeys <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center mr-3">
                  <FaKey />
                </div>
                <div>
                  <div className="font-medium">Utiliser une clé</div>
                  <div className="text-xs text-gray-light">
                    {user?.revealKeys > 0 
                      ? `Vous avez ${user.revealKeys} clé${user.revealKeys > 1 ? 's' : ''}`
                      : "Vous n'avez pas de clé"}
                  </div>
                </div>
              </button>
              
              {/* Option : Devinette */}
              {selectedMessage?.clues?.riddle && (
                <button
                  onClick={() => setRevealMethod("riddle")}
                  className={`p-3 border rounded-lg w-full text-left flex items-center ${
                    revealMethod === "riddle" ? "border-primary" : "border-gray-800"
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center mr-3">
                    <FaQuestion />
                  </div>
                  <div>
                    <div className="font-medium">Répondre à la devinette</div>
                    <div className="text-xs text-gray-light">
                      {selectedMessage.clues.riddle.question}
                    </div>
                  </div>
                </button>
              )}
            </div>
            
            {/* Champ de réponse pour la devinette */}
            {revealMethod === "riddle" && (
              <div className="mb-4">
                <label className="block text-gray-light mb-1 text-sm">
                  Votre réponse :
                </label>
                <input
                  type="text"
                  value={riddleAnswer}
                  onChange={(e) => setRiddleAnswer(e.target.value)}
                  className="input w-full"
                  placeholder="Entrez votre réponse..."
                />
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={closeRevealModal}
                className="btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={revealSender}
                disabled={(revealMethod === "key" && user?.revealKeys <= 0) || 
                          (revealMethod === "riddle" && !riddleAnswer)}
                className="btn-primary flex-1"
              >
                Révéler
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Modale pour les options de clés */}
      {activeTab === "settings" && activeSettingsTab === "keys" && (
        <div className="mt-4 border border-gray-800 rounded-lg p-4">
          <h4 className="font-medium mb-3">Gagner des clés de révélation</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => earnKey('ad_view')}
              className="p-3 border border-gray-800 rounded-lg hover:border-primary transition text-center"
            >
              <div className="text-2xl mb-2">👁️</div>
              <div className="font-medium text-sm">Regarder une pub</div>
              <div className="text-xs text-gray-light">+1 clé</div>
            </button>
            <button
              onClick={() => earnKey('referral')}
              className="p-3 border border-gray-800 rounded-lg hover:border-primary transition text-center"
            >
              <div className="text-2xl mb-2">👥</div>
              <div className="font-medium text-sm">Inviter un ami</div>
              <div className="text-xs text-gray-light">+3 clés</div>
            </button>
            <button
              onClick={() => earnKey('share')}
              className="p-3 border border-gray-800 rounded-lg hover:border-primary transition text-center"
            >
              <div className="text-2xl mb-2">🔗</div>
              <div className="font-medium text-sm">Partager sur les réseaux</div>
              <div className="text-xs text-gray-light">+2 clés</div>
            </button>
          </div>
        </div>
      )}
      
      <footer className="py-4 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center text-sm text-gray-light">
          <p>© {new Date().getFullYear()} Mystik - Tous droits réservés</p>
        </div>
      </footer>
      
      {/* Modal de succès de révélation */}
      <RevealSuccessModal 
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        senderInfo={revealedSenderInfo}
        messageId={selectedMessage?._id}
        usedKey={usedKey}
        onSendMessage={sendMessageToSender}
        onNotifySender={notifySender}
        onSuccessClose={refreshMessages}
      />
      
      {/* Modal de partage de message */}
      <ShareMessageModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        message={selectedMessage}
      />
    </div>
  );
} 