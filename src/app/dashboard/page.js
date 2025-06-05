"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaShareAlt, FaCopy, FaBell, FaUserCircle, FaKey, FaSignOutAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import axios from "axios";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("messages");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  
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
        
        setMessages(messagesData);
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
                            className={`card p-4 border ${!message.read ? 'border-primary' : 'border-gray-800'}`}
                            onClick={() => !message.read && markAsRead(message._id)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center">
                                <div 
                                  className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                                  style={{ 
                                    backgroundColor: message.sender.identityRevealed ? '#4f46e5' : '#374151'
                                  }}
                                >
                                  {message.sender.emoji || '👤'}
                                </div>
                                <div>
                                  <h4 className="font-medium">
                                    {message.sender.identityRevealed 
                                      ? message.sender.nickname 
                                      : message.sender.nickname || "Anonyme"}
                                  </h4>
                                  <span className="text-xs text-gray-light">
                                    {getDateFormatted(message.createdAt)}
                                  </span>
                                </div>
                              </div>
                              
                              {!message.read && (
                                <span className="bg-primary px-2 py-1 text-xs rounded-full">
                                  Nouveau
                                </span>
                              )}
                            </div>
                            
                            <p className="mb-4">{message.content}</p>
                            
                            {(message.clues.hint || message.clues.riddle) && (
                              <div className="mt-4 pt-4 border-t border-gray-800">
                                <p className="text-sm text-gray-light mb-2">Indices laissés :</p>
                                
                                {message.clues.hint && (
                                  <div className="mb-2">
                                    <span className="text-xs text-primary">Indice:</span>
                                    <p className="text-sm">{message.clues.hint}</p>
                                  </div>
                                )}
                                
                                {message.clues.riddle && (
                                  <div>
                                    <span className="text-xs text-primary">Devinette:</span>
                                    <p className="text-sm">{message.clues.riddle.question}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {!message.sender.identityRevealed && (
                              <div className="mt-4 flex justify-end">
                                <button 
                                  className="btn-sm bg-purple-700 hover:bg-purple-600 transition flex items-center"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Modal pour révéler l'identité
                                  }}
                                >
                                  <FaKey className="mr-2" size={12} />
                                  Révéler
                                </button>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === "settings" && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Paramètres du compte</h3>
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
                        <h4 className="font-medium mb-2">Clés de révélation</h4>
                        <p className="text-sm text-gray-light mb-4">
                          Obtenez des clés pour révéler l'identité des expéditeurs
                        </p>
                        <button className="btn-primary w-full">
                          Obtenir des clés
                        </button>
                      </div>
                      
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
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="py-4 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center text-sm text-gray-light">
          <p>© {new Date().getFullYear()} Mystik - Tous droits réservés</p>
        </div>
      </footer>
    </div>
  );
} 