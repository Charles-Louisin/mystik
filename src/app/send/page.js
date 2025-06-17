"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaArrowLeft, FaUser, FaSmile, FaQuestion, FaLightbulb, FaPaperPlane, FaSearch, FaTimes, FaSignInAlt, FaUserPlus, FaCheck, FaEye, FaEyeSlash, FaMicrophone, FaStop, FaVolumeUp, FaTrash, FaPause, FaPlay, FaArrowRight } from "react-icons/fa";
import toast from "react-hot-toast";
import axios from "axios";

const emotionalFilters = [
  { id: "neutre", name: "Neutre", color: "#9e9e9e", emoji: "✨", bgColor: "rgba(158, 158, 158, 0.15)" },
  { id: "amour", name: "Amour", color: "#e91e63", emoji: "❤️", bgColor: "rgba(233, 30, 99, 0.15)" },
  { id: "colère", name: "Colère", color: "#f44336", emoji: "😡", bgColor: "rgba(244, 67, 54, 0.15)" },
  { id: "admiration", name: "Admiration", color: "#8bc34a", emoji: "😮", bgColor: "rgba(139, 195, 74, 0.15)" },
  { id: "regret", name: "Regret", color: "#607d8b", emoji: "😔", bgColor: "rgba(96, 125, 139, 0.15)" },
  { id: "joie", name: "Joie", color: "#ffeb3b", emoji: "😄", bgColor: "rgba(255, 235, 59, 0.15)" },
  { id: "tristesse", name: "Tristesse", color: "#2196f3", emoji: "😢", bgColor: "rgba(33, 150, 243, 0.15)" }
];

// Composant qui utilise useSearchParams
function SearchParamsWrapper() {
  const searchParams = useSearchParams();
  const recipientLink = searchParams.get("to");
  return <SendMessageContent recipientLink={recipientLink} />;
}

// Composant principal qui contient tout le code existant
function SendMessageContent({ recipientLink }) {
  const router = useRouter();
  const searchTimeoutRef = useRef(null);

  const [formData, setFormData] = useState({
    recipientLink: recipientLink || "",
    content: "",
    nickname: "",
    hint: "",
    emoji: "",
    riddleQuestion: "",
    riddleAnswer: "",
    emotionalFilter: "neutre",
    scheduledDate: "",
    customMask: "",
    voiceMessage: null,
    voiceFilter: "normal",
    revealCondition: {
      type: "aucune",
      details: {}
    }
  });
  
  const [recipient, setRecipient] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  const [step, setStep] = useState(recipientLink ? 2 : 1);
  const [charCount, setCharCount] = useState(0);
  const [availableMasks, setAvailableMasks] = useState([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [sendAsAuthenticated, setSendAsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', phone: '', password: '', password2: '' });
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [phoneAvailable, setPhoneAvailable] = useState(null);
  const MIN_CHAR_COUNT = 5;
  const EMOJI_OPTIONS = ["😊", "😎", "🥸", "🤫", "😏", "😉", "👽", "👻", "🤖", "🦸", "🤩", "😍", "🤔", "🤯", "🤠", "👾"];
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterPassword2, setShowRegisterPassword2] = useState(false);
  
  // États pour l'enregistrement audio
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingIntervalId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const progressIntervalRef = useRef(null);
  const [currentAudioPosition, setCurrentAudioPosition] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const audioEffectsRef = useRef({});
  
  // Filtres vocaux disponibles
  const voiceFilters = [
    { id: "normal", name: "Normal", description: "Votre voix naturelle", color: "#6e9cd4" },
    { id: "robot", name: "Robot", description: "Effet robotique", color: "#50c878" },
    { id: "grave", name: "Voix grave", description: "Voix plus profonde", color: "#9b59b6" },
    { id: "aiguë", name: "Voix aiguë", description: "Voix plus haute", color: "#e67e22" },
    { id: "alien", name: "Alien", description: "Effet extraterrestre", color: "#3498db" },
    { id: "anonyme", name: "Anonyme", description: "Voix méconnaissable", color: "#e74c3c" }
  ];
  
  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      setAuthToken(token);
      
      // Récupérer les infos de l'utilisateur
      const fetchUserData = async () => {
        try {
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:5000' 
            : window.location.origin);
          
          const { data } = await axios.get(`${apiBaseUrl}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          setAuthUser(data.user);
        } catch (error) {
          console.error("Erreur lors de la récupération des données utilisateur:", error);
        }
      };
      
      fetchUserData();
    }
  }, []);

  // Charger les masques disponibles
  const fetchAvailableMasks = async () => {
    try {
      const token = localStorage.getItem("token");
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin);
      
      const { data } = await axios.get(`${apiBaseUrl}/api/users/masks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAvailableMasks(data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des masques:", error);
    }
  };

  // Vérifier si le destinataire existe au chargement initial ou avec un paramètre d'URL
  useEffect(() => {
    if (recipientLink && recipientLink.trim() !== "") {
      setFormData(prev => ({ ...prev, recipientLink: `@${recipientLink}` }));
      checkUserExists(`@${recipientLink}`);
    }
  }, [recipientLink]);

  // Passer automatiquement à l'étape 2 si un destinataire est trouvé et qu'on est sur l'étape 1
  useEffect(() => {
    if (recipient && step === 1 && recipientLink) {
      setStep(2);
    }
  }, [recipient, step, recipientLink]);
  
  // Recherche avec debounce quand l'utilisateur tape
  useEffect(() => {
    // Annuler la recherche précédente
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    const input = formData.recipientLink.trim();
    
    // Réinitialiser le recipient si le champ est vide
    if (!input) {
      setRecipient(null);
      return;
    }
    
    // Attendre un court délai avant de lancer la recherche
    searchTimeoutRef.current = setTimeout(() => {
      // Ne pas rechercher de destinataire trop court
      if (input.length >= 2) {
        checkUserExists(input);
      }
    }, 500); // 500ms de délai
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [formData.recipientLink]);
  
  const checkUserExists = async (linkToCheck) => {
    const link = linkToCheck || formData.recipientLink;
    
    if (!link || link.length < 2) {
      setRecipient(null);
      setSearchResults([]);
      return;
    }
    
    setCheckingUser(true);
    
    try {
      // Traitement du format du lien
      let processedLink = link;
      
      // Corriger le format du lien s'il est au format URL
      if (processedLink.includes('http')) {
        // Extraire l'identifiant unique de l'URL
        try {
          const url = new URL(processedLink);
          const pathname = url.pathname;
          
          // Différents formats possibles
          if (pathname.startsWith('/@')) {
            // Format /@id
            processedLink = pathname.substring(2);
          } else if (pathname.startsWith('/')) {
            // Format /id
            processedLink = pathname.substring(1);
          }
          
          // Si l'URL contient mystik.app@id (format incorrect)
          if (url.hostname.includes('@')) {
            const segments = url.hostname.split('@');
            if (segments.length > 1) {
              processedLink = segments[segments.length - 1];
            }
          }
        } catch (error) {
          console.error("Format d'URL invalide:", processedLink);
        }
      }
      
      // Supprimer @ si présent pour la recherche
      if (processedLink.startsWith("@")) {
        processedLink = processedLink.substring(1);
      }
      
      // Utiliser l'origine de la fenêtre au lieu d'une URL codée en dur
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin);
      
      // Recherche partielle d'utilisateurs
      const searchQuery = processedLink.toLowerCase();
      const { data } = await axios.get(`${apiBaseUrl}/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (data && data.length > 0) {
        // Stocker tous les résultats de recherche
        setSearchResults(data);
        
        // Trouver l'utilisateur exact ou le premier qui correspond partiellement
        const exactMatch = data.find(user => 
          user.uniqueLink.substring(1).toLowerCase() === searchQuery ||
          user.username.toLowerCase() === searchQuery
        );
        
        const userToUse = exactMatch || data[0];
        
        // Récupérer les informations de base du profil
        const profileResponse = await axios.get(`${apiBaseUrl}/api/users/public/${userToUse.uniqueLink}`);
        setRecipient(profileResponse.data);
      } else {
        setRecipient(null);
        setSearchResults([]);
        // Ne pas afficher d'erreur pour chaque frappe
        if (!checkingUser) {
          toast.error(`Aucun utilisateur trouvé correspondant à : ${searchQuery}`);
        }
      }
    } catch (error) {
      console.error("Erreur lors de la recherche d'utilisateur:", error);
      setRecipient(null);
      setSearchResults([]);
      if (!checkingUser) {
        toast.error("Erreur lors de la recherche. Veuillez réessayer.");
      }
    } finally {
      setCheckingUser(false);
    }
  };
  
  const selectUser = (user) => {
    router.push(`/send?to=${user.uniqueLink.replace('@', '')}`);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Mettre à jour le compteur de caractères pour le message
    if (name === 'content') {
      setCharCount(value.length);
    }
  };
  
  const handleEmojiSelect = (emoji) => {
    setFormData({
      ...formData,
      emoji: formData.emoji === emoji ? "" : emoji
    });
  };
  
  const handleEmotionalFilterSelect = (filterId) => {
    setFormData({
      ...formData,
      emotionalFilter: filterId
    });
  };
  
  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Vérifier si le formulaire est valide
    if (!validateStep2()) {
      return;
    }
    
    // Nettoyer les effets audio avant la soumission
    cleanupAudioEffects();
    
    setIsLoading(true);
    
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin);
      
      // Vérifier si nous avons un message vocal
      if (formData.voiceMessage) {
        // Utiliser FormData pour l'envoi avec un fichier audio
        const messageData = new FormData();
        
        // Ajouter les données de base
        messageData.append('recipientLink', recipient.uniqueLink);
        messageData.append('content', formData.content);
        messageData.append('emotionalFilter', formData.emotionalFilter);
        
        // Ajouter les informations cachées
        messageData.append('nickname', formData.nickname);
        messageData.append('hint', formData.hint);
        messageData.append('emoji', formData.emoji);
        
        // Ajouter la devinette
        if (formData.riddleQuestion && formData.riddleAnswer) {
          const riddle = {
            question: formData.riddleQuestion,
            answer: formData.riddleAnswer
          };
          messageData.append('riddle', JSON.stringify(riddle));
        }
        
        // Ajouter les conditions de révélation
        if (formData.revealCondition) {
          messageData.append('revealCondition', JSON.stringify(formData.revealCondition));
        }
        
        // Ajouter le message vocal
        messageData.append('voiceMessage', formData.voiceMessage);
        messageData.append('voiceFilter', formData.voiceFilter);
        
        // Ajouter le masque personnalisé s'il est sélectionné
        if (formData.customMask) {
          messageData.append('customMask', formData.customMask);
        }
        
        // Ajouter la date programmée si définie
        if (formData.scheduledDate) {
          messageData.append('scheduledDate', formData.scheduledDate);
        }
        
        // Ajouter l'authentification 
        const headers = {};
        if (isAuthenticated && sendAsAuthenticated && authToken) {
          headers.Authorization = `Bearer ${authToken}`;
          messageData.append('sendAsAuthenticated', 'true');
          if (authUser && authUser._id) {
            messageData.append('realUserId', authUser._id);
          }
        }
        
        // Afficher les données pour débogage
        console.log('URL API:', `${apiBaseUrl}/api/messages/send`);
        console.log('En-têtes:', headers);
        console.log('Envoi de FormData avec fichier audio');
        
        // Vérifier le type du fichier audio
        if (formData.voiceMessage instanceof Blob || formData.voiceMessage instanceof File) {
          console.log('Type de fichier audio:', formData.voiceMessage.type);
          console.log('Taille du fichier audio:', formData.voiceMessage.size, 'bytes');
        } else {
          console.error('Le fichier audio n\'est pas un Blob ou File valide:', typeof formData.voiceMessage);
        }
        
        // Envoyer le message - Ne pas définir Content-Type pour FormData
        // Axios le définira automatiquement avec la boundary correcte
        const response = await axios.post(`${apiBaseUrl}/api/messages/send`, messageData, {
          headers
        });
      } else {
        // Sans fichier audio, utiliser un JSON standard
        const messageData = {
          recipientLink: recipient.uniqueLink,
          content: formData.content,
          emotionalFilter: formData.emotionalFilter,
          nickname: formData.nickname || 'Anonyme',
          hint: formData.hint || null,
          emoji: formData.emoji || null
        };
        
        // Ajouter la devinette
        if (formData.riddleQuestion && formData.riddleAnswer) {
          messageData.riddle = {
            question: formData.riddleQuestion,
            answer: formData.riddleAnswer
          };
        }
        
        // Ajouter les conditions de révélation
        if (formData.revealCondition) {
          messageData.revealCondition = formData.revealCondition;
        }
        
        // Ajouter le masque personnalisé
        if (formData.customMask) {
          messageData.customMask = formData.customMask;
        }
        
        // Ajouter la date programmée
        if (formData.scheduledDate) {
          messageData.scheduledDate = formData.scheduledDate;
        }
        
        // Ajouter l'authentification
        const headers = {};
        if (isAuthenticated && sendAsAuthenticated && authToken) {
          headers.Authorization = `Bearer ${authToken}`;
          messageData.sendAsAuthenticated = true;
          if (authUser && authUser._id) {
            messageData.realUserId = authUser._id;
          }
        }
        
        // Afficher les données pour débogage
        console.log('URL API:', `${apiBaseUrl}/api/messages/send`);
        console.log('En-têtes:', headers);
        console.log('Données JSON:', messageData);
        
        // Envoyer le message
        const response = await axios.post(`${apiBaseUrl}/api/messages/send`, messageData, {
          headers
        });
      }
      
      // Afficher un message de succès
      toast.success("Message envoyé avec succès!");
      
      // Rediriger vers la page de succès avec les paramètres appropriés
      const successParams = new URLSearchParams();
      if (recipient?.username) {
        successParams.set('username', recipient.username);
        successParams.set('to', recipient.username);
      } else if (recipient?.uniqueLink) {
        const linkWithoutAt = recipient.uniqueLink.replace('@', '');
        successParams.set('username', linkWithoutAt);
        successParams.set('to', linkWithoutAt);
      }
      
      router.push(`/send/success?${successParams.toString()}`);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      
      // Afficher plus de détails sur l'erreur
      if (error.response) {
        // La requête a été faite et le serveur a répondu avec un code d'état
        // qui ne fait pas partie de la plage 2xx
        console.error('Réponse d\'erreur:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        // Afficher un message d'erreur plus spécifique
        if (error.response.data && error.response.data.msg) {
          toast.error(`Erreur: ${error.response.data.msg}`);
        } else {
          toast.error(`Erreur ${error.response.status}: ${error.response.statusText}`);
        }
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        console.error('Aucune réponse reçue:', error.request);
        toast.error("Aucune réponse du serveur. Veuillez vérifier votre connexion.");
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        console.error('Erreur de configuration:', error.message);
        toast.error(`Erreur lors de la préparation de la requête: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRevealConditionChange = (type) => {
    setFormData({
      ...formData,
      revealCondition: {
        type,
        details: {}
      }
    });
  };
  
  const handleMaskSelect = (maskUrl) => {
    setFormData({
      ...formData,
      customMask: formData.customMask === maskUrl ? "" : maskUrl
    });
  };
  
  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      scheduledDate: date
    });
  };
  
  const handleSendAsAuthenticatedToggle = () => {
    setSendAsAuthenticated(!sendAsAuthenticated);
  };
  
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm({
      ...loginForm,
      [name]: value
    });
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');
    
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin);
      
      const { data } = await axios.post(`${apiBaseUrl}/api/auth/login`, {
        phone: loginForm.phone,
        password: loginForm.password
      });
      
      if (data.token) {
        // Sauvegarder le token
        localStorage.setItem('token', data.token);
        
        // Mettre à jour l'état
        setIsAuthenticated(true);
        setAuthToken(data.token);
        setAuthUser(data.user);
        setSendAsAuthenticated(true);
        setShowLoginModal(false);
        
        toast.success("Connexion réussie!");
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      setLoginError(error.response?.data?.message || "Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm({
      ...registerForm,
      [name]: value
    });
    
    // Vérification de disponibilité du nom d'utilisateur
    if (name === 'username' && value.length >= 3) {
      checkUsernameAvailability(value);
    }
    
    // Vérification de disponibilité du numéro de téléphone
    if (name === 'phone' && value.length === 9) {
      checkPhoneAvailability(value);
    }
  };
  
  const checkUsernameAvailability = async (username) => {
    if (username.length < 3) return;
    
    setIsCheckingUsername(true);
    setUsernameAvailable(null);
    
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin);
      
      const { data } = await axios.get(`${apiBaseUrl}/api/auth/check-username/${username}`);
      setUsernameAvailable(data.available);
    } catch (error) {
      console.error("Erreur lors de la vérification du nom d'utilisateur:", error);
      setUsernameAvailable(false);
    } finally {
      setIsCheckingUsername(false);
    }
  };
  
  const checkPhoneAvailability = async (phone) => {
    if (phone.length !== 9) return;
    
    setIsCheckingPhone(true);
    setPhoneAvailable(null);
    
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin);
      
      const { data } = await axios.get(`${apiBaseUrl}/api/auth/check-phone/${phone}`);
      setPhoneAvailable(data.available);
    } catch (error) {
      console.error("Erreur lors de la vérification du numéro de téléphone:", error);
      setPhoneAvailable(false);
    } finally {
      setIsCheckingPhone(false);
    }
  };
  
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setRegisterError('');
    
    // Vérifier que les mots de passe correspondent
    if (registerForm.password !== registerForm.password2) {
      setRegisterError("Les mots de passe ne correspondent pas.");
      setIsLoading(false);
      return;
    }
    
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin);
      
      const { data } = await axios.post(`${apiBaseUrl}/api/auth/register`, {
        username: registerForm.username,
        phone: registerForm.phone,
        password: registerForm.password
      });
      
      if (data.token) {
        // Sauvegarder le token
        localStorage.setItem('token', data.token);
        
        // Mettre à jour l'état
        setIsAuthenticated(true);
        setAuthToken(data.token);
        setAuthUser(data.user);
        setSendAsAuthenticated(true);
        setShowRegisterModal(false);
        
        toast.success("Compte créé avec succès!");
      }
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      setRegisterError(error.response?.data?.message || "Erreur lors de la création du compte. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const validateStep1 = () => {
    if (!recipient) {
      toast.error("Destinataire non trouvé");
      return false;
    }
    return true;
  };
  
  const validateStep2 = () => {
    if (!formData.content.trim()) {
      toast.error("Le message ne peut pas être vide");
      return false;
    }
    if (formData.content.length < MIN_CHAR_COUNT) {
      toast.error(`Le message doit contenir au moins ${MIN_CHAR_COUNT} caractères`);
      return false;
    }
    return true;
  };
  
  const nextStep = () => {
    // Nettoyer les effets audio si on quitte l'étape d'enregistrement
    if (step === 2) {
      cleanupAudioEffects();
    }
    
    setStep(step + 1);
  };
  
  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  // Fonction pour démarrer l'enregistrement audio
  const startRecording = async () => {
    try {
      // Réinitialiser les références audio
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Déterminer les options d'enregistrement supportées
      let mimeType = '';
      const supportedTypes = [
        'audio/webm', 
        'audio/mp4', 
        'audio/ogg', 
        'audio/wav'
      ];
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          console.log(`Format d'enregistrement supporté trouvé: ${mimeType}`);
          break;
        }
      }
      
      // Demander l'accès au microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      
      // Créer le MediaRecorder avec les options optimales
      const options = mimeType ? { mimeType } : {};
      console.log("Options d'enregistrement:", options);
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      
      console.log("MediaRecorder créé avec le type:", mediaRecorderRef.current.mimeType);
      
      // Configurer la capture des données
      mediaRecorderRef.current.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          console.log("Chunk audio reçu:", event.data.size, "octets");
          audioChunksRef.current.push(event.data);
        }
      });
      
      mediaRecorderRef.current.addEventListener("stop", () => {
        // Vérifier qu'on a bien des données audio
        if (audioChunksRef.current.length === 0) {
          console.error("Aucune donnée audio enregistrée");
          toast.error("Erreur d'enregistrement audio");
          return;
        }
        
              // Déterminer le format audio supporté par le navigateur
      let mimeType = 'audio/webm';
      
      // Tester les différents formats supportés
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }
      
      console.log("Utilisation du format audio:", mimeType);
      
      // Créer le blob avec le bon type MIME
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // Vérifier que le blob n'est pas vide
        if (audioBlob.size === 0) {
          console.error("Fichier audio vide");
          toast.error("L'enregistrement audio est vide");
          return;
        }
        
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioURL(audioUrl);
        
        // Mettre à jour le formData avec le blob audio
        setFormData({
          ...formData,
          voiceMessage: audioBlob
        });
        
        console.log("Audio enregistré avec succès:", {
          size: audioBlob.size,
          type: audioBlob.type,
          duration: recordingTime
        });
        
        // Arrêter tous les tracks du stream pour libérer le microphone
        stream.getTracks().forEach(track => track.stop());
      });
      
      // Commencer l'enregistrement
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
      
      // Configurer le timer
      const intervalId = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
      setRecordingIntervalId(intervalId);
      
    } catch (error) {
      console.error("Erreur lors de l'accès au microphone:", error);
      toast.error("Impossible d'accéder au microphone");
    }
  };
  
  // Mettre en pause l'enregistrement
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        
        // Arrêter le compteur de temps
        if (recordingInterval) {
          clearInterval(recordingInterval);
        }
      } catch (error) {
        console.error("Erreur lors de la mise en pause:", error);
      }
    }
  };
  
  // Reprendre l'enregistrement
  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused && mediaRecorderRef.current.state === "paused") {
      try {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        
        // Redémarrer le compteur
        const interval = setInterval(() => {
          setRecordingTime(prevTime => prevTime + 1);
        }, 1000);
        
        setRecordingIntervalId(interval);
      } catch (error) {
        console.error("Erreur lors de la reprise:", error);
      }
    }
  };
  
  // Fonction pour arrêter l'enregistrement
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
        setIsPaused(false);
      
      // Arrêter le timer
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
      
      setRecordingTime(0);
      } catch (error) {
        console.error("Erreur lors de l'arrêt de l'enregistrement:", error);
        // Réinitialiser les états en cas d'erreur
        setIsRecording(false);
        setIsPaused(false);
        setRecordingTime(0);
        
        if (recordingInterval) {
          clearInterval(recordingInterval);
        }
        
        // Libérer les ressources audio
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop());
        }
        
        toast.error("Erreur lors de l'arrêt de l'enregistrement");
      }
    }
  };
  
    // Fonction pour charger l'audio depuis une URL avec authentification
  const loadAudioWithAuth = async (url) => {
    try {
      // Extraire l'URL de base sans le token
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
      const mimeType = contentType || 'audio/mpeg';
      const blob = new Blob([arrayBuffer], { type: mimeType });
      
      // Créer une URL objet
      const objectUrl = URL.createObjectURL(blob);
      console.log("URL objet créée:", objectUrl);
      
      return objectUrl;
    } catch (error) {
      console.error("Erreur lors du chargement de l'audio:", error);
      throw error;
    }
  };
  
  // Lire l'enregistrement audio
  const handlePlayAudio = async (e) => {
    // Empêcher la propagation et la soumission du formulaire
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (audioURL) {
      // Si le lecteur n'existe pas encore, le créer
      if (!audioPlayerRef.current) {
        try {
          let audioSrc = audioURL;
          
          // Si l'URL est une URL serveur, la charger avec authentification
          if (audioURL.includes('/api/messages/') || audioURL.includes('voice-message') || audioURL.includes('http')) {
            console.log("Chargement audio avec authentification...");
            try {
              audioSrc = await loadAudioWithAuth(audioURL);
              console.log("Audio chargé avec succès:", audioSrc);
            } catch (err) {
              console.error("Échec du chargement audio:", err);
              toast.error("Impossible de charger l'audio. Veuillez réessayer.");
              return;
            }
          }
          
          audioPlayerRef.current = new Audio(audioSrc);
        
        // Événement de fin de lecture
        audioPlayerRef.current.onended = () => {
          setIsPlaying(false);
          setAudioProgress(0);
          setCurrentAudioPosition(0);
        };
        
          // Charger la durée quand l'audio est prêt
          audioPlayerRef.current.addEventListener('loadedmetadata', () => {
            if (!isNaN(audioPlayerRef.current.duration) && isFinite(audioPlayerRef.current.duration)) {
              setAudioDuration(audioPlayerRef.current.duration);
            }
          });
          
          // Ajouter un listener pour détecter quand les données sont disponibles
          audioPlayerRef.current.addEventListener('loadeddata', () => {
            if (!isNaN(audioPlayerRef.current.duration) && isFinite(audioPlayerRef.current.duration)) {
              setAudioDuration(audioPlayerRef.current.duration);
            }
          });
          
                // Ajouter un listener pour détecter quand l'audio peut être lu
      audioPlayerRef.current.addEventListener('canplaythrough', () => {
        if (!isNaN(audioPlayerRef.current.duration) && isFinite(audioPlayerRef.current.duration)) {
          setAudioDuration(audioPlayerRef.current.duration);
        }
      });
      
      // Ajouter un listener pour suivre la progression de la lecture
      audioPlayerRef.current.addEventListener('timeupdate', () => {
        if (audioPlayerRef.current && !isNaN(audioPlayerRef.current.currentTime) && !isNaN(audioPlayerRef.current.duration)) {
          const progress = (audioPlayerRef.current.currentTime / audioPlayerRef.current.duration) * 100;
          setAudioProgress(Math.min(100, Math.max(0, progress)));
          setCurrentAudioPosition(audioPlayerRef.current.currentTime);
        }
      });
      
      // Gérer les erreurs de lecture
      audioPlayerRef.current.onerror = (e) => {
        console.error("Erreur de lecture audio:", e);
            console.error("URL audio:", audioURL);
            console.error("Code d'erreur:", audioPlayerRef.current.error?.code);
            console.error("Message d'erreur:", audioPlayerRef.current.error?.message);
        setIsPlaying(false);
            
            // Nettoyer et réinitialiser en cas d'erreur
            if (audioPlayerRef.current) {
              try {
                audioPlayerRef.current.pause();
                audioPlayerRef.current.removeAttribute('src');
                audioPlayerRef.current.load();
              } catch (cleanupError) {
                console.error("Erreur lors du nettoyage audio:", cleanupError);
              }
            }
            
            toast.error("Erreur lors de la lecture audio. Le fichier pourrait être corrompu.");
          };
          
        } catch (error) {
          console.error("Erreur lors de la création du lecteur audio:", error);
          toast.error("Impossible de charger l'audio");
          return;
        }
      }
      
      // Estimer la durée si elle n'est pas encore disponible
      if (audioBlob && audioDuration === 0) {
        // Estimation basée sur la taille du fichier (approximative)
        const estimatedDuration = recordingTime > 0 ? recordingTime : (audioBlob.size / 16000);
        setAudioDuration(estimatedDuration);
      }
      
      // Si déjà en lecture, mettre en pause
      if (isPlaying) {
        // Sauvegarder la position actuelle
        setCurrentAudioPosition(audioPlayerRef.current.currentTime);
        audioPlayerRef.current.pause();
        setIsPlaying(false);
        
        // Arrêter la mise à jour de la progression
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        
        // Suspendre l'AudioContext pour économiser les ressources
        if (audioContextRef.current) {
          audioContextRef.current.suspend();
        }
      } 
      // Sinon, démarrer la lecture
      else {
        try {
          // Reprendre l'AudioContext s'il était suspendu
          if (audioContextRef.current && audioContextRef.current.state === "suspended") {
            audioContextRef.current.resume();
          }
          
          // Si on a une position sauvegardée, reprendre depuis cette position
          if (currentAudioPosition > 0) {
            audioPlayerRef.current.currentTime = currentAudioPosition;
          }
          
          // Démarrer la lecture
          audioPlayerRef.current.play()
            .catch(error => console.error("Erreur lors de la lecture:", error));
          setIsPlaying(true);
          
          // Mettre à jour la progression
          progressIntervalRef.current = setInterval(() => {
            if (audioPlayerRef.current) {
              const currentTime = audioPlayerRef.current.currentTime || 0;
              const duration = audioPlayerRef.current.duration || audioDuration || 1;
              
              // Calculer le pourcentage de progression
              const progress = (currentTime / duration) * 100;
              setAudioProgress(Math.min(100, Math.max(0, progress))); // Limiter entre 0 et 100
            }
          }, 100);
        } catch (error) {
          console.error("Erreur lors de la lecture:", error);
          toast.error("Impossible de lire l'enregistrement");
        }
      }
    }
  };
  
  // Fonction pour supprimer l'enregistrement
  const deleteRecording = (e) => {
    // Empêcher la propagation et la soumission du formulaire
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Arrêter la lecture si en cours
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    
    // Nettoyer les effets audio
    cleanupAudioEffects();
    
    // Réinitialiser les états liés à l'audio
      setAudioURL(null);
      setAudioBlob(null);
    setIsRecording(false);
    setIsPlaying(false);
    setAudioProgress(0);
    setAudioDuration(0);
    setRecordingTime(0);
    setCurrentAudioPosition(0);
    
    // Réinitialiser l'état du formulaire pour l'audio
      setFormData({
        ...formData,
      voiceMessage: null,
      voiceFilter: 'normal'
    });
    
    // Nettoyer le MediaRecorder
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    
    // Fermer les flux média
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    
    // Nettoyer le lecteur audio
    if (audioPlayerRef.current) {
      audioPlayerRef.current.removeAttribute('src');
      audioPlayerRef.current.load();
      audioPlayerRef.current = null;
    }
  };
  
  // Fonction pour formater le temps d'enregistrement (MM:SS)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Fonction pour créer un aperçu audio avec effet
  const createAudioPreview = async (filterId) => {
    if (!audioBlob) return;
    
    try {
      // Créer un nouvel AudioContext pour l'aperçu
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const previewContext = new AudioContext();
      
      // Convertir le blob en ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Décoder les données audio
      const audioBuffer = await previewContext.decodeAudioData(arrayBuffer);
      
      // Créer une source buffer
      const source = previewContext.createBufferSource();
      source.buffer = audioBuffer;
      
      let finalDestination = previewContext.destination;
      
             // Appliquer les effets selon le filtre
       switch (filterId) {
         case "robot":
           // Effet robot subtil avec bitcrushing simulé
           const robotFilter = previewContext.createBiquadFilter();
           const robotGain = previewContext.createGain();
           const robotCompressor = previewContext.createDynamicsCompressor();
           
           robotFilter.type = 'bandpass';
           robotFilter.frequency.setValueAtTime(1200, previewContext.currentTime);
           robotFilter.Q.setValueAtTime(3, previewContext.currentTime);
           
           robotCompressor.threshold.setValueAtTime(-20, previewContext.currentTime);
           robotCompressor.knee.setValueAtTime(10, previewContext.currentTime);
           robotCompressor.ratio.setValueAtTime(8, previewContext.currentTime);
           robotCompressor.attack.setValueAtTime(0.001, previewContext.currentTime);
           robotCompressor.release.setValueAtTime(0.05, previewContext.currentTime);
           
           robotGain.gain.setValueAtTime(0.8, previewContext.currentTime);
           
           source.connect(robotFilter);
           robotFilter.connect(robotCompressor);
           robotCompressor.connect(robotGain);
           robotGain.connect(finalDestination);
           break;
           
         case "grave":
           // Effet voix grave plus prononcé
           const graveFilter = previewContext.createBiquadFilter();
           const graveBass = previewContext.createBiquadFilter();
           const graveGain = previewContext.createGain();
           
           graveFilter.type = "lowpass";
           graveFilter.frequency.setValueAtTime(600, previewContext.currentTime);
           graveFilter.Q.setValueAtTime(1.5, previewContext.currentTime);
           
           graveBass.type = "lowshelf";
           graveBass.frequency.setValueAtTime(150, previewContext.currentTime);
           graveBass.gain.setValueAtTime(15, previewContext.currentTime);
           
           graveGain.gain.setValueAtTime(1.2, previewContext.currentTime);
           
           source.connect(graveFilter);
           graveFilter.connect(graveBass);
           graveBass.connect(graveGain);
           graveGain.connect(finalDestination);
           break;
           
         case "aiguë":
           // Effet voix aiguë plus marqué
           const aigueFilter = previewContext.createBiquadFilter();
           const aigueTreble = previewContext.createBiquadFilter();
           const aigueGain = previewContext.createGain();
           
           aigueFilter.type = "highpass";
           aigueFilter.frequency.setValueAtTime(600, previewContext.currentTime);
           aigueFilter.Q.setValueAtTime(1.2, previewContext.currentTime);
           
           aigueTreble.type = "highshelf";
           aigueTreble.frequency.setValueAtTime(3000, previewContext.currentTime);
           aigueTreble.gain.setValueAtTime(12, previewContext.currentTime);
           
           aigueGain.gain.setValueAtTime(1.1, previewContext.currentTime);
           
           source.connect(aigueFilter);
           aigueFilter.connect(aigueTreble);
           aigueTreble.connect(aigueGain);
           aigueGain.connect(finalDestination);
           break;
           
         case "alien":
           // Effet alien avec chorus et reverb
           const alienDelay = previewContext.createDelay();
           const alienFeedback = previewContext.createGain();
           const alienFilter = previewContext.createBiquadFilter();
           const alienGain = previewContext.createGain();
           
           alienDelay.delayTime.setValueAtTime(0.08, previewContext.currentTime);
           alienFeedback.gain.setValueAtTime(0.4, previewContext.currentTime);
           
           alienFilter.type = 'bandpass';
           alienFilter.frequency.setValueAtTime(2000, previewContext.currentTime);
           alienFilter.Q.setValueAtTime(8, previewContext.currentTime);
           
           alienGain.gain.setValueAtTime(0.7, previewContext.currentTime);
           
           source.connect(alienFilter);
           source.connect(alienDelay);
           alienDelay.connect(alienFeedback);
           alienFeedback.connect(alienDelay);
           alienDelay.connect(alienGain);
           alienFilter.connect(alienGain);
           alienGain.connect(finalDestination);
           break;
           
         case "anonyme":
           // Effet anonyme avec pitch shifting simulé et distortion légère
           const anonymeFilter1 = previewContext.createBiquadFilter();
           const anonymeFilter2 = previewContext.createBiquadFilter();
           const anonymeGain = previewContext.createGain();
           const anonymeCompressor = previewContext.createDynamicsCompressor();
           
           anonymeFilter1.type = 'bandpass';
           anonymeFilter1.frequency.setValueAtTime(800, previewContext.currentTime);
           anonymeFilter1.Q.setValueAtTime(4, previewContext.currentTime);
           
           anonymeFilter2.type = 'notch';
           anonymeFilter2.frequency.setValueAtTime(1600, previewContext.currentTime);
           anonymeFilter2.Q.setValueAtTime(2, previewContext.currentTime);
           
           anonymeCompressor.threshold.setValueAtTime(-15, previewContext.currentTime);
           anonymeCompressor.ratio.setValueAtTime(12, previewContext.currentTime);
           anonymeCompressor.attack.setValueAtTime(0.002, previewContext.currentTime);
           anonymeCompressor.release.setValueAtTime(0.1, previewContext.currentTime);
           
           anonymeGain.gain.setValueAtTime(0.9, previewContext.currentTime);
           
           source.connect(anonymeFilter1);
           anonymeFilter1.connect(anonymeFilter2);
           anonymeFilter2.connect(anonymeCompressor);
           anonymeCompressor.connect(anonymeGain);
           anonymeGain.connect(finalDestination);
           break;
           
         default:
           // Effet normal - pas de traitement
           source.connect(finalDestination);
           break;
       }
      
      // Jouer un aperçu de 3 secondes maximum
      const duration = Math.min(audioBuffer.duration, 3);
      source.start(0, 0, duration);
      
      // Nettoyer après la lecture
      setTimeout(() => {
        try {
          previewContext.close();
        } catch (e) {
          console.log("Contexte audio déjà fermé");
        }
      }, duration * 1000 + 100);
      
      } catch (error) {
      console.error("Erreur lors de la création de l'aperçu audio:", error);
      toast.error("Impossible de créer l'aperçu audio");
    }
  };

  // Fonction pour appliquer un filtre vocal à l'audio
  const applyVoiceFilter = (filterId, e) => {
    // Empêcher la propagation et la soumission du formulaire
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Mettre à jour l'état du formulaire avec le nouveau filtre
    setFormData({
      ...formData,
      voiceFilter: filterId
    });
    
    // Créer un aperçu audio avec l'effet sélectionné
    if (audioBlob && filterId !== 'normal') {
      createAudioPreview(filterId);
    }
  };
  
  // Fonction pour nettoyer tous les effets audio
  const cleanupAudioEffects = () => {
    try {
      // Arrêter la lecture si elle est en cours
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
      }
      
      // Arrêter l'intervalle de progression
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      // Nettoyer les effets spécifiques avec des intervalles
      if (audioEffectsRef.current) {
        // Nettoyer les intervalles d'animation
        if (audioEffectsRef.current.stereoPanInterval) {
          clearInterval(audioEffectsRef.current.stereoPanInterval);
        }
        if (audioEffectsRef.current.alienFreqInterval) {
          clearInterval(audioEffectsRef.current.alienFreqInterval);
        }
        if (audioEffectsRef.current.formantInterval) {
          clearInterval(audioEffectsRef.current.formantInterval);
        }
        
        // Déconnecter la source des effets
        if (audioSourceRef.current) {
          try {
            audioSourceRef.current.disconnect();
          } catch (e) {
            console.log("Source déjà déconnectée");
          }
        }
        
        // Déconnecter tous les effets existants
        Object.values(audioEffectsRef.current).forEach(effect => {
          if (effect && typeof effect !== 'number' && effect.disconnect) {
            try {
              effect.disconnect();
            } catch (e) {
              console.log("Effet déjà déconnecté");
            }
          }
        });
        
        // Réinitialiser les références des effets
        audioEffectsRef.current = {};
      }
      
      // Fermer le contexte audio pour libérer les ressources
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
          audioContextRef.current = null;
        } catch (e) {
          console.log("Contexte audio déjà fermé");
        }
      }
    } catch (error) {
      console.error("Erreur lors du nettoyage des effets audio:", error);
    }
  };
  
  // Mettre à jour la progression de l'audio manuellement (pour le slider)
  const updateAudioProgress = (newProgress) => {
    if (!isNaN(newProgress) && audioPlayerRef.current) {
      // Calculer le nouveau temps basé sur le pourcentage
      const newTime = (newProgress / 100) * (audioPlayerRef.current.duration || audioDuration);
      
      // Mettre à jour la position de lecture
      if (!isNaN(newTime) && isFinite(newTime)) {
        audioPlayerRef.current.currentTime = newTime;
        setCurrentAudioPosition(newTime);
      }
      
      // Mettre à jour l'affichage de la progression
      if (!isNaN(newTime) && !isNaN(audioDuration) && isFinite(audioDuration) && audioDuration > 0) {
        const progress = (newTime / audioDuration) * 100;
        setAudioProgress(Math.min(100, Math.max(0, progress))); // Limiter entre 0 et 100
      } else {
            setAudioProgress(newProgress); // Utiliser directement le pourcentage fourni
      }
    }
  };
  
  // Configurer le contexte audio et appliquer les effets
  const setupAudioContext = (filterId, callback) => {
    try {
      // Nettoyer les effets précédents
      if (audioEffectsRef.current) {
        // Arrêter les intervalles d'animation des effets
        if (audioEffectsRef.current.stereoPanInterval) {
          clearInterval(audioEffectsRef.current.stereoPanInterval);
        }
        if (audioEffectsRef.current.alienFreqInterval) {
          clearInterval(audioEffectsRef.current.alienFreqInterval);
        }
        if (audioEffectsRef.current.formantInterval) {
          clearInterval(audioEffectsRef.current.formantInterval);
        }
        
        // Arrêter les oscillateurs
        Object.values(audioEffectsRef.current).forEach(effect => {
          if (effect && typeof effect.stop === 'function') {
            try {
              effect.stop();
            } catch (e) {
              // Ignorer les erreurs de nœuds déjà arrêtés
            }
          }
        });
        
        audioEffectsRef.current = {};
      }
      
      // Déconnecter la source précédente si elle existe
      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.disconnect();
        } catch (e) {
          console.log("Source déjà déconnectée");
        }
        audioSourceRef.current = null;
      }
      
      // Fermer l'AudioContext précédent s'il existe
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
          audioContextRef.current = null;
        } catch (error) {
          console.error("Erreur lors de la fermeture de l'AudioContext:", error);
        }
      }
      
      // Si pas d'URL audio, sortir
      if (!audioURL || !audioPlayerRef.current) {
        if (callback) callback();
        return;
      }
      
      // Créer un nouveau contexte audio
      try {
        // Créer un nouveau contexte audio
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
        
        // Créer la source audio seulement si elle n'existe pas encore
        if (audioPlayerRef.current && !audioSourceRef.current) {
          try {
            audioSourceRef.current = audioContextRef.current.createMediaElementSource(audioPlayerRef.current);
          } catch (error) {
            console.error("Erreur lors de la création de la source audio:", error);
            // Si l'élément est déjà connecté, ignorer l'erreur et continuer
            if (error.name === 'InvalidStateError') {
              console.log("L'élément audio est déjà connecté, utilisation de la connexion directe");
              if (callback) callback();
              return;
            } else {
            // Utiliser une connexion directe en cas d'erreur
            if (callback) callback();
            return;
            }
          }
        }
        
        // Appliquer le filtre sélectionné
        switch (filterId) {
          case "robot":
            // Effet robot: oscillateur + distortion
            try {
              const oscillator = audioContextRef.current.createOscillator();
              const gain = audioContextRef.current.createGain();
              const distortion = audioContextRef.current.createWaveShaper();
              
              // Configurer l'oscillateur
              oscillator.frequency.setValueAtTime(40, audioContextRef.current.currentTime);
              
              // Fonction de distortion
              const n_samples = audioContextRef.current.sampleRate;
              const curve = new Float32Array(n_samples);
              const deg = Math.PI / 90;
              
              for (let i = 0; i < n_samples; i++) {
                const x = i * 2 / n_samples - 1;
                curve[i] = (3 + 10) * x * 20 * deg / (Math.PI + 10 * Math.abs(x));
              }
              
              distortion.curve = curve;
              distortion.oversample = '4x';
              
              // Connecter les nœuds
              audioSourceRef.current.connect(distortion);
              audioSourceRef.current.connect(gain);
              oscillator.connect(gain);
              distortion.connect(audioContextRef.current.destination);
              gain.connect(audioContextRef.current.destination);
              
              // Démarrer l'oscillateur
              oscillator.start();
              
              // Stocker les références pour nettoyage
              audioEffectsRef.current = {
                oscillator,
                gain,
                distortion
              };
            } catch (error) {
              console.error("Erreur lors de l'application de l'effet robot:", error);
              audioSourceRef.current.connect(audioContextRef.current.destination);
            }
            break;
            
          case "grave":
            // Effet voix grave: filtre passe-bas + distortion + delay
            try {
              const lowPassFilter = audioContextRef.current.createBiquadFilter();
              lowPassFilter.type = "lowpass";
              lowPassFilter.frequency.value = 500;
              lowPassFilter.Q.value = 0.5;
              
              const bassBoost = audioContextRef.current.createBiquadFilter();
              bassBoost.type = "lowshelf";
              bassBoost.frequency.value = 200;
              bassBoost.gain.value = 15;
              
              const graveDistortion = audioContextRef.current.createWaveShaper();
              
              const samples = audioContextRef.current.sampleRate;
              const graveCurve = new Float32Array(samples);
              const graveDeg = Math.PI / 180;
              
              for (let i = 0; i < samples; i++) {
                const x = i * 2 / samples - 1;
                graveCurve[i] = (3 + 5) * x * 10 * graveDeg / (Math.PI + 5 * Math.abs(x));
              }
              
              graveDistortion.curve = graveCurve;
              graveDistortion.oversample = '4x';
              
              // Ajouter un delay pour l'effet de profondeur
              const graveDelay = audioContextRef.current.createDelay();
              graveDelay.delayTime.value = 0.03;
              
              const feedbackGain = audioContextRef.current.createGain();
              feedbackGain.gain.value = 0.3;
              
              // Connecter les nœuds
              audioSourceRef.current.connect(lowPassFilter);
              lowPassFilter.connect(bassBoost);
              bassBoost.connect(graveDistortion);
              bassBoost.connect(graveDelay);
              graveDelay.connect(feedbackGain);
              feedbackGain.connect(graveDelay);
              
              graveDistortion.connect(audioContextRef.current.destination);
              graveDelay.connect(audioContextRef.current.destination);
              feedbackGain.connect(audioContextRef.current.destination);
              
              // Stocker les références pour nettoyage
              audioEffectsRef.current = {
                lowPassFilter,
                bassBoost,
                graveDistortion,
                graveDelay,
                feedbackGain
              };
            } catch (error) {
              console.error("Erreur lors de l'application de l'effet grave:", error);
              audioSourceRef.current.connect(audioContextRef.current.destination);
            }
            break;
            
          default:
            // Pas d'effet (normal)
            audioSourceRef.current.connect(audioContextRef.current.destination);
            break;
        }
      } catch (error) {
        console.error("Erreur lors de la configuration audio:", error);
      }
    } catch (error) {
      console.error("Erreur globale dans setupAudioContext:", error);
    }
    
    if (callback) callback();
  };
  
  // Rendu du composant SendMessageContent
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card p-8 w-full max-w-md"
        >
          <div className="flex items-center justify-center mb-8 relative">
            <Link href="/" className="absolute left-0 top-0 text-gray-light hover:text-white">
              <FaArrowLeft />
            </Link>
            <Image 
              src="/logo.svg" 
              alt="Mystik Logo" 
              width={60} 
              height={60}
              className="object-contain"
            />
          </div>
          
          <form onSubmit={handleSubmit}>
            {/* Étape 1: Trouver le destinataire */}
            {step === 1 && (
              <div>
                <h1 className="text-2xl font-bold text-center mb-6">
                  À qui veux-tu envoyer un message?
                </h1>
                
                <div className="mb-6">
                  <label className="block text-gray-light mb-2">
                    Lien ou identifiant du destinataire
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="recipientLink"
                      value={formData.recipientLink}
                      onChange={handleChange}
                      className="input w-full pl-8"
                      placeholder="@identifiant"
                    />
                    <FaUser className="absolute left-3 top-3 text-gray-light" />
                    {checkingUser && (
                      <div className="absolute right-3 top-3">
                        <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-light mt-2">
                    Entre le lien complet ou juste le nom de la personne
                  </p>

                  {/* Résultats de recherche */}
                  {searchResults.length > 0 && (
                    <div className="mt-3 border border-gray-800 rounded-lg overflow-hidden">
                      <div className="text-xs text-gray-light px-3 py-2 bg-gray-800">
                        Résultats de recherche ({searchResults.length})
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {searchResults.map((user) => (
                          <div 
                            key={user._id || user.uniqueLink}
                            onClick={() => selectUser(user)}
                            className="p-3 flex items-center border-t border-gray-800 hover:bg-gray-800/50 cursor-pointer transition"
                          >
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mr-3">
                              {user.profileImage ? (
                                <Image 
                                  src={user.profileImage} 
                                  alt="Photo de profil" 
                                  width={32} 
                                  height={32}
                                  className="rounded-full object-cover"
                                />
                              ) : (
                                <FaUser className="text-gray-light" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{user.username || "Utilisateur"}</div>
                              <div className="text-xs text-gray-light">{user.uniqueLink}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  disabled={checkingUser || !recipient}
                  className="btn-primary w-full"
                >
                  {checkingUser ? "Recherche..." : "Continuer"}
                </button>
              </div>
            )}
            
            {/* Étape 2: Écrire le message */}
            {step === 2 && (
              <div>
                <h1 className="text-2xl font-bold text-center mb-6">
                  {recipient ? (
                    <>Écris ton message anonyme à <span className="text-primary">{recipient.username || recipient.uniqueLink}</span></>
                  ) : (
                    <>Écris ton message anonyme</>
                  )}
                </h1>
                
                <div className="mb-6">
                  <label className="block text-gray-light mb-2">
                    {recipient ? (
                      <>Ton message à {recipient.username || recipient.uniqueLink.replace('@', '')}</>
                    ) : (
                      <>Ton message à anonyme</>
                    )}
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    className="input w-full h-32"
                    placeholder="Écris ton message ici..."
                  ></textarea>
                  <div className="flex justify-between mt-1 text-xs">
                    <span className={`${charCount < MIN_CHAR_COUNT ? 'text-red-500' : 'text-gray-light'}`}>
                      {charCount}/{MIN_CHAR_COUNT} caractères minimum
                    </span>
                    <span className="text-gray-light">{charCount} caractères</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-light mb-2 font-medium">
                    Ton humeur
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {emotionalFilters.map(filter => (
                      <motion.button
                        key={filter.id}
                        type="button"
                        onClick={() => handleEmotionalFilterSelect(filter.id)}
                        className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all duration-300 shadow-md ${
                          formData.emotionalFilter === filter.id
                            ? `border-2 border-${filter.id === 'neutre' ? 'gray-300' : filter.color} shadow-lg`
                            : 'border border-gray-800 hover:border-gray-600'
                        }`}
                        style={{ 
                          backgroundColor: formData.emotionalFilter === filter.id ? filter.bgColor : 'rgba(30, 30, 30, 0.4)',
                        }}
                        whileHover={{ 
                          scale: 1.05,
                          boxShadow: `0 0 8px ${filter.color}60`
                        }}
                        animate={
                          formData.emotionalFilter === filter.id 
                            ? { 
                                y: [0, -5, 0],
                                transition: { 
                                  repeat: Infinity, 
                                  repeatType: "mirror",
                                  duration: filter.id === 'colère' ? 0.3 : 
                                           filter.id === 'joie' ? 0.8 : 
                                           filter.id === 'tristesse' ? 2 : 1.5
                                } 
                              } 
                            : {}
                        }
                      >
                        <motion.div 
                          className="text-2xl mb-1"
                          animate={
                            formData.emotionalFilter === filter.id 
                              ? { 
                                  scale: [1, 1.2, 1],
                                  rotate: filter.id === 'colère' ? [-2, 2, -2] : 
                                          filter.id === 'joie' ? [-5, 0, 5, 0] : 0,
                                  transition: { 
                                    repeat: Infinity, 
                                    repeatType: "mirror", 
                                    duration: filter.id === 'colère' ? 0.3 : 
                                             filter.id === 'joie' ? 0.8 : 
                                             filter.id === 'tristesse' ? 2 : 1.5 
                                  } 
                                } 
                              : {}
                          }
                      >
                          {filter.emoji}
                        </motion.div>
                        <span className="font-medium" style={{ color: filter.color }}>
                        {filter.name}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                {/* Message programmé */}
                <div className="mb-6">
                  <label className="block text-gray-light mb-2 font-medium flex items-center">
                    <svg className="w-5 h-5 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    Planifier l'envoi (optionnel)
                        </label>
                  <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                        <input
                          type="datetime-local"
                          name="scheduledDate"
                          value={formData.scheduledDate}
                          onChange={(e) => handleDateChange(e.target.value)}
                      className="input w-full bg-gray-900"
                        />
                    <p className="text-xs text-gray-light mt-2">
                      Laisse vide pour un envoi immédiat ou choisis une date future
                        </p>
                      </div>
                </div>
                
                {/* Bouton d'enregistrement vocal */}
                <div className="mb-6">
                  <label className="block text-gray-light mb-2 font-medium flex items-center">
                    <FaMicrophone className="mr-2 text-primary" />
                    Message vocal (optionnel)
                  </label>
                  
                  {!audioURL && !isRecording && (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="btn-primary w-full flex items-center justify-center"
                    >
                      <FaMicrophone className="mr-2" />
                      Enregistrer un message vocal
                    </button>
                  )}
                  
                  {/* Interface d'enregistrement en cours */}
                  {isRecording && (
                    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-red-500 animate-pulse"></div>
                        </div>
                      </div>
                      
                      <div className="text-center mb-4">
                        <div className="text-2xl font-mono">{formatTime(recordingTime)}</div>
                        <p className="text-xs text-gray-light">Enregistrement en cours...</p>
                      </div>
                      
                      <div className="flex justify-center space-x-4">
                        {!isPaused ? (
                          <button
                            type="button"
                            onClick={pauseRecording}
                            className="btn-warning flex items-center"
                          >
                            <FaPause className="mr-2" />
                            Pause
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={resumeRecording}
                            className="btn-primary flex items-center"
                          >
                            <FaPlay className="mr-2" />
                            Reprendre
                          </button>
                        )}
                        
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="btn-danger flex items-center"
                        >
                          <FaStop className="mr-2" />
                          Terminer
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Interface de lecture audio */}
                  {audioURL && !isRecording && (
                    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <h3 className="font-medium mb-3 flex items-center">
                        <FaVolumeUp className="mr-2 text-primary" />
                        Message vocal enregistré
                      </h3>
                      
                      <div className="mb-4">
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${audioProgress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-gray-light">
                          <span>{formatTime(audioDuration * audioProgress / 100)}</span>
                          <span>{formatTime(audioDuration)}</span>
                        </div>
                      </div>
                      
                                              <div className="mb-4">
                          <h4 className="text-sm text-gray-light mb-2">Filtres vocaux</h4>
                          <p className="text-xs text-gray-light mb-3">
                            Cliquez sur un filtre pour entendre un aperçu de 3 secondes
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {voiceFilters.map((filter) => (
                              <button
                                key={filter.id}
                                type="button"
                                onClick={(e) => applyVoiceFilter(filter.id, e)}
                                className={`p-3 rounded-lg transition-all relative overflow-hidden ${
                                  formData.voiceFilter === filter.id 
                                    ? 'ring-2 ring-primary bg-gray-700 shadow-lg' 
                                    : 'bg-gray-800 hover:bg-gray-700 hover:shadow-md'
                                }`}
                                style={{ 
                                  borderLeft: formData.voiceFilter === filter.id ? `4px solid ${filter.color}` : 'none'
                                }}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="font-medium text-sm">{filter.name}</div>
                                  {formData.voiceFilter === filter.id && (
                                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                  )}
                                </div>
                                <div className="text-xs text-gray-light text-left">{filter.description}</div>
                                
                                {/* Indicateur visuel pour l'effet */}
                                <div className="mt-2 flex items-center justify-center">
                                  {filter.id === 'robot' && <span className="text-lg">🤖</span>}
                                  {filter.id === 'grave' && <span className="text-lg">🐻</span>}
                                  {filter.id === 'aiguë' && <span className="text-lg">🐭</span>}
                                  {filter.id === 'alien' && <span className="text-lg">👽</span>}
                                  {filter.id === 'anonyme' && <span className="text-lg">🥷</span>}
                                  {filter.id === 'normal' && <span className="text-lg">😊</span>}
                                </div>
                                
                                {/* Animation de lecture */}
                                {formData.voiceFilter === filter.id && (
                                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 animate-pulse"></div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      
                      <div className="flex justify-center space-x-4">
                        <button
                          type="button"
                          onClick={handlePlayAudio}
                          className="btn-primary flex items-center"
                        >
                          {isPlaying ? (
                            <>
                              <FaPause className="mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <FaPlay className="mr-2" />
                              Écouter
                            </>
                          )}
                        </button>
                        
                        <button
                          type="button"
                          onClick={deleteRecording}
                          className="btn-danger flex items-center"
                        >
                          <FaTrash className="mr-2" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="btn-secondary w-1/2"
                  >
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="btn-primary w-1/2"
                  >
                    Continuer
                  </button>
                </div>
              </div>
            )}
            
            {/* Étape 3: Ajouter des indices */}
            {step === 3 && (
              <div>
                <h1 className="text-2xl font-bold text-center mb-6">
                  Laisse des indices et options
                </h1>
                
                {/* Option d'envoi via compte */}
                {isAuthenticated && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg shadow-lg">
                    <h2 className="text-lg font-medium mb-2 text-white flex items-center">
                      <span className="mr-2 text-xl">🔐</span> Envoyer en tant qu'utilisateur connecté
                    </h2>
                    
                    <p className="text-sm text-gray-200 mb-3">
                      Si tu choisis cette option, ton identité pourra être découverte par le destinataire
                      (via des clés, des devinettes ou des défis). Il saura que c'est toi, {authUser?.username || "utilisateur"} !
                    </p>
                    
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={sendAsAuthenticated}
                          onChange={() => {
                            toast("Fonctionnalité à venir");
                            // Commenté pour désactiver temporairement la fonctionnalité
                            // handleSendAsAuthenticatedToggle();
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                        <span className="ml-3 text-sm font-medium text-white">
                          {sendAsAuthenticated 
                            ? "Être identifiable" 
                            : "Rester totalement anonyme"}
                        </span>
                      </label>
                    </div>
                  </div>
                )}
                
                {!isAuthenticated && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-indigo-900 to-purple-900 rounded-lg border border-gray-700 shadow-xl">
                    <div className="flex items-start">
                      <div className="text-2xl mr-3">🔐</div>
                      <div className="flex-1">
                        <h3 className="font-medium mb-2">Identité vérifiable</h3>
                        <p className="text-sm text-gray-300 mb-4">
                          Connecte-toi ou crée un compte pour que ton identité puisse être révélée au destinataire.
                          Il pourra découvrir qui tu es en utilisant des clés ou en jouant à "Devine qui c'est".
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={() => setShowLoginModal(true)}
                            className="btn-primary py-2 px-4 flex-1 flex items-center justify-center"
                          >
                            <FaSignInAlt className="mr-2" />
                            Se connecter
                          </button>
                          
                          <button
                            onClick={() => setShowRegisterModal(true)}
                            className="btn-secondary py-2 px-4 flex-1 flex items-center justify-center"
                          >
                            <FaUserPlus className="mr-2" />
                            Créer un compte
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mb-4 p-4 bg-gray-900 rounded-lg">
                  <h2 className="text-lg font-bold text-center mb-3">Informations à découvrir</h2>
                  <p className="text-sm text-gray-light mb-4">
                    Ces informations seront cachées au destinataire. Il pourra les découvrir uniquement 
                    en jouant à des jeux, en répondant à des devinettes ou en utilisant des clés de révélation.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-light mb-2 text-sm">
                        Ton surnom (caché)
                      </label>
                      <input
                        type="text"
                        name="nickname"
                        value={formData.nickname}
                        onChange={handleChange}
                        className="input w-full"
                        placeholder="Laisse un surnom pour être reconnu..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-light mb-2 text-sm">
                        Un indice (caché)
                      </label>
                      <input
                        type="text"
                        name="hint"
                        value={formData.hint}
                        onChange={handleChange}
                        className="input w-full"
                        placeholder="Un indice sur qui tu es..."
                      />
                      <p className="text-xs text-gray-light mt-1">
                        Exemple : ton sport préféré, ta ville, ton film favori, etc.
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-gray-light mb-2 text-sm">
                        Emoji représentatif (caché)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          name="emoji"
                          value={formData.emoji}
                          onChange={handleChange}
                          className="input w-full"
                          placeholder="Un emoji qui te représente"
                          maxLength={2}
                        />
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="btn-primary h-10 w-10 flex items-center justify-center"
                        >
                          😊
                        </button>
                      </div>
                      
                      {showEmojiPicker && (
                        <div className="mt-2 p-2 bg-gray-800 rounded-lg">
                          <div className="grid grid-cols-8 gap-2">
                            {EMOJI_OPTIONS.map(emoji => (
                              <button
                                key={emoji}
                                type="button"
                                className="text-2xl hover:bg-gray-700 rounded p-1 transition"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    emoji
                                  });
                                  setShowEmojiPicker(false);
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-center mb-3">Devinette (cachée)</h2>
                  <p className="text-sm text-gray-light mb-4">
                    Si le destinataire répond correctement à ta devinette, il pourra voir ton surnom et tes indices.
                  </p>
                  
                  <div className="p-3 bg-purple-900/30 rounded-lg mb-4">
                    <p className="text-sm text-white">
                      <span className="text-yellow-400 font-bold">Astuce:</span> Une bonne devinette rend le jeu plus 
                      amusant ! Pose une question que seule une personne qui te connaît pourrait savoir.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-light mb-2 text-sm">
                        Ta question
                      </label>
                      <input
                        type="text"
                        name="riddleQuestion"
                        value={formData.riddleQuestion}
                        onChange={handleChange}
                        className="input w-full"
                        placeholder="Pose une question qui t'identifie..."
                      />
                      <p className="text-xs text-gray-light mt-1">
                        Ex: "Quelle est la couleur de ma voiture?" ou "Où avons-nous dîné la dernière fois?"
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-gray-light mb-2 text-sm">
                        La réponse
                      </label>
                      <input
                        type="text"
                        name="riddleAnswer"
                        value={formData.riddleAnswer}
                        onChange={handleChange}
                        className="input w-full"
                        placeholder="La réponse à ta question..."
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="btn-secondary w-1/2"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-1/2 flex items-center justify-center"
                  >
                    {isLoading ? (
                      "Envoi..."
                    ) : (
                      <>
                        <FaPaperPlane className="mr-2" />
                        Envoyer
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-gray-light text-sm">
              Envie de recevoir des messages aussi?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Créez votre compte
              </Link>
            </p>
          </div>
        </motion.div>
      </main>
      
      {!isAuthenticated && (
        <>
          {/* Modal de connexion */}
          {showLoginModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md relative">
                <button 
                  onClick={() => setShowLoginModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                  <FaTimes />
                </button>
                
                <h2 className="text-2xl font-bold mb-6 text-center">Connexion</h2>
                
                {loginError && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
                    <p className="text-red-400 text-sm">{loginError}</p>
                  </div>
                )}
                
                <form onSubmit={handleLogin}>
                  <div className="mb-4">
                    <label className="block text-gray-light mb-2">
                      Numéro de téléphone
                    </label>
                    <div className="flex">
                      <div className="bg-gray-800 flex items-center justify-center px-3 rounded-l-lg border-r border-gray-700">
                        <span className="text-gray-400">+237</span>
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={loginForm.phone}
                        onChange={handleLoginChange}
                        className="input rounded-l-none w-full"
                        placeholder="612345678"
                        maxLength={9}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-gray-light mb-2">
                      Mot de passe
                    </label>
                    <div className="relative">
                    <input
                        type={showLoginPassword ? "text" : "password"}
                      name="password"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      className="input w-full"
                      required
                    />
                      <button
                        type="button"
                        className="absolute top-3 right-3 text-gray-light hover:text-white transition-colors"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                      >
                        {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="btn-primary w-full mb-4"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                        Connexion...
                      </span>
                    ) : (
                      "Se connecter"
                    )}
                  </button>
                </form>
                
                <p className="text-center text-gray-light text-sm">
                  Pas encore de compte?{" "}
                  <button 
                    className="text-primary hover:underline"
                    onClick={() => {
                      setShowLoginModal(false);
                      setShowRegisterModal(true);
                    }}
                  >
                    Créer un compte
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Modal d'inscription */}
          {showRegisterModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md relative">
                <button 
                  onClick={() => setShowRegisterModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                  <FaTimes />
                </button>
                
                <h2 className="text-2xl font-bold mb-6 text-center">Créer un compte</h2>
                
                {registerError && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
                    <p className="text-red-400 text-sm">{registerError}</p>
                  </div>
                )}
                
                <form onSubmit={handleRegister}>
                  <div className="mb-4">
                    <label className="block text-gray-light mb-2">
                      Nom d'utilisateur
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="username"
                        value={registerForm.username}
                        onChange={handleRegisterChange}
                        className={`input w-full ${
                          usernameAvailable === true 
                            ? 'border-green-500' 
                            : usernameAvailable === false 
                              ? 'border-red-500' 
                              : ''
                        }`}
                        minLength={3}
                        required
                      />
                      {isCheckingUsername && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                        </div>
                      )}
                      {!isCheckingUsername && usernameAvailable === true && registerForm.username.trim() !== '' && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                          <FaCheck />
                        </div>
                      )}
                      {!isCheckingUsername && usernameAvailable === false && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                          <FaTimes />
                        </div>
                      )}
                    </div>
                    {!isCheckingUsername && usernameAvailable === false && (
                      <p className="text-red-400 text-xs mt-1">Ce nom d'utilisateur est déjà pris</p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-light mb-2">
                      Numéro de téléphone
                    </label>
                    <div className="flex">
                      <div className="bg-gray-800 flex items-center justify-center px-3 rounded-l-lg border-r border-gray-700">
                        <span className="text-gray-400">+237</span>
                      </div>
                      <div className="relative flex-1">
                        <input
                          type="tel"
                          name="phone"
                          value={registerForm.phone}
                          onChange={handleRegisterChange}
                          className={`input rounded-l-none w-full ${
                            phoneAvailable === true 
                              ? 'border-green-500' 
                              : phoneAvailable === false 
                                ? 'border-red-500' 
                                : ''
                          }`}
                          placeholder="612345678"
                          maxLength={9}
                          required
                        />
                        {isCheckingPhone && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
                          </div>
                        )}
                        {!isCheckingPhone && phoneAvailable === true && registerForm.phone.trim() !== '' && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
                            <FaCheck />
                          </div>
                        )}
                        {!isCheckingPhone && phoneAvailable === false && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                            <FaTimes />
                          </div>
                        )}
                      </div>
                    </div>
                    {!isCheckingPhone && phoneAvailable === false && (
                      <p className="text-red-400 text-xs mt-1">Ce numéro de téléphone est déjà utilisé</p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-light mb-2">
                      Mot de passe
                    </label>
                    <div className="relative">
                    <input
                        type={showRegisterPassword ? "text" : "password"}
                      name="password"
                      value={registerForm.password}
                      onChange={handleRegisterChange}
                      className="input w-full"
                      required
                    />
                      <button
                        type="button"
                        className="absolute top-3 right-3 text-gray-light hover:text-white transition-colors"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      >
                        {showRegisterPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-gray-light mb-2">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative">
                    <input
                        type={showRegisterPassword2 ? "text" : "password"}
                      name="password2"
                      value={registerForm.password2}
                      onChange={handleRegisterChange}
                      className="input w-full"
                      required
                    />
                      <button
                        type="button"
                        className="absolute top-3 right-3 text-gray-light hover:text-white transition-colors"
                        onClick={() => setShowRegisterPassword2(!showRegisterPassword2)}
                      >
                        {showRegisterPassword2 ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="btn-primary w-full mb-4"
                    disabled={isLoading || usernameAvailable === false || phoneAvailable === false}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                        Création en cours...
                      </span>
                    ) : (
                      "Créer mon compte"
                    )}
                  </button>
                </form>
                
                <p className="text-center text-gray-light text-sm">
                  Déjà un compte?{" "}
                  <button 
                    className="text-primary hover:underline"
                    onClick={() => {
                      setShowRegisterModal(false);
                      setShowLoginModal(true);
                    }}
                  >
                    Se connecter
                  </button>
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Composant principal qui enveloppe le contenu dans Suspense
export default function SendMessage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <SearchParamsWrapper />
    </Suspense>
  );
}