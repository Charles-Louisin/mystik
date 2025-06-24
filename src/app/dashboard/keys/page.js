"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaArrowLeft, FaKey, FaAd, FaUsers, FaShareAlt, FaCrown } from "react-icons/fa";
import toast from "react-hot-toast";
import axios from "axios";

const keyMethods = [
  {
    id: "ad",
    name: "Regarder une publicité",
    description: "Obtiens 1 clé en regardant une publicité",
    icon: <FaAd className="text-primary text-xl" />,
    keys: 1
  },
  {
    id: "referral",
    name: "Inviter des amis",
    description: "Obtiens 3 clés quand un ami s'inscrit avec ton lien",
    icon: <FaUsers className="text-primary text-xl" />,
    keys: 3
  },
  {
    id: "social_share",
    name: "Partager sur les réseaux",
    description: "Obtiens 2 clés en partageant ton profil",
    icon: <FaShareAlt className="text-primary text-xl" />,
    keys: 2
  },
  {
    id: "premium",
    name: "Passer Premium",
    description: "Obtiens 10 clés et plein d'autres avantages!",
    icon: <FaCrown className="text-primary text-xl" />,
    keys: 10,
    isPremium: true
  }
];

export default function GetKeys() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingMethod, setProcessingMethod] = useState(null);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      router.push("/login");
      return;
    }
    
    const fetchUserData = async () => {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
        
        const { data } = await axios.get(`${apiBaseUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUser(data.user);
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
  
  const handleGetKeys = async (method) => {
    if (processingMethod) return;
    
    setProcessingMethod(method);
    
    try {
      const token = localStorage.getItem("token");
      
      // Simuler le visionnage d'une publicité ou le partage social
      if (method === "ad" || method === "social_share") {
        // Attendre quelques secondes pour simuler une action
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
      
      // Appeler l'API pour ajouter des clés
      const { data } = await axios.post(
        `${apiBaseUrl}/api/users/reveal-keys`,
        { method },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Mettre à jour le nombre de clés dans l'état local
      setUser({
        ...user,
        revealKeys: data.revealKeys
      });
      
      const methodInfo = keyMethods.find(m => m.id === method);
      toast.success(`${methodInfo.keys} clé${methodInfo.keys > 1 ? 's' : ''} ajoutée${methodInfo.keys > 1 ? 's' : ''} !`);
    } catch (error) {
      console.error("Erreur lors de l'obtention des clés:", error);
      const errorMessage = error.response?.data?.message || "Erreur lors de l'obtention des clés";
      toast.error(errorMessage);
    } finally {
      setProcessingMethod(null);
    }
  };
  
  const handleShare = async () => {
    const shareData = {
      title: "Mystik - Envoyez-moi un message anonyme",
      text: "Dis-moi ce que tu penses, reste dans l'ombre avec Mystik!",
      url: `https://mystik.app/@${user?.uniqueLink.replace('@', '') || ''}`
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        handleGetKeys("social_share");
      } else {
        // Copier le lien si le partage n'est pas supporté
        navigator.clipboard.writeText(shareData.url);
        toast.success("Lien copié dans le presse-papier!");
        handleGetKeys("social_share");
      }
    } catch (error) {
      console.error("Erreur lors du partage:", error);
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
            className="text-center mb-8"
          >
            <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <FaKey className="text-primary text-3xl" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">
              Obtenir des clés de révélation
            </h1>
            
            <p className="text-gray-light">
              Tu as actuellement <span className="text-white font-medium">{user?.revealKeys || 0}</span> clé{user?.revealKeys !== 1 ? 's' : ''}
            </p>
          </motion.div>
          
          <div className="grid gap-4">
            {keyMethods.map((method) => (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: keyMethods.indexOf(method) * 0.1 }}
                className="card p-4 hover:translate-y-[-4px] transition-transform"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-4">
                      {method.icon}
                    </div>
                    
                    <div>
                      <h3 className="font-medium">{method.name}</h3>
                      <p className="text-sm text-gray-light">{method.description}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => method.id === "social_share" ? handleShare() : handleGetKeys(method.id)}
                    disabled={processingMethod === method.id}
                    className={`btn-primary py-2 px-4 flex items-center text-sm ${
                      method.isPremium ? 'bg-gradient-to-r from-yellow-500 to-yellow-700' : ''
                    } ${processingMethod === method.id ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    {processingMethod === method.id ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-white animate-spin mr-2"></div>
                        En cours...
                      </>
                    ) : (
                      <>
                        +{method.keys} clé{method.keys > 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <Link href="/dashboard" className="text-primary hover:underline">
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
} 