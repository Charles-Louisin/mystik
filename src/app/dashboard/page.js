"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FaShareAlt, FaCopy, FaBell, FaUserCircle, FaKey, FaSignOutAlt, FaQuestion, FaUser, FaCheckCircle, FaPlus, FaLink, FaStar, FaTrash, FaEdit, FaReply, FaLightbulb, FaVolumeUp, FaPause, FaPlay, FaEye, FaBrain } from "react-icons/fa";
import toast from "react-hot-toast";
import axios from "axios";

import RevealSuccessModal from "@/components/modals/RevealSuccessModal";
import ShareMessageModal from "@/components/modals/ShareMessageModal";
import { loadAudioWithAuth, setupAudioElement } from '../send/audio_fix';

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
  const [revealLoading, setRevealLoading] = useState(false);
  
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
        // Utiliser uniquement l'URL du backend en ligne
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
        
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
              audioUrl: `/api/messages/${message._id}/voice-message`,
              isPlaying: false,
              showAnalysis: false, // Initialiser l'état d'affichage de l'analyse
              analyzed: !!message.aiAnalysis // Marquer comme analysé si aiAnalysis existe
            };
          }
          return {
            ...message,
            showAnalysis: false, // Initialiser l'état d'affichage de l'analyse
            analyzed: !!message.aiAnalysis // Marquer comme analysé si aiAnalysis existe
          };
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
      
      // Utiliser uniquement l'URL du backend en ligne
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
      
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
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
      
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
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
      
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
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
      
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
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
      
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
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
      
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
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
        
        // Récupérer les indices depuis le serveur
        const hintsResponse = await axios.get(
          `${apiBaseUrl}/api/messages/${message._id}/hints`,
          { headers: { Authorization: `Bearer ${token}` }}
        );
        
        console.log("Indices récupérés depuis le serveur:", hintsResponse.data.hints);
        
        // Récupérer également les indices stockés localement
        let localHints = [];
        try {
          const savedHints = localStorage.getItem(`hints_${message._id}`);
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
        if (hintsResponse.data.hints && Array.isArray(hintsResponse.data.hints)) {
          mergedHints = [...hintsResponse.data.hints];
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
        
        // Sauvegarder les indices fusionnés dans le localStorage
        if (mergedHints.length > 0) {
          localStorage.setItem(`hints_${message._id}`, JSON.stringify(mergedHints));
        }
        
        // Enrichir les données du sender avec les indices découverts
        const senderWithHints = {
          ...message.sender,
          discoveredHints: mergedHints,
          hint: message.clues?.hint || null,
          emoji: message.clues?.emoji || null,
          riddle: message.clues?.riddle || null,
          // S'assurer que riddleSolved est correctement défini
          riddleSolved: Boolean(message.sender.riddleSolved),
          // S'assurer que l'état userDiscovered est correctement défini
          userDiscovered: Boolean(message.sender.userDiscovered)
        };
        
        console.log("Informations de l'expéditeur enrichies:", senderWithHints);
        
        // Si le nom est découvert mais pas l'utilisateur réel, et qu'il s'agit d'un utilisateur réel,
        // ouvrir le modal standard pour permettre de deviner l'utilisateur réel
        if (senderWithHints.nameDiscovered && !senderWithHints.userDiscovered && senderWithHints.realUser) {
          console.log("Nom découvert mais pas l'utilisateur réel - Affichage du modal standard");
          setRevealedSenderInfo(senderWithHints);
          setShowSuccessModal(true);
        } else {
          // Sinon, ouvrir directement le modal de succès pour afficher les indices
          setRevealedSenderInfo(senderWithHints);
          setShowSuccessModal(true);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des indices:", error);
        
        // En cas d'erreur, essayer de récupérer les indices depuis le localStorage
        try {
          const savedHints = localStorage.getItem(`hints_${message._id}`);
          if (savedHints) {
            const parsedHints = JSON.parse(savedHints);
            console.log("Indices récupérés depuis le localStorage (fallback):", parsedHints);
            
            // Enrichir les données du sender avec les indices récupérés du localStorage
            const senderWithLocalHints = {
              ...message.sender,
              discoveredHints: parsedHints,
              hint: message.clues?.hint || null,
              emoji: message.clues?.emoji || null,
              riddle: message.clues?.riddle || null,
              // S'assurer que riddleSolved est correctement défini
              riddleSolved: Boolean(message.sender.riddleSolved),
              // S'assurer que l'état userDiscovered est correctement défini
              userDiscovered: Boolean(message.sender.userDiscovered)
            };
            
            // Si le nom est découvert mais pas l'utilisateur réel, et qu'il s'agit d'un utilisateur réel,
            // ouvrir le modal standard pour permettre de deviner l'utilisateur réel
            if (senderWithLocalHints.nameDiscovered && !senderWithLocalHints.userDiscovered && senderWithLocalHints.realUser) {
              console.log("Nom découvert mais pas l'utilisateur réel (localStorage) - Affichage du modal standard");
              setRevealedSenderInfo(senderWithLocalHints);
              setShowSuccessModal(true);
            } else {
              // Sinon, ouvrir directement le modal de succès avec les indices du localStorage
              setRevealedSenderInfo(senderWithLocalHints);
              setShowSuccessModal(true);
            }
            return;
          }
        } catch (localError) {
          console.error("Erreur lors de la récupération des indices depuis le localStorage (fallback):", localError);
        }
        
        // Si tout échoue, afficher le modal standard
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
    
    // Si on essaie de révéler l'identité réelle de l'utilisateur, afficher un message
    if (selectedMessage.sender && selectedMessage.sender.realUser) {
      toast("La découverte de l'identité réelle est une fonctionnalité à venir");
    }
    
    setRevealLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
      
      let endpoint = '';
      let payload = {};
      
      if (revealMethod === "key") {
        endpoint = `${apiBaseUrl}/api/messages/${selectedMessage._id}/reveal-with-key`;
      } else if (revealMethod === "riddle" && riddleAnswer) {
        endpoint = `${apiBaseUrl}/api/messages/${selectedMessage._id}/reveal-with-riddle`;
        payload = { answer: riddleAnswer };
      } else {
        toast.error("Méthode de révélation non valide");
        setRevealLoading(false);
        return;
      }
      
      const response = await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Mettre à jour l'état local pour refléter que le message a été révélé
        const updatedMessages = messages.map(msg => {
          if (msg._id === selectedMessage._id) {
            return {
              ...msg,
              sender: {
                ...msg.sender,
        identityRevealed: true,
                nickname: response.data.nickname || msg.sender.nickname
              },
              clues: response.data.clues || msg.clues
            };
          }
          return msg;
        });
      
      setMessages(updatedMessages);
      
        // Si une clé a été utilisée, mettre à jour le nombre de clés de l'utilisateur
        if (revealMethod === "key" && user) {
          setUser({
            ...user,
            revealKeys: user.revealKeys - 1
          });
          
        setUsedKey(true);
        }
        
        // Stocker les informations révélées
        setRevealedSenderInfo({
          nickname: response.data.nickname,
          emoji: response.data.clues?.emoji,
          hint: response.data.clues?.hint,
          riddle: response.data.clues?.riddle,
          realUser: response.data.realUser || false,
          // Ne pas stocker les informations d'identité réelle pour l'instant
          userDiscovered: false
        });
      
        // Fermer le modal de révélation et ouvrir le modal de succès
        setShowRevealModal(false);
      setShowSuccessModal(true);
      
        // Notification de succès
        toast.success("Identité révélée avec succès !");
      } else {
        // Gérer les erreurs spécifiques
        if (response.data.error === "wrong_answer") {
          toast.error("Mauvaise réponse à la devinette. Essayez à nouveau.");
        } else if (response.data.error === "no_keys") {
          toast.error("Vous n'avez pas de clés disponibles.");
        } else {
          toast.error(response.data.message || "Erreur lors de la révélation de l'identité");
        }
      }
    } catch (error) {
      console.error("Erreur lors de la révélation de l'identité:", error);
      toast.error("Une erreur s'est produite lors de la révélation de l'identité");
    } finally {
      setRevealLoading(false);
      setRiddleAnswer("");
    }
  };
  
  // Fonction pour révéler des informations partielles
  const revealPartialInfo = async (type) => {
    if (!selectedMessage) return;
    
    try {
      const token = localStorage.getItem("token");
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
      
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
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
      
      const { data } = await axios.post(
        `${apiBaseUrl}/api/messages/${messageId}/analyze`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Mise à jour du message dans l'état
      const updatedMessages = messages.map(msg => 
        msg._id === messageId 
          ? { ...msg, aiAnalysis: data.aiAnalysis, analyzed: true } 
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
    // Fonctionnalité temporairement désactivée
    toast("Fonctionnalité à venir");
    return;
    
    /*
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
    */
  };
  
  // Fonction pour notifier l'expéditeur qu'il a été dévoilé
  const notifySender = async () => {
    // Fonctionnalité temporairement désactivée
    toast("Fonctionnalité à venir");
      return;
    
    /*
    if (!revealedSenderInfo || !selectedMessage) {
      toast.error("Impossible de notifier l'expéditeur");
      return;
    }
    
    try {
      setNotifying(true);
      
      const token = localStorage.getItem("token");
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
      
      await axios.post(
        `${apiBaseUrl}/api/messages/${selectedMessage._id}/notify-sender`,
        {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      toast.success("L'expéditeur a été notifié que vous avez découvert son identité");
      setShowSuccessModal(false);
    } catch (error) {
      console.error("Erreur lors de la notification de l'expéditeur:", error);
      toast.error("Impossible de notifier l'expéditeur");
    } finally {
      setNotifying(false);
    }
    */
  };
  
  // Fonction pour rafraîchir les messages
  const refreshMessages = async () => {
    console.log("Rafraîchissement des messages...");
    try {
      const token = localStorage.getItem("token");
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
      
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
        
        // Ajouter un log de débogage pour vérifier l'état complet du message
        console.log(`État complet du message ${message._id}:`, {
          userDiscovered: message.sender?.userDiscovered,
          nameDiscovered: message.sender?.nameDiscovered,
          realUser: message.sender?.realUser,
          riddleSolved: message.sender?.riddleSolved
        });
      });
      
      // Mettre à jour l'état des messages avec les données fraîches du serveur
      const updatedMessages = messagesData.map(message => {
        if (message.hasVoiceMessage) {
          return {
            ...message,
            audioUrl: `/api/messages/${message._id}/voice-message`,
            isPlaying: false,
            analyzed: !!message.aiAnalysis // Marquer comme analysé si aiAnalysis existe
          };
        }
        return {
          ...message,
          analyzed: !!message.aiAnalysis // Marquer comme analysé si aiAnalysis existe
        };
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
    // setRevealedSenderInfo(null); // Commenté pour conserver les informations de l'expéditeur
    setUsedKey(false);
    
    // Rafraîchir les messages depuis le serveur sans recharger toute la page
    try {
      const token = localStorage.getItem("token");
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
      
      console.log("Rafraîchissement des messages après révélation...");
      
      // Récupérer les messages directement depuis le serveur
      const { data: messagesData } = await axios.get(`${apiBaseUrl}/api/messages/received`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Mettre à jour l'état des messages avec les données fraîches
      const updatedMessages = messagesData.map(message => {
        if (message.hasVoiceMessage) {
          return {
            ...message,
            audioUrl: `/api/messages/${message._id}/voice-message`,
            isPlaying: false,
            analyzed: !!message.aiAnalysis // Marquer comme analysé si aiAnalysis existe
          };
        }
        return {
          ...message,
          analyzed: !!message.aiAnalysis // Marquer comme analysé si aiAnalysis existe
        };
      });
      
      setMessages(updatedMessages);
      
      console.log("Messages rafraîchis avec succès après révélation");
      
      // Afficher une notification de succès
      toast.success("Messages mis à jour");
      
      // Rafraîchir également les données utilisateur pour mettre à jour le nombre de clés
      refreshUserData();
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
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
        
        // Utiliser la fonction loadAudioWithAuth pour gérer l'authentification
        const loadAudioWithAuth = async (url) => {
          try {
            // Récupérer l'URL de base de l'API
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
            
            // Extraire l'URL de base sans le token ou les paramètres
            let cleanUrl = url;
            if (url.includes('?')) {
              cleanUrl = url.split('?')[0];
            }
            
            // Si l'URL ne commence pas par http, ajouter l'URL de base de l'API
            if (!cleanUrl.startsWith('http')) {
              // S'assurer que le chemin commence par un slash
              if (!cleanUrl.startsWith('/')) {
                cleanUrl = '/' + cleanUrl;
              }
              cleanUrl = `${apiBaseUrl}${cleanUrl}`;
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
          const audioUrl = `/api/messages/${messageId}/voice-message`;
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
      <header className="border-b border-gray-800 py-3 sm:py-4">
        <div className="container mx-auto px-2 sm:px-4 flex justify-between items-center">
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
      
      <main className="flex-1 container mx-auto px-4 py-8 dashboard-container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
          {/* Profil et statistiques */}
          <div className="md:col-span-1">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="card p-6 dashboard-card"
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
            <div className="card overflow-hidden dashboard-card">
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
              
              <div className="p-2 sm:p-4">
                {activeTab === "messages" && (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center mb-3 sm:mb-4">
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
                      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-0 sm:pr-1 pb-20 sm:pb-0">
                        {messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(message => (
                          <motion.div
                            key={message._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`card p-0 overflow-hidden backdrop-blur-sm ${!message.read ? 'border border-primary shadow-sm shadow-primary/20' : 'border border-gray-800'} hover:shadow-md transition-all duration-300 mb-3 dashboard-card`}
                            onClick={() => !message.read && markAsRead(message._id)}
                            whileHover={
                              message.emotionalFilter === 'amour' ? { scale: 1.01, boxShadow: "0 0 10px rgba(233, 30, 99, 0.3)" } :
                              message.emotionalFilter === 'colère' ? { scale: 1.01, boxShadow: "0 0 10px rgba(244, 67, 54, 0.3)" } :
                              message.emotionalFilter === 'admiration' ? { scale: 1.01, boxShadow: "0 0 10px rgba(139, 195, 74, 0.3)" } :
                              message.emotionalFilter === 'regret' ? { scale: 1.005, boxShadow: "0 0 10px rgba(96, 125, 139, 0.3)" } :
                              message.emotionalFilter === 'joie' ? { scale: 1.01, boxShadow: "0 0 10px rgba(255, 235, 59, 0.3)" } :
                              message.emotionalFilter === 'tristesse' ? { scale: 1.005, boxShadow: "0 0 10px rgba(33, 150, 243, 0.3)" } :
                              { scale: 1.005, boxShadow: "0 0 8px rgba(255, 255, 255, 0.1)" }
                            }
                          >
                            {/* En-tête stylisé selon l'émotion avec effet de verre */}
                            <div 
                              className={`py-2 px-3 flex justify-between items-start backdrop-blur-md
                                ${message.emotionalFilter && message.emotionalFilter !== 'neutre' ? 
                                  message.emotionalFilter === 'amour' ? 'bg-pink-900/40 border-b border-pink-700 shadow-inner shadow-pink-800/30' : 
                                  message.emotionalFilter === 'colère' ? 'bg-red-900/40 border-b border-red-700 shadow-inner shadow-red-800/30' : 
                                  message.emotionalFilter === 'admiration' ? 'bg-green-900/40 border-b border-green-700 shadow-inner shadow-green-800/30' : 
                                  message.emotionalFilter === 'regret' ? 'bg-slate-800/80 border-b border-slate-600 shadow-inner shadow-slate-700/30' : 
                                  message.emotionalFilter === 'joie' ? 'bg-yellow-900/30 border-b border-yellow-700 shadow-inner shadow-yellow-800/30' : 
                                  message.emotionalFilter === 'tristesse' ? 'bg-blue-900/40 border-b border-blue-700 shadow-inner shadow-blue-800/30' : 
                                  'bg-gray-900/80 border-b border-gray-800' : 'bg-gray-900/80 border-b border-gray-800'
                                }`}
                            >
                              <div className="flex items-center">
                                <motion.div 
                                  className={`w-9 h-9 rounded-full flex items-center justify-center mr-2 shadow-md
                                    ${message.emotionalFilter === 'amour' ? 'bg-gradient-to-br from-pink-600 to-pink-900 shadow-pink-700/30' : 
                                      message.emotionalFilter === 'colère' ? 'bg-gradient-to-br from-red-600 to-red-900 shadow-red-700/30' : 
                                      message.emotionalFilter === 'admiration' ? 'bg-gradient-to-br from-green-600 to-green-900 shadow-green-700/30' : 
                                      message.emotionalFilter === 'regret' ? 'bg-gradient-to-br from-slate-500 to-slate-800 shadow-slate-600/30' : 
                                      message.emotionalFilter === 'joie' ? 'bg-gradient-to-br from-yellow-500 to-yellow-800 shadow-yellow-600/30' : 
                                      message.emotionalFilter === 'tristesse' ? 'bg-gradient-to-br from-blue-600 to-blue-900 shadow-blue-700/30' : 
                                      message.sender.identityRevealed ? 'bg-gradient-to-br from-purple-500 to-purple-900 shadow-purple-700/30' : 'bg-gradient-to-br from-gray-600 to-gray-900'
                                    }`}
                                  animate={
                                    message.emotionalFilter === 'amour' ? { scale: [1, 1.1, 1], transition: { repeat: Infinity, repeatType: "mirror", duration: 1.5 } } :
                                    message.emotionalFilter === 'colère' ? { rotate: [-1, 1, -1], transition: { repeat: Infinity, duration: 0.3 } } :
                                    message.emotionalFilter === 'admiration' ? { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 2 } } :
                                    message.emotionalFilter === 'regret' ? { y: [0, -1, 0], transition: { repeat: Infinity, duration: 2.5 } } :
                                    message.emotionalFilter === 'joie' ? { rotate: [-3, 0, 3, 0], transition: { repeat: Infinity, duration: 1 } } :
                                    message.emotionalFilter === 'tristesse' ? { y: [0, 1, 0], transition: { repeat: Infinity, duration: 3 } } :
                                    {}
                                  }
                                  whileHover={{ scale: 1.05 }}
                                >
                                  <span className="text-base">
                                  {message.sender.identityRevealed && message.sender.emoji 
                                    ? message.sender.emoji 
                                    : message.emotionalFilter === 'amour' ? '❤️' :
                                      message.emotionalFilter === 'colère' ? '😡' :
                                      message.emotionalFilter === 'admiration' ? '😮' :
                                      message.emotionalFilter === 'regret' ? '😔' :
                                      message.emotionalFilter === 'joie' ? '😄' :
                                      message.emotionalFilter === 'tristesse' ? '😢' :
                                      '👤'}
                                  </span>
                                </motion.div>
                                <div>
                                  <h4 className={`font-medium text-base
                                    ${message.emotionalFilter === 'amour' ? 'text-pink-200' : 
                                      message.emotionalFilter === 'colère' ? 'text-red-200' : 
                                      message.emotionalFilter === 'admiration' ? 'text-green-200' : 
                                      message.emotionalFilter === 'regret' ? 'text-slate-200' : 
                                      message.emotionalFilter === 'joie' ? 'text-yellow-200' : 
                                      message.emotionalFilter === 'tristesse' ? 'text-blue-200' : 
                                      'text-white'
                                    }`}>
                                    {/* Affichage du nom en fonction de l'état de découverte */}
                                    {message.sender.nameDiscovered && message.sender.nickname
                                        ? message.sender.nickname // Surnom si surnom découvert
                                        : message.sender.identityRevealed
                                          ? "Identité partiellement révélée"
                                      : "Anonyme"}
                                  </h4>
                                  
                                  {/* Badge pour indiquer que la devinette a été résolue */}
                                  {message.sender.nameDiscovered && (
                                    <motion.span 
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      className="text-[10px] bg-gradient-to-r from-green-800 to-emerald-700 text-green-100 px-1.5 py-0.5 rounded-full mt-0.5 inline-block shadow-sm"
                                    >
                                      <FaCheckCircle className="inline-block mr-0.5 text-[8px]" />
                                      Découvert
                                    </motion.span>
                                  )}
                                  
                                  <span className="text-[10px] text-gray-light block mt-0.5">
                                    {getDateFormatted(message.createdAt)}
                                  </span>
                                </div>
                              </div>
                              
                              {!message.read && (
                                <motion.span 
                                  className="bg-gradient-to-r from-primary to-purple-600 px-2 py-0.5 text-[10px] rounded-full shadow-md shadow-primary/20"
                                  animate={{ scale: [1, 1.05, 1] }}
                                  transition={{ repeat: Infinity, duration: 1.5 }}
                                >
                                  Nouveau
                                </motion.span>
                              )}
                            </div>
                            
                            {/* Contenu du message stylisé selon l'émotion */}
                            <div className="p-4">
                              <motion.div 
                                className={`p-4 rounded-xl mb-2 shadow-lg relative overflow-hidden
                                  ${message.emotionalFilter === 'amour' ? 'bg-gradient-to-br from-pink-950/80 to-pink-900/60 border border-pink-700/50' : 
                                    message.emotionalFilter === 'colère' ? 'bg-gradient-to-br from-red-950/80 to-red-900/60 border border-red-700/50' : 
                                    message.emotionalFilter === 'admiration' ? 'bg-gradient-to-br from-green-950/80 to-green-900/60 border border-green-700/50' : 
                                    message.emotionalFilter === 'regret' ? 'bg-gradient-to-br from-slate-900/90 to-slate-800/70 border border-slate-700/50' : 
                                    message.emotionalFilter === 'joie' ? 'bg-gradient-to-br from-yellow-950/80 to-amber-900/60 border border-yellow-700/50' : 
                                    message.emotionalFilter === 'tristesse' ? 'bg-gradient-to-br from-blue-950/80 to-blue-900/60 border border-blue-700/50' : 
                                    'bg-gradient-to-br from-gray-900/90 to-gray-800/70 border border-gray-700/50'
                                  }`}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ 
                                  opacity: 1, 
                                  y: 0,
                                  ...( message.emotionalFilter === 'amour' ? { 
                                    boxShadow: ["0 0 0 rgba(233, 30, 99, 0)", "0 0 15px rgba(233, 30, 99, 0.3)", "0 0 0 rgba(233, 30, 99, 0)"],
                                    transition: { boxShadow: { repeat: Infinity, duration: 2 } }
                                  } : {}),
                                  ...( message.emotionalFilter === 'colère' ? { 
                                    x: [0, -0.5, 0, 0.5, 0],
                                    transition: { x: { repeat: Infinity, duration: 0.5, repeatType: "loop" } }
                                  } : {}),
                                  ...( message.emotionalFilter === 'joie' ? {
                                    backgroundColor: ["rgba(234, 179, 8, 0.1)", "rgba(234, 179, 8, 0.15)", "rgba(234, 179, 8, 0.1)"],
                                    transition: { backgroundColor: { repeat: Infinity, duration: 2, repeatType: "mirror" } }
                                  } : {})
                                }}
                                transition={{ duration: 0.3 }}
                              >
                                {/* Effets de fond selon l'émotion */}
                                <div className="absolute inset-0 opacity-20 pointer-events-none">
                                  {message.emotionalFilter === 'amour' && (
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(236,72,153,0.2),transparent_70%)]"></div>
                                  )}
                                  {message.emotionalFilter === 'colère' && (
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(239,68,68,0.2),transparent_70%)]"></div>
                                  )}
                                  {message.emotionalFilter === 'admiration' && (
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(34,197,94,0.2),transparent_70%)]"></div>
                                  )}
                                  {message.emotionalFilter === 'regret' && (
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(148,163,184,0.15),transparent_70%)]"></div>
                                  )}
                                  {message.emotionalFilter === 'joie' && (
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(250,204,21,0.15),transparent_70%)]"></div>
                                  )}
                                  {message.emotionalFilter === 'tristesse' && (
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.15),transparent_70%)]"></div>
                                  )}
                                </div>
                                
                                {message.emotionalFilter && message.emotionalFilter !== 'neutre' && (
                                  <motion.div 
                                    className="mb-2 flex items-center"
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                  >
                                    <motion.span 
                                      className={`text-xs px-3 py-1 rounded-full inline-flex items-center mb-1 shadow-md
                                        ${message.emotionalFilter === 'amour' ? 'bg-gradient-to-r from-pink-800 to-pink-700 text-pink-100 border border-pink-600/50' : 
                                          message.emotionalFilter === 'colère' ? 'bg-gradient-to-r from-red-800 to-red-700 text-red-100 border border-red-600/50' : 
                                          message.emotionalFilter === 'admiration' ? 'bg-gradient-to-r from-green-800 to-green-700 text-green-100 border border-green-600/50' : 
                                          message.emotionalFilter === 'regret' ? 'bg-gradient-to-r from-slate-700 to-slate-600 text-slate-100 border border-slate-500/50' : 
                                          message.emotionalFilter === 'joie' ? 'bg-gradient-to-r from-yellow-800 to-yellow-700 text-yellow-100 border border-yellow-600/50' : 
                                          message.emotionalFilter === 'tristesse' ? 'bg-gradient-to-r from-blue-800 to-blue-700 text-blue-100 border border-blue-600/50' : 
                                          'bg-gradient-to-r from-gray-700 to-gray-600 text-white border border-gray-500/50'
                                        }`}
                                      whileHover={{ scale: 1.05, boxShadow: "0 0 10px rgba(255, 255, 255, 0.2)" }}
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
                                  className={`text-base leading-relaxed relative z-10
                                    ${message.emotionalFilter === 'amour' ? 'text-pink-50 font-medium' : 
                                      message.emotionalFilter === 'colère' ? 'text-red-50 font-bold uppercase' : 
                                      message.emotionalFilter === 'admiration' ? 'text-green-50' : 
                                      message.emotionalFilter === 'regret' ? 'text-slate-200 italic' : 
                                      message.emotionalFilter === 'joie' ? 'text-yellow-50' : 
                                      message.emotionalFilter === 'tristesse' ? 'text-blue-50' : 
                                      'text-white'
                                    }`}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.2, duration: 0.3 }}
                                >
                                  {message.content}
                                </motion.p>
                              </motion.div>
                              
                              {/* Affichage du message vocal si disponible - Lecteur audio amélioré */}
                              {message.hasVoiceMessage && (
                                <div className="mt-3 mb-3">
                                  <div className={`relative overflow-hidden backdrop-blur-md p-3 rounded-xl shadow-lg border
                                    ${message.emotionalFilter === 'amour' ? 'bg-gradient-to-br from-pink-950/90 to-pink-900/80 border-pink-700/50' : 
                                      message.emotionalFilter === 'colère' ? 'bg-gradient-to-br from-red-950/90 to-red-900/80 border-red-700/50' : 
                                      message.emotionalFilter === 'admiration' ? 'bg-gradient-to-br from-green-950/90 to-green-900/80 border-green-700/50' : 
                                      message.emotionalFilter === 'regret' ? 'bg-gradient-to-br from-slate-900/90 to-slate-800/80 border-slate-700/50' : 
                                      message.emotionalFilter === 'joie' ? 'bg-gradient-to-br from-yellow-950/90 to-amber-900/80 border-yellow-700/50' : 
                                      message.emotionalFilter === 'tristesse' ? 'bg-gradient-to-br from-blue-950/90 to-blue-900/80 border-blue-700/50' : 
                                      'bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-gray-700/50'
                                    }`}>
                                    <div className="absolute inset-0 opacity-20">
                                      {message.voiceFilter === "aiguë" && (
                                        <div className="absolute inset-0 bg-pink-500/10 bg-[radial-gradient(circle_at_center,_rgba(236,72,153,0.15),transparent_70%)]"></div>
                                      )}
                                      {message.voiceFilter === "grave" && (
                                        <div className="absolute inset-0 bg-blue-500/10 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.15),transparent_70%)]"></div>
                                      )}
                                      {message.voiceFilter === "robot" && (
                                        <div className="absolute inset-0 bg-green-500/10 bg-[radial-gradient(circle_at_center,_rgba(34,197,94,0.15),transparent_70%)]"></div>
                                      )}
                                      {message.voiceFilter === "echo" && (
                                        <div className="absolute inset-0 bg-purple-500/10 bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.15),transparent_70%)]"></div>
                                      )}
                                      {(!message.voiceFilter || message.voiceFilter === "normal") && (
                                        <div className="absolute inset-0 bg-primary/10 bg-[radial-gradient(circle_at_center,_rgba(139,92,246,0.15),transparent_70%)]"></div>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-3 relative z-10">
                                    <motion.button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleAudioPlayback(message._id);
                                      }}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 
                                        ${message.isPlaying ? 
                                            message.emotionalFilter === 'amour' ? 'bg-gradient-to-br from-pink-600 to-pink-800 shadow-pink-500/40' :
                                            message.emotionalFilter === 'colère' ? 'bg-gradient-to-br from-red-600 to-red-800 shadow-red-500/40' :
                                            message.emotionalFilter === 'admiration' ? 'bg-gradient-to-br from-green-600 to-green-800 shadow-green-500/40' :
                                            message.emotionalFilter === 'regret' ? 'bg-gradient-to-br from-slate-500 to-slate-700 shadow-slate-400/40' :
                                            message.emotionalFilter === 'joie' ? 'bg-gradient-to-br from-yellow-500 to-amber-700 shadow-yellow-500/40' :
                                            message.emotionalFilter === 'tristesse' ? 'bg-gradient-to-br from-blue-600 to-blue-800 shadow-blue-500/40' :
                                            'bg-gradient-to-br from-primary to-purple-700 shadow-primary/30'
                                            : 
                                            'bg-gradient-to-br from-gray-700 to-gray-900 hover:from-primary/70 hover:to-purple-700/70'
                                          }`}
                                        whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(139, 92, 246, 0.4)" }}
                                      whileTap={{ scale: 0.95 }}
                                        animate={message.isPlaying ? {
                                          boxShadow: message.emotionalFilter === 'amour' ? 
                                                    ["0 0 5px rgba(236, 72, 153, 0.4)", "0 0 15px rgba(236, 72, 153, 0.6)", "0 0 5px rgba(236, 72, 153, 0.4)"] :
                                                    message.emotionalFilter === 'colère' ? 
                                                    ["0 0 5px rgba(239, 68, 68, 0.4)", "0 0 15px rgba(239, 68, 68, 0.6)", "0 0 5px rgba(239, 68, 68, 0.4)"] :
                                                    message.emotionalFilter === 'admiration' ? 
                                                    ["0 0 5px rgba(34, 197, 94, 0.4)", "0 0 15px rgba(34, 197, 94, 0.6)", "0 0 5px rgba(34, 197, 94, 0.4)"] :
                                                    message.emotionalFilter === 'regret' ? 
                                                    ["0 0 5px rgba(148, 163, 184, 0.4)", "0 0 15px rgba(148, 163, 184, 0.6)", "0 0 5px rgba(148, 163, 184, 0.4)"] :
                                                    message.emotionalFilter === 'joie' ? 
                                                    ["0 0 5px rgba(250, 204, 21, 0.4)", "0 0 15px rgba(250, 204, 21, 0.6)", "0 0 5px rgba(250, 204, 21, 0.4)"] :
                                                    message.emotionalFilter === 'tristesse' ? 
                                                    ["0 0 5px rgba(59, 130, 246, 0.4)", "0 0 15px rgba(59, 130, 246, 0.6)", "0 0 5px rgba(59, 130, 246, 0.4)"] :
                                                    ["0 0 5px rgba(139, 92, 246, 0.4)", "0 0 15px rgba(139, 92, 246, 0.6)", "0 0 5px rgba(139, 92, 246, 0.4)"]
                                        } : {}}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                    >
                                      {message.isPlaying ? (
                                          <FaPause className="text-white text-sm" />
                                      ) : (
                                          <FaPlay className="text-white text-sm ml-1" />
                                      )}
                                    </motion.button>
                                      
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-white">Message vocal</span>
                                        {message.voiceFilter && message.voiceFilter !== "normal" && (
                                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium 
                                                ${message.voiceFilter === "aiguë" ? "bg-pink-500/20 text-pink-300 border border-pink-500/30" : 
                                                 message.voiceFilter === "grave" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : 
                                                 message.voiceFilter === "robot" ? "bg-green-500/20 text-green-300 border border-green-500/30" : 
                                                 message.voiceFilter === "echo" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : 
                                                 "bg-primary/20 text-primary border border-primary/30"}`}
                                              >
                                            {message.voiceFilter === "aiguë" ? "Aigu" : 
                                             message.voiceFilter === "grave" ? "Grave" : 
                                             message.voiceFilter === "robot" ? "Robot" : 
                                             message.voiceFilter === "echo" ? "Écho" : 
                                             `${message.voiceFilter}`}
                                          </span>
                                         )}
                                       </div>
                                        <motion.span 
                                            className="text-xs text-gray-300"
                                          animate={message.isPlaying ? { opacity: [0.7, 1, 0.7] } : {}}
                                          transition={{ repeat: Infinity, duration: 1.5 }}
                                        >
                                          {message.isPlaying && playingAudio === message._id && audioPlayerRef.current ? 
                                              `${formatTime(audioPlayerRef.current.currentTime)} / ${formatTime(audioPlayerRef.current.duration || 0)}` : 
                                            message.isPlaying ? 
                                              <motion.span 
                                                animate={{ opacity: [0.5, 1, 0.5] }}
                                                transition={{ repeat: Infinity, duration: 1 }}
                                              >
                                                Chargement...
                                              </motion.span> : ""}
                                        </motion.span>
                                      </div>
                                        
                                        <div className="relative h-2 bg-gray-700/70 rounded-full overflow-hidden shadow-inner">
                                          {/* Fond animé pour la barre de progression */}
                                        <motion.div 
                                            className="absolute inset-0 opacity-30"
                                            animate={message.isPlaying ? {
                                              background: [
                                                "linear-gradient(90deg, rgba(139,92,246,0.3) 0%, rgba(168,85,247,0.3) 100%)",
                                                "linear-gradient(90deg, rgba(139,92,246,0.5) 0%, rgba(168,85,247,0.5) 100%)",
                                                "linear-gradient(90deg, rgba(139,92,246,0.3) 0%, rgba(168,85,247,0.3) 100%)"
                                              ]
                                            } : {}}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                          />
                                          
                                          {/* Barre de progression */}
                                          <motion.div 
                                            className={`h-full rounded-full relative z-10 ${
                                            message.voiceFilter === "aiguë" ? "bg-gradient-to-r from-pink-500 to-pink-400" :
                                            message.voiceFilter === "grave" ? "bg-gradient-to-r from-blue-600 to-blue-400" :
                                            message.voiceFilter === "robot" ? "bg-gradient-to-r from-green-500 to-green-400" :
                                            message.voiceFilter === "echo" ? "bg-gradient-to-r from-purple-600 to-purple-400" :
                                            "bg-gradient-to-r from-primary to-purple-400"
                                          }`}
                                          style={{ width: `${message.isPlaying ? audioProgress : 0}%` }}
                                          animate={message.isPlaying ? {
                                              boxShadow: ["0 0 5px rgba(139, 92, 246, 0.4)", "0 0 10px rgba(139, 92, 246, 0.6)", "0 0 5px rgba(139, 92, 246, 0.4)"]
                                          } : {}}
                                          transition={{ repeat: Infinity, duration: 1.5 }}
                                        />
                                          
                                          {/* Effet de pulsation au bout de la barre */}
                                          {message.isPlaying && (
                                            <motion.div 
                                              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white/80 shadow-lg"
                                              style={{ left: `${audioProgress}%`, marginLeft: "-6px" }}
                                              animate={{ scale: [1, 1.2, 1], boxShadow: ["0 0 0px white", "0 0 10px rgba(255,255,255,0.7)", "0 0 0px white"] }}
                                          transition={{ repeat: Infinity, duration: 1.5 }}
                                            />
                                          )}
                                    </div>
                                        
                                        {/* Visualisation d'onde audio (simulée) */}
                                        {message.isPlaying && (
                                          <div className="flex items-center justify-center gap-0.5 h-4 mt-2">
                                            {Array.from({ length: 12 }).map((_, i) => (
                                              <motion.div
                                                key={i}
                                                className={`w-1 rounded-full ${
                                                  message.voiceFilter === "aiguë" ? "bg-pink-400/70" :
                                                  message.voiceFilter === "grave" ? "bg-blue-400/70" :
                                                  message.voiceFilter === "robot" ? "bg-green-400/70" :
                                                  message.voiceFilter === "echo" ? "bg-purple-400/70" :
                                                  "bg-primary/70"
                                                }`}
                                                animate={{ 
                                                  height: [`${Math.random() * 30 + 10}%`, `${Math.random() * 90 + 10}%`, `${Math.random() * 30 + 10}%`] 
                                                }}
                                                transition={{ 
                                                  repeat: Infinity, 
                                                  duration: 0.6 + Math.random() * 0.8,
                                                  ease: "easeInOut"
                                                }}
                                              />
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                 </div>
                              )}
                              
                              {/* Indicateurs compacts pour les fonctionnalités */}
                              <div className="flex flex-wrap gap-1 mt-2">
                                {message.aiAnalysis && (
                                  <motion.button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const updatedMessages = messages.map(msg => 
                                        msg._id === message._id ? { ...msg, showAnalysis: !msg.showAnalysis } : msg
                                      );
                                      setMessages(updatedMessages);
                                    }}
                                    className="bg-purple-900/30 text-purple-200 text-[10px] px-1.5 py-0.5 rounded-full flex items-center hover:bg-purple-900/50 transition-colors"
                                  >
                                    <FaBrain className="mr-0.5 text-[8px]" /> {message.showAnalysis ? "Masquer l'analyse" : "Voir l'analyse"}
                                  </motion.button>
                                )}
                              </div>
                              
                              {/* Affichage de l'analyse du message si disponible */}
                              {message.aiAnalysis && message.showAnalysis && (
                                <motion.div 
                                  className="mt-2 p-2 bg-blue-900/30 backdrop-blur-sm rounded-lg border border-blue-800/50"
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <h4 className="text-xs font-medium text-blue-300 mb-1 flex items-center">
                                    <FaBrain className="mr-1 text-[10px]" />
                                    Analyse du message
                                  </h4>
                                  
                                  {typeof message.aiAnalysis === 'string' ? (
                                    <p className="text-[10px] text-gray-200">
                                      {message.aiAnalysis}
                                    </p>
                                  ) : (
                                    <div className="space-y-1">
                                      {message.aiAnalysis.emotionalIntent && (
                                        <div>
                                          <h5 className="text-[10px] font-medium text-blue-200">Intention émotionnelle:</h5>
                                          <p className="text-[10px] text-gray-200">{message.aiAnalysis.emotionalIntent}</p>
                                         </div>
                                      )}
                                      
                                      {message.aiAnalysis.summary && (
                                        <div>
                                          <h5 className="text-[10px] font-medium text-blue-200">Résumé:</h5>
                                          <p className="text-[10px] text-gray-200">{message.aiAnalysis.summary}</p>
                                     </div>
                                  )}
                                  
                                      {message.aiAnalysis.suggestionForReply && (
                                        <div>
                                          <h5 className="text-[10px] font-medium text-blue-200">Suggestion de réponse:</h5>
                                          <p className="text-[10px] text-gray-200">{message.aiAnalysis.suggestionForReply}</p>
                                     </div>
                                  )}
                                </div>
                              )}
                                </motion.div>
                              )}
                              
                              {/* Boutons d'action compacts pour le message */}
                              <div className="mt-2 flex items-center justify-between gap-1.5">
                                {/* Bouton Découvrir - affiché seulement si le surnom n'a pas été découvert */}
                                {(!message.sender || !message.sender.nameDiscovered) && (
                                  <motion.button
                                    onClick={() => openRevealModal(message)}
                                    className="flex-1 py-2 px-3 bg-black/40 backdrop-blur-sm rounded-full border border-primary/30 text-primary-light flex items-center justify-center transition-all duration-300 group"
                                    whileHover={{ 
                                      scale: 1.02, 
                                      boxShadow: "0 0 15px rgba(139, 92, 246, 0.25)",
                                      transition: { duration: 0.2 }
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <motion.div
                                      className="mr-2 text-primary"
                                      animate={{ rotate: [0, 360] }}
                                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                      style={{ opacity: 0.8, display: "inline-flex" }}
                                    >
                                      <FaEye className="text-sm group-hover:text-primary-light transition-colors duration-300" />
                                    </motion.div>
                                    <span className="font-medium text-sm">Découvrir</span>
                                  </motion.button>
                                )}
                                
                                {/* Bouton Analyser - affiché seulement si le message n'a pas déjà été analysé */}
                                {!message.analyzed && (
                                  <motion.button
                                    onClick={() => analyzeMessage(message._id)}
                                    className="flex-1 py-2 px-3 bg-black/40 backdrop-blur-sm rounded-full border border-blue-500/30 text-blue-300 flex items-center justify-center transition-all duration-300 group"
                                    whileHover={{ 
                                      scale: 1.02, 
                                      boxShadow: "0 0 15px rgba(59, 130, 246, 0.25)",
                                      transition: { duration: 0.2 }
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <motion.div
                                      className="mr-2 text-blue-400"
                                      animate={{ rotateY: [0, 360] }}
                                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                      style={{ opacity: 0.8, display: "inline-flex" }}
                                    >
                                      <FaBrain className="text-sm group-hover:text-blue-200 transition-colors duration-300" />
                                    </motion.div>
                                    <span className="font-medium text-sm">Analyser</span>
                                  </motion.button>
                                )}
                                
                                {/* Bouton Partager - ouvre un modal avec juste le message */}
                                <motion.button
                                  onClick={() => {
                                    // Afficher un modal avec juste le message
                                    setSelectedMessage(message);
                                    setShowShareModal(true);
                                  }}
                                  className="flex-1 py-2 px-3 bg-black/40 backdrop-blur-sm rounded-full border border-green-500/30 text-green-300 flex items-center justify-center transition-all duration-300 group"
                                  whileHover={{ 
                                    scale: 1.02, 
                                    boxShadow: "0 0 15px rgba(16, 185, 129, 0.25)",
                                    transition: { duration: 0.2 }
                                  }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <motion.div 
                                    className="mr-2 text-green-400"
                                    animate={{ 
                                      rotate: [0, 15, 0, -15, 0],
                                    }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    style={{ opacity: 0.8, display: "inline-flex" }}
                                  >
                                    <FaShareAlt className="text-sm group-hover:text-green-200 transition-colors duration-300" />
                                  </motion.div>
                                  <span className="font-medium text-sm">Partager</span>
                                </motion.button>
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
      {/* {activeTab === "settings" && activeSettingsTab === "keys" && (
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
      )} */}
      
      <footer className="py-3 sm:py-4 border-t border-gray-800">
        <div className="container mx-auto px-2 sm:px-4 text-center text-xs sm:text-sm text-gray-light">
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