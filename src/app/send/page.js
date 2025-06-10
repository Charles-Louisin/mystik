"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaArrowLeft, FaUser, FaSmile, FaQuestion, FaLightbulb, FaPaperPlane, FaSearch, FaTimes, FaSignInAlt, FaUserPlus, FaCheck, FaEye, FaEyeSlash } from "react-icons/fa";
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

export default function SendMessage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipientLink = searchParams.get("to");
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
  
  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      setAuthToken(token);
      
      // Récupérer les infos de l'utilisateur
      const fetchUserData = async () => {
        try {
          const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:5000' 
            : window.location.origin;
          
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
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin;
      
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
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin;
      
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
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };
  
  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Vérifier si l'utilisateur a activé l'option d'envoi en tant qu'utilisateur connecté mais n'est pas authentifié
    if (sendAsAuthenticated && !isAuthenticated) {
      toast.info("Vous devez vous connecter pour envoyer en tant qu'utilisateur identifiable");
      setShowLoginModal(true);
      return;
    }
    
    // Forcer la valeur de sendAsAuthenticated à false si l'utilisateur n'est pas connecté
    const actualSendAsAuthenticated = isAuthenticated ? sendAsAuthenticated : false;
    
    setIsLoading(true);
    
    try {
      // Utiliser l'origine de la fenêtre au lieu d'une URL codée en dur
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin;
      
      // Préparer les données pour l'API
      const messageData = {
        recipientLink: formData.recipientLink,
        content: formData.content,
        nickname: formData.nickname || undefined,
        hint: formData.hint || undefined,
        emoji: formData.emoji || undefined,
        emotionalFilter: formData.emotionalFilter,
        customMask: formData.customMask || undefined,
        scheduledDate: formData.scheduledDate || undefined,
        revealCondition: formData.revealCondition.type !== "aucune" ? formData.revealCondition : undefined
      };
      
      // Ajouter l'ID de l'utilisateur si authentifié et option choisie
      if (isAuthenticated && actualSendAsAuthenticated && authUser) {
        messageData.realUserId = authUser._id;
        messageData.sendAsAuthenticated = true;
      }
      
      // Ajouter la devinette si elle est remplie
      if (formData.riddleQuestion && formData.riddleAnswer) {
        messageData.riddle = {
          question: formData.riddleQuestion,
          answer: formData.riddleAnswer
        };

        // Si une devinette est spécifiée mais pas de condition de révélation, utiliser la devinette comme condition
        if (formData.revealCondition.type === "aucune") {
          messageData.revealCondition = {
            type: "devinette",
            details: {
              question: formData.riddleQuestion
            }
          };
        }
      }
      
      console.log("Sending message data:", messageData);
      
      // Ajouter le token d'authentification si l'utilisateur est connecté
      const headers = isAuthenticated && actualSendAsAuthenticated 
        ? { Authorization: `Bearer ${authToken}` }
        : {};
      
      // Envoyer le message
      await axios.post(`${apiBaseUrl}/api/messages/send`, messageData, { headers });
      
      toast.success("Message envoyé avec succès!");
      
      // Extraire le username du lien pour le passer à la page de succès
      let username = '';
      if (recipient && recipient.uniqueLink) {
        username = recipient.uniqueLink.startsWith('@') 
          ? recipient.uniqueLink.substring(1) 
          : recipient.uniqueLink;
      }
      
      // Rediriger vers la page de succès avec le username pour pouvoir y revenir
      router.push(`/send/success?to=${encodeURIComponent(recipient ? recipient.uniqueLink : 'anonyme')}&username=${encodeURIComponent(username)}`);
    } catch (error) {
      console.error("Erreur d'envoi de message:", error);
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setIsLoading(false);
    }
  };
  
  const getSelectedFilter = () => {
    return emotionalFilters.find(filter => filter.id === formData.emotionalFilter) || emotionalFilters[0];
  };
  
  const selectedFilter = getSelectedFilter();
  
  const handleLoginChange = (e) => {
    setLoginForm({
      ...loginForm,
      [e.target.name]: e.target.value
    });
  };
  
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    
    setRegisterForm({
      ...registerForm,
      [name]: value
    });
    
    // Vérifier la disponibilité du nom d'utilisateur
    if (name === 'username' && value.trim().length >= 3) {
      checkUsernameAvailability(value);
    }
    
    // Vérifier la disponibilité du numéro de téléphone
    if (name === 'phone' && value.trim().length >= 9) {
      checkPhoneAvailability(value);
    }
  };
  
  // Fonction pour vérifier la disponibilité du nom d'utilisateur
  const checkUsernameAvailability = async (username) => {
    if (username.trim().length < 3) return;
    
    try {
      setIsCheckingUsername(true);
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin;
      
      const { data } = await axios.get(`${apiBaseUrl}/api/auth/check-username/${username}`);
      setUsernameAvailable(data.available);
    } catch (error) {
      console.error("Erreur lors de la vérification du nom d'utilisateur:", error);
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };
  
  // Fonction pour vérifier la disponibilité du numéro de téléphone
  const checkPhoneAvailability = async (phone) => {
    if (phone.trim().length < 9) return;
    
    try {
      setIsCheckingPhone(true);
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin;
      
      // Formatage du numéro avec +237
      const formattedPhone = `+237${phone}`;
      
      const { data } = await axios.get(`${apiBaseUrl}/api/auth/check-phone/${encodeURIComponent(formattedPhone)}`);
      setPhoneAvailable(data.available);
    } catch (error) {
      console.error("Erreur lors de la vérification du numéro de téléphone:", error);
      setPhoneAvailable(null);
    } finally {
      setIsCheckingPhone(false);
    }
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    // Validation simple du téléphone
    const phoneRegex = /^\d{9}$/;
    if (!phoneRegex.test(loginForm.phone)) {
      setLoginError("Veuillez entrer un numéro de téléphone valide (9 chiffres)");
      return;
    }
    
    try {
      setIsLoading(true);
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin;
      
      // Formatage du numéro avec +237
      const formattedPhone = `+237${loginForm.phone}`;
      
      const { data } = await axios.post(`${apiBaseUrl}/api/auth/login`, {
        phone: formattedPhone,
        password: loginForm.password
      });
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        setIsAuthenticated(true);
        setAuthToken(data.token);
        setAuthUser(data.user);
        setSendAsAuthenticated(true);
        setShowLoginModal(false);
        toast.success("Connexion réussie!");
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      setLoginError(error.response?.data?.msg || "Échec de la connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError('');
    
    // Vérification des mots de passe
    if (registerForm.password !== registerForm.password2) {
      setRegisterError("Les mots de passe ne correspondent pas");
      return;
    }
    
    // Validation du nom d'utilisateur
    if (registerForm.username.length < 3) {
      setRegisterError("Le nom d'utilisateur doit contenir au moins 3 caractères");
      return;
    }
    
    // Validation simple du téléphone
    const phoneRegex = /^\d{9}$/;
    if (!phoneRegex.test(registerForm.phone)) {
      setRegisterError("Veuillez entrer un numéro de téléphone valide (9 chiffres)");
      return;
    }
    
    // Vérification de la disponibilité du nom d'utilisateur
    if (usernameAvailable === false) {
      setRegisterError("Ce nom d'utilisateur est déjà pris. Veuillez en choisir un autre.");
      return;
    }
    
    // Vérification de la disponibilité du numéro de téléphone
    if (phoneAvailable === false) {
      setRegisterError("Ce numéro de téléphone est déjà utilisé. Veuillez en utiliser un autre.");
      return;
    }
    
    try {
      setIsLoading(true);
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:5000' 
        : window.location.origin;
      
      // Formatage du numéro avec +237
      const formattedPhone = `+237${registerForm.phone}`;
      
      const { data } = await axios.post(`${apiBaseUrl}/api/auth/register`, {
        username: registerForm.username,
        phone: formattedPhone,
        password: registerForm.password
      });
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        setIsAuthenticated(true);
        setAuthToken(data.token);
        setAuthUser(data.user);
        setSendAsAuthenticated(true);
        setShowRegisterModal(false);
        toast.success("Compte créé avec succès!");
      }
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      setRegisterError(error.response?.data?.msg || "Échec de l'inscription. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Effet pour désactiver l'option d'envoi en tant qu'utilisateur authentifié si l'utilisateur se déconnecte
  useEffect(() => {
    if (!isAuthenticated) {
      setSendAsAuthenticated(false);
    }
  }, [isAuthenticated]);
  
  // Fonction pour gérer la bascule de l'option d'envoi en tant qu'utilisateur connecté
  const handleSendAsAuthenticatedToggle = () => {
    if (!isAuthenticated) {
      // Si l'utilisateur n'est pas connecté, afficher le modal de connexion et ne pas basculer l'option
      toast.info("Vous devez vous connecter pour utiliser cette option");
      setShowLoginModal(true);
      // S'assurer que l'option reste désactivée
      setSendAsAuthenticated(false);
    } else {
      // Si l'utilisateur est connecté, basculer normalement
      setSendAsAuthenticated(!sendAsAuthenticated);
    }
  };
  
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
                          onChange={handleSendAsAuthenticatedToggle}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                        <span className="ml-3 text-sm font-medium text-white">
                          {sendAsAuthenticated 
                            ? "Je veux être identifiable" 
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