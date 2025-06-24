"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaArrowLeft, FaClock, FaCalendarAlt } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";

export default function ScheduledMessages() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [countdowns, setCountdowns] = useState({});
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    const token = localStorage.getItem("token");
    
    if (!token) {
      router.push("/login");
      return;
    }
    
    fetchScheduledMessages();
    
    // Mettre à jour les comptes à rebours chaque seconde
    const interval = setInterval(() => {
      updateCountdowns();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [router]);
  
  const fetchScheduledMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
      
      const { data } = await axios.get(`${apiBaseUrl}/api/messages/scheduled-details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setScheduledMessages(data.messages || []);
      initializeCountdowns(data.messages || []);
      setLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement des messages programmés:", error);
      toast.error("Impossible de charger les messages programmés");
      setLoading(false);
    }
  };
  
  const initializeCountdowns = (messages) => {
    const newCountdowns = {};
    
    messages.forEach(message => {
      const targetDate = new Date(message.scheduled.revealDate);
      const now = new Date();
      const timeLeft = targetDate - now;
      
      if (timeLeft > 0) {
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        newCountdowns[message._id] = {
          days,
          hours,
          minutes,
          seconds
        };
      }
    });
    
    setCountdowns(newCountdowns);
  };
  
  const updateCountdowns = () => {
    setCountdowns(prevCountdowns => {
      const newCountdowns = { ...prevCountdowns };
      
      Object.keys(newCountdowns).forEach(messageId => {
        const message = scheduledMessages.find(msg => msg._id === messageId);
        
        // Vérifier si le message existe et a les propriétés nécessaires
        if (!message || !message.scheduled || !message.scheduled.revealDate) {
          return;
        }
        
        const targetDate = new Date(message.scheduled.revealDate);
        const now = new Date();
        const timeLeft = targetDate - now;
        
        if (timeLeft <= 0) {
          // Au lieu de supprimer le compte à rebours, on le met à zéro
          newCountdowns[messageId] = {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0
          };
          
          // Éventuellement, rafraîchir la liste des messages si un compte à rebours expire
          if (Object.keys(newCountdowns).length === 0) {
            fetchScheduledMessages();
          }
        } else {
          const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
          
          newCountdowns[messageId] = {
            days,
            hours,
            minutes,
            seconds
          };
        }
      });
      
      return newCountdowns;
    });
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-gray-800 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            <button 
              onClick={() => router.push('/dashboard')}
              className="text-gray-light hover:text-white mr-4"
            >
              <FaArrowLeft />
            </button>
            <h1 className="text-xl font-bold">Messages du futur</h1>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-4 md:py-8 pt-8 md:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card p-4 md:p-6 mb-4 md:mb-6"
        >
          <div className="flex items-center mb-3 md:mb-4">
            <FaClock className="text-primary text-lg md:text-xl mr-2 md:mr-3" />
            <h2 className="text-base md:text-lg font-semibold">Messages en attente de révélation</h2>
          </div>
          
          <p className="text-gray-light text-sm md:text-base mb-4 md:mb-6">
            Ces messages vous seront révélés automatiquement à la date prévue. Vous recevrez une notification lorsqu'ils seront disponibles.
          </p>
          
          {scheduledMessages.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <FaCalendarAlt className="text-3xl md:text-4xl text-gray-700 mx-auto mb-3 md:mb-4" />
              <h3 className="text-base md:text-lg font-medium mb-2">Pas de messages programmés</h3>
              <p className="text-sm md:text-base text-gray-light">
                Aucun message du futur n'est actuellement en attente.
              </p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {scheduledMessages.map(message => (
                <motion.div
                  key={message._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="border border-gray-800 rounded-lg p-3 md:p-4"
                >
                  <div className="flex justify-between items-start mb-2 md:mb-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-800 flex items-center justify-center mr-2 md:mr-3">
                        <span className="text-lg md:text-xl">🕒</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm md:text-base">Message mystère</h4>
                        <span className="text-xs text-gray-light">
                          Prévu pour: {formatDate(message.scheduled.revealDate)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-gray-800 px-2 md:px-3 py-1 rounded text-xs md:text-sm">
                      Message du futur
                    </div>
                  </div>
                  
                  {countdowns[message._id] && (
                    <div className="mt-3 md:mt-4 bg-gray-800 p-2 md:p-3 rounded-lg">
                      <p className="text-xs md:text-sm text-gray-light mb-1 md:mb-2">Temps restant:</p>
                      <div className="grid grid-cols-4 gap-1 md:gap-2 text-center">
                        <div className="bg-background rounded p-1 md:p-2">
                          <div className="text-base md:text-xl font-bold">{countdowns[message._id].days}</div>
                          <div className="text-xs text-gray-light">Jours</div>
                        </div>
                        <div className="bg-background rounded p-1 md:p-2">
                          <div className="text-base md:text-xl font-bold">{countdowns[message._id].hours}</div>
                          <div className="text-xs text-gray-light">Heures</div>
                        </div>
                        <div className="bg-background rounded p-1 md:p-2">
                          <div className="text-base md:text-xl font-bold">{countdowns[message._id].minutes}</div>
                          <div className="text-xs text-gray-light">Minutes</div>
                        </div>
                        <div className="bg-background rounded p-1 md:p-2">
                          <div className="text-base md:text-xl font-bold">{countdowns[message._id].seconds}</div>
                          <div className="text-xs text-gray-light">Secondes</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 md:mt-4 border-t border-gray-800 pt-2 md:pt-3">
                    <p className="text-xs md:text-sm text-gray-light">
                      Ce message est programmé et sera automatiquement révélé à la date prévue.
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
} 