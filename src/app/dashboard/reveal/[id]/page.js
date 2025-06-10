"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaArrowLeft, FaKey, FaQuestion, FaLock, FaUser } from "react-icons/fa";
import toast from "react-hot-toast";
import axios from "axios";

export default function RevealIdentity() {
  const router = useRouter();
  const { id } = useParams();
  const [message, setMessage] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revealMethod, setRevealMethod] = useState("key");
  const [answer, setAnswer] = useState("");
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [revealedInfo, setRevealedInfo] = useState(null);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      router.push("/login");
      return;
    }
    
    const fetchData = async () => {
      try {
        // Récupérer les informations de l'utilisateur
        const { data: userData } = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUser(userData.user);
        
        // Récupérer tous les messages
        const { data: messagesData } = await axios.get("http://localhost:5000/api/messages/received", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Trouver le message spécifique
        const foundMessage = messagesData.find(msg => msg._id === id);
        
        if (!foundMessage) {
          toast.error("Message non trouvé");
          router.push("/dashboard");
          return;
        }
        
        setMessage(foundMessage);
        
        // Vérifier si l'identité est déjà révélée
        if (foundMessage.sender.identityRevealed) {
          setRevealed(true);
          setRevealedInfo({
            nickname: foundMessage.sender.nickname,
            location: foundMessage.sender.location
          });
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
        toast.error("Erreur lors de la récupération des données");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, router]);
  
  const handleReveal = async () => {
    if (revealLoading) return;
    
    if (revealMethod === "riddle" && !answer.trim()) {
      toast.error("Veuillez entrer une réponse à la devinette");
      return;
    }
    
    if (revealMethod === "key" && (!user || user.revealKeys <= 0)) {
      toast.error("Vous n'avez pas assez de clés");
      return;
    }
    
    setRevealLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `http://localhost:5000/api/messages/${id}/reveal`,
        {
          method: revealMethod,
          answer: answer
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setRevealed(true);
      setRevealedInfo(data.sender);
      
      if (revealMethod === "key") {
        // Mettre à jour le nombre de clés
        setUser({
          ...user,
          revealKeys: user.revealKeys - 1
        });
      }
      
      toast.success("Identité révélée avec succès");
    } catch (error) {
      console.error("Erreur lors de la révélation de l'identité:", error);
      const errorMessage = error.response?.data?.message || "Erreur lors de la révélation de l'identité";
      toast.error(errorMessage);
    } finally {
      setRevealLoading(false);
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
        <div className="container mx-auto px-4 flex items-center">
          <Link href="/dashboard" className="text-gray-light hover:text-white flex items-center">
            <FaArrowLeft className="mr-2" />
            <span>Retour</span>
          </Link>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="card p-6 md:p-8"
          >
            <h1 className="text-2xl font-bold mb-6 text-center">
              {revealed ? "Identité révélée" : "Découvrir l'identité"}
            </h1>
            
            {/* Aperçu du message */}
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <div className="flex items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                  <FaUser className="text-gray-500" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {message.sender.identityRevealed 
                      ? message.sender.nickname 
                      : "Anonyme"}
                  </h3>
                  <p className="text-sm text-gray-light line-clamp-1">
                    {message.content}
                  </p>
                </div>
              </div>
              
              {message.clues && message.sender.identityRevealed && (
                <div className="mt-2">
                  {message.clues.emoji && (
                    <span className="text-2xl mr-2">{message.clues.emoji}</span>
                  )}
                  {message.clues.hint && (
                    <span className="text-gray-light text-sm">{message.clues.hint}</span>
                  )}
                </div>
              )}
              
              {message.clues && !message.sender.identityRevealed && (
                <div className="mt-2">
                  <p className="text-xs text-gray-light">
                    Ce message contient des indices cachés que vous pourrez découvrir après révélation
                  </p>
                </div>
              )}
            </div>
            
            {revealed ? (
              <div className="bg-primary/10 rounded-lg p-6 text-center">
                <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <FaUser className="text-primary text-3xl" />
                </div>
                
                <h2 className="text-xl font-bold mb-2">
                  {revealedInfo.nickname || "Anonyme"}
                </h2>
                
                {revealedInfo.location && (revealedInfo.location.city || revealedInfo.location.country) && (
                  <p className="text-gray-light mb-4">
                    {[revealedInfo.location.city, revealedInfo.location.country].filter(Boolean).join(", ")}
                  </p>
                )}
                
                <Link 
                  href="/dashboard" 
                  className="btn-primary inline-flex items-center justify-center"
                >
                  Retour aux messages
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">
                    Comment veux-tu découvrir l'identité?
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Option Clé */}
                    <div 
                      className={`p-4 rounded-lg cursor-pointer border ${
                        revealMethod === "key" 
                          ? "border-primary bg-primary/10" 
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                      onClick={() => setRevealMethod("key")}
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                          <FaKey className="text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">Utiliser une clé</h4>
                          <p className="text-sm text-gray-light">
                            {user?.revealKeys || 0} clés disponibles
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Option Devinette - si disponible */}
                    {message.clues && message.clues.riddle && (
                      <div 
                        className={`p-4 rounded-lg cursor-pointer border ${
                          revealMethod === "riddle" 
                            ? "border-primary bg-primary/10" 
                            : "border-gray-700 hover:border-gray-600"
                        }`}
                        onClick={() => setRevealMethod("riddle")}
                      >
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                            <FaQuestion className="text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">Répondre à la devinette</h4>
                          </div>
                        </div>
                        
                        <div className="ml-13">
                          <p className="text-sm mb-2">
                            {message.clues.riddle.question}
                          </p>
                          
                          {revealMethod === "riddle" && (
                            <input
                              type="text"
                              value={answer}
                              onChange={(e) => setAnswer(e.target.value)}
                              placeholder="Ta réponse"
                              className="input w-full mt-2"
                            />
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Option Défi - si disponible */}
                    {message.revealCondition && message.revealCondition.type === "défi" && (
                      <div 
                        className={`p-4 rounded-lg cursor-pointer border ${
                          revealMethod === "challenge" 
                            ? "border-primary bg-primary/10" 
                            : "border-gray-700 hover:border-gray-600"
                        }`}
                        onClick={() => setRevealMethod("challenge")}
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                            <FaLock className="text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">Relever un défi</h4>
                            <p className="text-sm text-gray-light">
                              Fonctionnalité à venir
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={handleReveal}
                  disabled={
                    revealLoading || 
                    (revealMethod === "key" && (!user || user.revealKeys <= 0))
                  }
                  className={`btn-primary w-full ${
                    (revealMethod === "key" && (!user || user.revealKeys <= 0))
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {revealLoading ? "Révélation en cours..." : "Révéler l'identité"}
                </button>
                
                {revealMethod === "key" && (!user || user.revealKeys <= 0) && (
                  <div className="text-center">
                    <Link 
                      href="/dashboard/keys" 
                      className="text-primary hover:underline text-sm"
                    >
                      Obtenir plus de clés
                    </Link>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
} 