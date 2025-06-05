"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaArrowLeft, FaUser, FaSmile, FaQuestion, FaLightbulb, FaPaperPlane, FaSearch } from "react-icons/fa";
import toast from "react-hot-toast";
import axios from "axios";

const emotionalFilters = [
  { id: "neutre", name: "Neutre", color: "#9e9e9e" },
  { id: "amour", name: "Amour", color: "#e91e63" },
  { id: "colère", name: "Colère", color: "#f44336" },
  { id: "admiration", name: "Admiration", color: "#8bc34a" },
  { id: "regret", name: "Regret", color: "#607d8b" },
  { id: "joie", name: "Joie", color: "#ffeb3b" },
  { id: "tristesse", name: "Tristesse", color: "#2196f3" }
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
    emotionalFilter: "neutre"
  });
  
  const [recipient, setRecipient] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  const [step, setStep] = useState(recipientLink ? 2 : 1);
  const [charCount, setCharCount] = useState(0);
  const MIN_CHAR_COUNT = 5;
  
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
        emotionalFilter: formData.emotionalFilter
      };
      
      // Ajouter la devinette si elle est remplie
      if (formData.riddleQuestion && formData.riddleAnswer) {
        messageData.riddle = {
          question: formData.riddleQuestion,
          answer: formData.riddleAnswer
        };
      }
      
      console.log("Sending message data:", messageData);
      
      // Envoyer le message
      await axios.post(`${apiBaseUrl}/api/messages/send`, messageData);
      
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
                
                {/* {recipient && (
                  <div className="bg-gray-800 rounded-lg p-4 mb-6 flex items-center">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                      {recipient.profileImage ? (
                        <Image 
                          src={recipient.profileImage} 
                          alt="Photo de profil" 
                          width={48} 
                          height={48}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <FaUser className="text-2xl text-gray-light" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">Destinataire trouvé</h3>
                      <p className="text-gray-light text-sm">{recipient.uniqueLink}</p>
                    </div>
                  </div>
                )} */}

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
                  <label className="block text-gray-light mb-2">
                    Ton humeur (facultatif)
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {emotionalFilters.map(filter => (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => handleEmotionalFilterSelect(filter.id)}
                        className={`p-2 rounded-lg text-center text-xs transition ${
                          formData.emotionalFilter === filter.id
                            ? 'border-2 border-white'
                            : 'border border-gray-800'
                        }`}
                        style={{ 
                          backgroundColor: `${filter.color}20`,
                          color: filter.color
                        }}
                      >
                        {filter.name}
                      </button>
                    ))}
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
                <h1 className="text-xl font-bold text-center mb-6">
                  Laisse des indices pour que le destinataire puisse deviner qui tu es (facultatif)
                </h1>
                
                <div className="mb-6">
                  <label className="block text-gray-light mb-2 flex items-center">
                    <FaUser className="mr-2" />
                    Ton surnom (facultatif)
                  </label>
                  <input
                    type="text"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="Comment veux-tu être appelé?"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-light mb-2 flex items-center">
                    <FaLightbulb className="mr-2" />
                    Un indice (facultatif)
                  </label>
                  <input
                    type="text"
                    name="hint"
                    value={formData.hint}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="Donne un indice sur ton identité"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-light mb-2 flex items-center">
                    <FaSmile className="mr-2" />
                    Un emoji (facultatif)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {["😊", "😎", "🥸", "🤫", "😏", "😉", "👽", "👻", "🤖", "🦸"].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleEmojiSelect(emoji)}
                        className={`p-3 text-xl rounded-lg ${
                          formData.emoji === emoji 
                            ? 'bg-primary/30 border border-primary' 
                            : 'bg-gray-800'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-light mb-2 flex items-center">
                    <FaQuestion className="mr-2" />
                    Une devinette (facultatif)
                  </label>
                  <input
                    type="text"
                    name="riddleQuestion"
                    value={formData.riddleQuestion}
                    onChange={handleChange}
                    className="input w-full mb-2"
                    placeholder="Ta question"
                  />
                  <input
                    type="text"
                    name="riddleAnswer"
                    value={formData.riddleAnswer}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="La réponse (visible uniquement si devinée)"
                  />
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
    </div>
  );
}